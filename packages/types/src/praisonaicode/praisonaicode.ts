import { z } from "zod"

declare global {
	interface Window {
		PRAISONAICODE_BACKEND_BASE_URL: string | undefined
	}
}

export const ghostServiceSettingsSchema = z
	.object({
		enableAutoTrigger: z.boolean().optional(),
		enableQuickInlineTaskKeybinding: z.boolean().optional(),
		enableSmartInlineTaskKeybinding: z.boolean().optional(),
		enableChatAutocomplete: z.boolean().optional(),
		provider: z.string().optional(),
		model: z.string().optional(),
		snoozeUntil: z.number().optional(),
	})
	.optional()

export type GhostServiceSettings = z.infer<typeof ghostServiceSettingsSchema>

export const commitRangeSchema = z.object({
	from: z.string(),
	fromTimeStamp: z.number().optional(),
	to: z.string(),
})

export type CommitRange = z.infer<typeof commitRangeSchema>

export const praisonaiCodeMetaDataSchema = z.object({
	commitRange: commitRangeSchema.optional(),
})

export type PraisonaiCodeMetaData = z.infer<typeof praisonaiCodeMetaDataSchema>

export const fastApplyModelSchema = z.enum([
	"auto",
	"morph/morph-v3-fast",
	"morph/morph-v3-large",
	"relace/relace-apply-3",
])

export type FastApplyModel = z.infer<typeof fastApplyModelSchema>

export const fastApplyApiProviderSchema = z.enum(["current", "morph", "praisonaicode", "openrouter"])

export type FastApplyApiProvider = z.infer<typeof fastApplyApiProviderSchema>

export const DEFAULT_PRAISONAICODE_BACKEND_URL = "https://praisonai.com"

export function getPraisonaiBaseUriFromToken(praisonaicodeToken?: string) {
	if (praisonaicodeToken) {
		try {
			const payload_string = praisonaicodeToken.split(".")[1]
			if (!payload_string) return "https://api.praisonai.com"

			const payload_json =
				typeof atob !== "undefined" ? atob(payload_string) : Buffer.from(payload_string, "base64").toString()
			const payload = JSON.parse(payload_json)
			//note: this is UNTRUSTED, so we need to make sure we're OK with this being manipulated by an attacker; e.g. we should not read uri's from the JWT directly.
			// For dev tokens, check if PRAISONAICODE_BACKEND_BASE_URL is set to a custom value
			if (payload.env === "development") {
				const baseUrl = getGlobalPraisonaicodeBackendUrl()
				// This allows pointing to custom dev backends beyond just those accessible on localhost
				// (e.g., 192.168.x.x, staging servers)
				if (baseUrl !== DEFAULT_PRAISONAICODE_BACKEND_URL) {
					return baseUrl
				}
				return "http://localhost:3000"
			}
		} catch (_error) {
			console.warn("Failed to get base URL from PraisonAI Code token")
		}
	}
	return "https://api.praisonai.com"
}

/**
 * Helper function that combines token-based base URL resolution with URL construction.
 * Takes a token and a full URL, uses the token to get the appropriate base URL,
 * then constructs the final URL by replacing the domain in the target URL.
 *
 * @param targetUrl The target URL to transform
 * @param praisonaicodeToken The PraisonaiCode authentication token
 * @returns Fully constructed PraisonaiCode URL with proper backend mapping based on token
 */
export function getPraisonaiUrlFromToken(targetUrl: string, praisonaicodeToken?: string): string {
	const baseUrl = getPraisonaiBaseUriFromToken(praisonaicodeToken)
	const target = new URL(targetUrl)

	const { protocol, host } = new URL(baseUrl)
	Object.assign(target, { protocol, host })

	return target.toString()
}

function getGlobalPraisonaicodeBackendUrl(): string {
	return (
		(typeof window !== "undefined" ? window.PRAISONAICODE_BACKEND_BASE_URL : undefined) ||
		process.env.PRAISONAICODE_BACKEND_BASE_URL ||
		DEFAULT_PRAISONAICODE_BACKEND_URL
	)
}

/**
 * Gets the app/web URL for the current environment.
 * In development: http://localhost:3000
 * In production: https://praisonai.com
 */
export function getAppUrl(path: string = ""): string {
	return new URL(path, getGlobalPraisonaicodeBackendUrl()).toString()
}

/**
 * Gets the API URL for the current environment.
 * Respects PRAISONAICODE_BACKEND_BASE_URL environment variable for local development.
 * In development: http://localhost:3000
 * In production: https://api.praisonai.com
 */
export function getApiUrl(path: string = ""): string {
	const backend = getGlobalPraisonaicodeBackendUrl()

	// If using a custom backend (not the default production URL), use it directly
	if (backend !== DEFAULT_PRAISONAICODE_BACKEND_URL) {
		return new URL(path, backend).toString()
	}

	// In production, use the api subdomain
	return new URL(path, "https://api.praisonai.com").toString()
}

/**
 * Gets the extension config URL, which uses a legacy subdomain structure.
 * In development: http://localhost:3000/extension-config.json
 * In production: https://api.praisonai.com/extension-config.json
 */
export function getExtensionConfigUrl(): string {
	try {
		const backend = getGlobalPraisonaicodeBackendUrl()
		if (backend !== DEFAULT_PRAISONAICODE_BACKEND_URL) {
			return getAppUrl("/extension-config.json")
		} else {
			return "https://api.praisonai.com/extension-config.json"
		}
	} catch (error) {
		console.warn("Failed to build extension config URL:", error)
		return "https://api.praisonai.com/extension-config.json"
	}
}
