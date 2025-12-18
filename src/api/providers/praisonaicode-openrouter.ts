import crypto from "crypto"
import { ApiHandlerOptions, ModelRecord } from "../../shared/api"
import { CompletionUsage, OpenRouterHandler } from "./openrouter"
import { getModelParams } from "../transform/model-params"
import { getModels } from "./fetchers/modelCache"
import { DEEP_SEEK_DEFAULT_TEMPERATURE, openRouterDefaultModelId, openRouterDefaultModelInfo } from "@roo-code/types"
import { getPraisonaiUrlFromToken } from "@roo-code/types"
import { ApiHandlerCreateMessageMetadata } from ".."
import { getModelEndpoints } from "./fetchers/modelEndpointCache"
import { getPraisonaicodeDefaultModel } from "./praisonaicode/getPraisonaicodeDefaultModel"
import {
	X_PRAISONAICODE_ORGANIZATIONID,
	X_PRAISONAICODE_TASKID,
	X_PRAISONAICODE_PROJECTID,
	X_PRAISONAICODE_TESTER,
} from "../../shared/praisonaicode/headers"
import { PRAISONAICODE_TOKEN_REQUIRED_ERROR } from "../../shared/praisonaicode/errorUtils"
import { DEFAULT_HEADERS } from "./constants"
import { streamSse } from "../../services/continuedev/core/fetch/stream"

/**
 * A custom OpenRouter handler that overrides the getModel function
 * to provide custom model information and fetches models from the PraisonaiCode OpenRouter endpoint.
 */
export class PraisonaicodeOpenrouterHandler extends OpenRouterHandler {
	protected override models: ModelRecord = {}
	defaultModel: string = openRouterDefaultModelId
	private apiFIMBase: string

	protected override get providerName() {
		return "PraisonaiCode" as const
	}

	constructor(options: ApiHandlerOptions) {
		const baseApiUrl = getPraisonaiUrlFromToken("https://api.praisonai.com/api/", options.praisonaicodeToken ?? "")

		options = {
			...options,
			openRouterBaseUrl: `${baseApiUrl}openrouter/`,
			openRouterApiKey: options.praisonaicodeToken,
		}

		super(options)

		this.apiFIMBase = baseApiUrl
	}

	public getRolloutHash(): number | undefined {
		const token = this.options.praisonaicodeToken
		return !token ? undefined : crypto.createHash("sha256").update(token).digest().readUInt32BE(0)
	}

	override customRequestOptions(metadata?: ApiHandlerCreateMessageMetadata) {
		const headers: Record<string, string> = {}

		if (metadata?.taskId) {
			headers[X_PRAISONAICODE_TASKID] = metadata.taskId
		}

		const praisonaicodeOptions = this.options

		if (praisonaicodeOptions.praisonaicodeOrganizationId) {
			headers[X_PRAISONAICODE_ORGANIZATIONID] = praisonaicodeOptions.praisonaicodeOrganizationId

			if (metadata?.projectId) {
				headers[X_PRAISONAICODE_PROJECTID] = metadata.projectId
			}
		}

		// Add X-PRAISONAICODE-TESTER: SUPPRESS header if the setting is enabled
		if (
			praisonaicodeOptions.praisonaicodeTesterWarningsDisabledUntil &&
			praisonaicodeOptions.praisonaicodeTesterWarningsDisabledUntil > Date.now()
		) {
			headers[X_PRAISONAICODE_TESTER] = "SUPPRESS"
		}

		return Object.keys(headers).length > 0 ? { headers } : undefined
	}

	override getTotalCost(lastUsage: CompletionUsage): number {
		const model = this.getModel().info
		if (!model.inputPrice && !model.outputPrice) {
			return 0
		}
		// https://github.com/MervinPraison/praisonaicode-backend/blob/eb3d382df1e933a089eea95b9c4387db0c676e35/src/lib/processUsage.ts#L281
		if (lastUsage.is_byok) {
			return lastUsage.cost_details?.upstream_inference_cost || 0
		}

		return lastUsage.cost || 0
	}

