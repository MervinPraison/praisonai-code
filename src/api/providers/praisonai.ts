/**
 * PraisonAI Provider
 * 
 * Connects to PraisonAI backend server (praisonai serve) for agent-based interactions.
 * This provider enables multi-agent workflows, tool calling, and PraisonAI-specific features.
 */

import { Anthropic } from "@anthropic-ai/sdk"
import axios, { AxiosError } from "axios"

import { type ModelInfo } from "@roo-code/types"

import type { ApiHandlerOptions } from "../../shared/api"

import { ApiStream, ApiStreamUsageChunk } from "../transform/stream"

import { BaseProvider } from "./base-provider"
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index"

export interface PraisonAIConfig {
	baseUrl: string
	apiKey?: string
	agentFile?: string
	framework?: string
	verbose?: boolean
}

export interface PraisonAIResponse {
	response: string
	agent?: string
	task?: string
	status?: string
	tokens_used?: number
	cost?: number
}

export class PraisonAIHandler extends BaseProvider implements SingleCompletionHandler {
	protected options: ApiHandlerOptions
	private baseUrl: string
	private apiKey?: string
	private readonly providerName = "PraisonAI"

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options
		// Default to localhost:8005 which is the default praisonai serve port
		this.baseUrl = this.options.praisonaiBaseUrl ?? "http://localhost:8005"
		this.apiKey = this.options.praisonaiApiKey
	}

	/**
	 * Complete a simple prompt without conversation context.
	 * Required by SingleCompletionHandler interface.
	 */
	async completePrompt(prompt: string): Promise<string> {
		try {
			const response = await this.sendToPraisonAI(prompt)
			return response.response
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			return `Error: ${errorMessage}`
		}
	}

	override getModel(): { id: string; info: ModelInfo; reasoning?: boolean } {
		return {
			id: this.options.praisonaiModelId ?? "praisonai-agent",
			info: {
				maxTokens: 128000,
				contextWindow: 128000,
				supportsImages: true,
				supportsPromptCache: false,
				inputPrice: 0,
				outputPrice: 0,
				description: "PraisonAI Multi-Agent Framework",
			},
		}
	}

	override async *createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): ApiStream {
		try {
			// Convert messages to a format PraisonAI understands
			const userMessage = this.extractUserMessage(messages)
			
			// Check if PraisonAI server is running
			const isServerRunning = await this.checkServerHealth()
			
			if (!isServerRunning) {
				yield {
					type: "text",
					text: "⚠️ PraisonAI server is not running. Please start it with:\n\n```bash\npraisonai serve agents.yaml\n```\n\nOr configure a different AI provider in settings.",
				}
				return
			}

			// Send request to PraisonAI server
			const response = await this.sendToPraisonAI(userMessage, systemPrompt)

			// Stream the response
			yield {
				type: "text",
				text: response.response,
			}

			// Yield usage information if available
			if (response.tokens_used) {
				yield {
					type: "usage",
					inputTokens: Math.floor(response.tokens_used * 0.3), // Estimate
					outputTokens: Math.floor(response.tokens_used * 0.7), // Estimate
					totalCost: response.cost ?? 0,
				} as ApiStreamUsageChunk
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			yield {
				type: "text",
				text: `❌ Error communicating with PraisonAI: ${errorMessage}\n\nMake sure the PraisonAI server is running with:\n\`\`\`bash\npraisonai serve agents.yaml\n\`\`\``,
			}
		}
	}

	private extractUserMessage(messages: Anthropic.Messages.MessageParam[]): string {
		// Get the last user message
		for (let i = messages.length - 1; i >= 0; i--) {
			const msg = messages[i]
			if (msg.role === "user") {
				if (typeof msg.content === "string") {
					return msg.content
				}
				// Handle array content
				if (Array.isArray(msg.content)) {
					const textParts = msg.content
						.filter((part): part is Anthropic.Messages.TextBlockParam => part.type === "text")
						.map((part) => part.text)
					return textParts.join("\n")
				}
			}
		}
		return ""
	}

	private async checkServerHealth(): Promise<boolean> {
		try {
			const response = await axios.get(`${this.baseUrl}/health`, {
				timeout: 5000,
			})
			return response.status === 200
		} catch {
			// Try alternative health check endpoints
			try {
				const response = await axios.get(`${this.baseUrl}/`, {
					timeout: 5000,
				})
				return response.status === 200
			} catch {
				return false
			}
		}
	}

	private async sendToPraisonAI(message: string, systemPrompt?: string): Promise<PraisonAIResponse> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		}

		if (this.apiKey) {
			headers["Authorization"] = `Bearer ${this.apiKey}`
		}

		try {
			// Try the chat endpoint first (for interactive mode)
			const response = await axios.post(
				`${this.baseUrl}/chat`,
				{
					message,
					system_prompt: systemPrompt,
					stream: false,
				},
				{
					headers,
					timeout: 300000, // 5 minute timeout for agent tasks
				},
			)

			return {
				response: response.data.response ?? response.data.result ?? response.data.output ?? String(response.data),
				agent: response.data.agent,
				task: response.data.task,
				status: response.data.status,
				tokens_used: response.data.tokens_used,
				cost: response.data.cost,
			}
		} catch (error) {
			// If chat endpoint doesn't exist, try the run endpoint
			if (error instanceof AxiosError && error.response?.status === 404) {
				const response = await axios.post(
					`${this.baseUrl}/run`,
					{
						input: message,
						topic: message,
					},
					{
						headers,
						timeout: 300000,
					},
				)

				return {
					response: response.data.result ?? response.data.output ?? String(response.data),
					status: "completed",
				}
			}
			throw error
		}
	}

	/**
	 * Execute a specific PraisonAI agent workflow
	 */
	async executeWorkflow(workflowName: string, input: Record<string, unknown>): Promise<PraisonAIResponse> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		}

		if (this.apiKey) {
			headers["Authorization"] = `Bearer ${this.apiKey}`
		}

		const response = await axios.post(
			`${this.baseUrl}/workflow/${workflowName}`,
			input,
			{
				headers,
				timeout: 600000, // 10 minute timeout for workflows
			},
		)

		return {
			response: response.data.result ?? response.data.output ?? String(response.data),
			status: response.data.status,
			tokens_used: response.data.tokens_used,
			cost: response.data.cost,
		}
	}

	/**
	 * List available agents from the PraisonAI server
	 */
	async listAgents(): Promise<string[]> {
		try {
			const response = await axios.get(`${this.baseUrl}/agents`, {
				timeout: 10000,
			})
			return response.data.agents ?? []
		} catch {
			return []
		}
	}

	/**
	 * Get the status of a running task
	 */
	async getTaskStatus(taskId: string): Promise<{ status: string; progress?: number; result?: string }> {
		try {
			const response = await axios.get(`${this.baseUrl}/task/${taskId}`, {
				timeout: 10000,
			})
			return response.data
		} catch {
			return { status: "unknown" }
		}
	}
}
