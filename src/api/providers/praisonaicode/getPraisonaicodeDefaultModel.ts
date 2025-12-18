import { openRouterDefaultModelId, type ProviderSettings } from "@roo-code/types"
import { getPraisonaiUrlFromToken } from "@roo-code/types"
import { TelemetryService } from "@roo-code/telemetry"
import { z } from "zod"
import { fetchWithTimeout } from "./fetchWithTimeout"
import { DEFAULT_HEADERS } from "../constants"

type PraisonaicodeToken = string

type OrganizationId = string

const cache = new Map<string, Promise<string>>()

const defaultsSchema = z.object({
	defaultModel: z.string().nullish(),
})

const fetcher = fetchWithTimeout(5000)

async function fetchPraisonaicodeDefaultModel(
	praisonaicodeToken: PraisonaicodeToken,
	organizationId?: OrganizationId,
	providerSettings?: ProviderSettings,
): Promise<string> {
	try {
		const path = organizationId ? `/organizations/${organizationId}/defaults` : `/defaults`
		const url = getPraisonaiUrlFromToken(`https://api.praisonai.com/api${path}`, praisonaicodeToken)

		const headers: Record<string, string> = {
			...DEFAULT_HEADERS,
			Authorization: `Bearer ${praisonaicodeToken}`,
		}

		// Add X-PRAISONAICODE-TESTER: SUPPRESS header if the setting is enabled
		if (
			providerSettings?.praisonaicodeTesterWarningsDisabledUntil &&
			providerSettings.praisonaicodeTesterWarningsDisabledUntil > Date.now()
		) {
			headers["X-PRAISONAICODE-TESTER"] = "SUPPRESS"
		}

		const response = await fetcher(url, { headers })
		if (!response.ok) {
			throw new Error(`Fetching default model from ${url} failed: ${response.status}`)
		}
		const defaultModel = (await defaultsSchema.parseAsync(await response.json())).defaultModel
		if (!defaultModel) {
			throw new Error(`Default model from ${url} was empty`)
		}
		console.info(`Fetched default model from ${url}: ${defaultModel}`)
		return defaultModel
	} catch (err) {
		console.error("Failed to get default model", err)
		TelemetryService.instance.captureException(err, { context: "getPraisonaicodeDefaultModel" })
		return openRouterDefaultModelId
	}
}

export async function getPraisonaicodeDefaultModel(
	praisonaicodeToken?: PraisonaicodeToken,
	organizationId?: OrganizationId,
	providerSettings?: ProviderSettings,
): Promise<string> {
	if (!praisonaicodeToken) {
		return openRouterDefaultModelId
	}
	const key = JSON.stringify({
		praisonaicodeToken,
		organizationId,
		testerSuppressed: providerSettings?.praisonaicodeTesterWarningsDisabledUntil,
	})
	let defaultModelPromise = cache.get(key)
	if (!defaultModelPromise) {
		defaultModelPromise = fetchPraisonaicodeDefaultModel(praisonaicodeToken, organizationId, providerSettings)
		cache.set(key, defaultModelPromise)
	}
	return await defaultModelPromise
}