	override getModel() {
		let id = this.options.praisonaicodeModel ?? this.defaultModel
		let info = this.models[id] ?? openRouterDefaultModelInfo

		// If a specific provider is requested, use the endpoint for that provider.
		if (this.options.openRouterSpecificProvider && this.endpoints[this.options.openRouterSpecificProvider]) {
			info = this.endpoints[this.options.openRouterSpecificProvider]
		}

		const isDeepSeekR1 = id.startsWith("deepseek/deepseek-r1") || id === "perplexity/sonar-reasoning"

		const params = getModelParams({
			format: "openrouter",
			modelId: id,
			model: info,
			settings: this.options,
			defaultTemperature: isDeepSeekR1 ? DEEP_SEEK_DEFAULT_TEMPERATURE : 0,
		})

		return { id, info, topP: isDeepSeekR1 ? 0.95 : undefined, ...params }
	}

	public override async fetchModel() {
		if (!this.options.praisonaicodeToken || !this.options.openRouterBaseUrl) {
			throw new Error(PRAISONAICODE_TOKEN_REQUIRED_ERROR)
		}

		const [models, endpoints, defaultModel] = await Promise.all([
			getModels({
				provider: "praisonaicode",
				praisonaicodeToken: this.options.praisonaicodeToken,
				praisonaicodeOrganizationId: this.options.praisonaicodeOrganizationId,
			}),
			getModelEndpoints({
				router: "openrouter",
				modelId: this.options.praisonaicodeModel,
				endpoint: this.options.openRouterSpecificProvider,
			}),
			getPraisonaicodeDefaultModel(this.options.praisonaicodeToken, this.options.praisonaicodeOrganizationId, this.options),
		])

		this.models = models
		this.endpoints = endpoints
		this.defaultModel = defaultModel
		return this.getModel()
	}

	supportsFim(): boolean {
		const modelId = this.options.praisonaicodeModel ?? this.defaultModel
		return modelId.includes("codestral")
	}

	async completeFim(prefix: string, suffix: string, taskId?: string): Promise<string> {
		let result = ""
		for await (const chunk of this.streamFim(prefix, suffix, taskId)) {
			result += chunk
		}
		return result
	}

	async *streamFim(
		prefix: string,
		suffix: string,
		taskId?: string,
		onUsage?: (usage: CompletionUsage) => void,
	): AsyncGenerator<string> {
		const model = await this.fetchModel()
		const endpoint = new URL("fim/completions", this.apiFIMBase)

		// Build headers using customRequestOptions for consistency
		const headers: Record<string, string> = {
			...DEFAULT_HEADERS,
			"Content-Type": "application/json",
			Accept: "application/json",
			"x-api-key": this.options.praisonaicodeToken ?? "",
			Authorization: `Bearer ${this.options.praisonaicodeToken}`,
			...this.customRequestOptions(taskId ? { taskId, mode: "code" } : undefined)?.headers,
		}

		// temperature: 0.2 is mentioned as a sane example in mistral's docs and is what continue uses.
		const temperature = 0.2
		const maxTokens = 256

		const response = await fetch(endpoint, {
			method: "POST",
			body: JSON.stringify({
				model: model.id,
				prompt: prefix,
				suffix,
				max_tokens: Math.min(maxTokens, model.maxTokens ?? maxTokens),
				temperature,
				top_p: model.topP,
				stream: true,
			}),
			headers,
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`FIM streaming failed: ${response.status} ${response.statusText} - ${errorText}`)
		}

		for await (const data of streamSse(response)) {
			const content = data.choices?.[0]?.delta?.content
			if (content) {
				yield content
			}

			// Call usage callback when available
			if (data.usage && onUsage) {
				onUsage(data.usage)
			}
		}
	}
}
