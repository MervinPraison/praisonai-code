import { ChatMessage, CompletionOptions, LLMOptions } from "../../index.js"
import { X_PRAISONAICODE_VERSION } from "../../../../../shared/praisonaicode/headers"
import { Package } from "../../../../../shared/package"
import OpenRouter from "./OpenRouter"
import { IFimProvider } from "../../../../../api/providers/praisonaicode/IFimProvider"
import { getPraisonaiUrlFromToken } from "@roo-code/types"

/**
 * Extended CompletionOptions to include PraisonaiCode-specific per-request metadata
 */
export interface PraisonaiCodeCompletionOptions extends CompletionOptions {
	praisonaicodeTaskId?: string
	praisonaicodeProjectId?: string
}

/**
 * PraisonaiCode LLM provider that extends OpenRouter with PraisonaiCode-specific features:
 * - Custom base URL using getPraisonaiUrlFromToken()
 * - PraisonaiCode-specific headers (organizationId, taskId, projectId, version, tester)
 * - Support for both static (organizationId) and per-request (taskId, projectId) metadata
 *
 * This provider maintains API parity with the praisonaicode-openrouter API provider
 * while working within the continuedev LLM architecture.
 */
class PraisonaiCode extends OpenRouter {
	static override providerName = "praisonaicode"

	// Instance variables to store per-request metadata
	private currentTaskId?: string
	private currentProjectId?: string
	public fimProvider?: IFimProvider

	constructor(options: LLMOptions) {
		// Extract PraisonaiCode-specific config from env
		const praisonaicodeToken = options.apiKey ?? ""

		// Extract fimProvider before passing to parent
		const { fimProvider, ...parentOptions } = options

		// Transform apiBase to use PraisonaiCode backend
		const transformedOptions = {
			...parentOptions,
			apiBase: getPraisonaiUrlFromToken("https://api.praisonai.com/api/openrouter/v1/", praisonaicodeToken),
		}

		super(transformedOptions)

		// Use provided handler or create a new one if not provided
		this.fimProvider = fimProvider
	}

	/**
	 * Override _streamChat to extract per-request metadata from options
	 * This allows dynamic taskId and projectId per request
	 */
	protected override async *_streamChat(
		messages: ChatMessage[],
		signal: AbortSignal,
		options: CompletionOptions,
	): AsyncGenerator<ChatMessage> {
		// Extract PraisonaiCode metadata from options if available
		const praisonaicodeOptions = options as PraisonaiCodeCompletionOptions
		this.currentTaskId = praisonaicodeOptions.praisonaicodeTaskId
		this.currentProjectId = praisonaicodeOptions.praisonaicodeProjectId

		try {
			// Call parent implementation
			yield* super._streamChat(messages, signal, options)
		} finally {
			// Clear per-request metadata after stream completes
			this.currentTaskId = undefined
			this.currentProjectId = undefined
		}
	}

	/**
	 * Override _streamComplete to support per-request metadata
	 */
	protected override async *_streamComplete(
		prompt: string,
		signal: AbortSignal,
		options: CompletionOptions,
	): AsyncGenerator<string> {
		// Extract metadata (same pattern as _streamChat)
		const praisonaicodeOptions = options as PraisonaiCodeCompletionOptions
		this.currentTaskId = praisonaicodeOptions.praisonaicodeTaskId
		this.currentProjectId = praisonaicodeOptions.praisonaicodeProjectId

		try {
			yield* super._streamComplete(prompt, signal, options)
		} finally {
			// Clear metadata
			this.currentTaskId = undefined
			this.currentProjectId = undefined
		}
	}

	/**
	 * Override _streamFim to delegate to IFimProvider
	 * This reuses the FIM implementation from the API handler
	 */
	protected override async *_streamFim(
		prefix: string,
		suffix: string,
		signal: AbortSignal,
		options: CompletionOptions,
	): AsyncGenerator<string> {
		if (!this.fimProvider) {
			throw new Error("FIM provider not initialized")
		}

		// Extract metadata (same pattern as _streamChat)
		const praisonaicodeOptions = options as PraisonaiCodeCompletionOptions
		this.currentTaskId = praisonaicodeOptions.praisonaicodeTaskId
		this.currentProjectId = praisonaicodeOptions.praisonaicodeProjectId

		try {
			// Delegate to FIM provider's streamFim method
			yield* this.fimProvider.streamFim(prefix, suffix, this.currentTaskId)
		} finally {
			// Clear metadata
			this.currentTaskId = undefined
			this.currentProjectId = undefined
		}
	}

	/**
	 * Override _getHeaders to inject PraisonaiCode-specific headers
	 * Delegates to FIM provider's customRequestOptions() for consistency
	 */
	protected override _getHeaders() {
		const baseHeaders = super._getHeaders()

		// Always add version header
		const praisonaicodeHeaders: Record<string, string> = {
			[X_PRAISONAICODE_VERSION]: Package.version,
		}

		// Delegate to FIM provider's customRequestOptions for other PraisonaiCode headers
		// Only call if we have a taskId (required by the metadata interface)
		if (this.fimProvider && this.currentTaskId) {
			const customOptions = this.fimProvider.customRequestOptions({
				taskId: this.currentTaskId,
				projectId: this.currentProjectId,
				mode: "code", // Default mode for LLM operations
			})

			if (customOptions?.headers) {
				Object.assign(praisonaicodeHeaders, customOptions.headers)
			}
		}

		return {
			...baseHeaders,
			...praisonaicodeHeaders,
		}
	}

	override supportsFim(): boolean {
		return this.fimProvider?.supportsFim() || false
	}
}

export default PraisonaiCode
