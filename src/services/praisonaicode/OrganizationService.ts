// praisonaicode_change - new file
import { getPraisonaiUrlFromToken } from "@roo-code/types"
import { X_PRAISONAICODE_ORGANIZATIONID, X_PRAISONAICODE_TESTER } from "../../shared/praisonaicode/headers"
import { PraisonaiOrganization, PraisonaiOrganizationSchema } from "../../shared/praisonaicode/organization"
import { CompactLogger } from "../../utils/logging/CompactLogger"
import { fetchWithRetries } from "../../shared/http"

/**
 * Service for fetching and managing PraisonAI Code organization settings
 */
export class OrganizationService {
	/**
	 * Fetches organization details from the PraisonAI Code API
	 * @param praisonaicodeToken - The authentication token
	 * @param organizationId - The organization ID
	 * @param praisonaicodeTesterWarningsDisabledUntil - Timestamp for suppressing tester warnings
	 * @returns The organization object with settings
	 */
	public static async fetchOrganization(
		praisonaicodeToken: string,
		organizationId: string,
		praisonaicodeTesterWarningsDisabledUntil?: number,
	): Promise<PraisonaiOrganization | null> {
		try {
			if (!organizationId || !praisonaicodeToken) {
				console.warn("[OrganizationService] Missing required parameters for fetching organization")
				return null
			}

			const headers: Record<string, string> = {
				Authorization: `Bearer ${praisonaicodeToken}`,
				"Content-Type": "application/json",
			}

			headers[X_PRAISONAICODE_ORGANIZATIONID] = organizationId

			// Add X-PRAISONAICODE-TESTER: SUPPRESS header if the setting is enabled
			if (praisonaicodeTesterWarningsDisabledUntil && praisonaicodeTesterWarningsDisabledUntil > Date.now()) {
				headers[X_PRAISONAICODE_TESTER] = "SUPPRESS"
			}

			const url = getPraisonaiUrlFromToken(`https://api.praisonai.com/api/organizations/${organizationId}`, praisonaicodeToken)

			const response = await fetchWithRetries({
				url,
				method: "GET",
				headers,
			})

			if (!response.ok) {
				throw new Error(`Failed to fetch organization: ${response.statusText}`)
			}

			const data = await response.json()

			// Validate the response against the schema
			const validationResult = PraisonaiOrganizationSchema.safeParse(data)

			if (!validationResult.success) {
				console.error("[OrganizationService] Invalid organization response format", {
					organizationId,
					errors: validationResult.error.errors,
				})
				return data
			}

			console.info("[OrganizationService] Successfully fetched organization", {
				organizationId,
				codeIndexingEnabled: validationResult.data.settings.code_indexing_enabled,
			})

			return validationResult.data
		} catch (error) {
			// Log error but don't throw - gracefully degrade
			console.error("[OrganizationService] Failed to fetch organization", {
				organizationId,
				error: error instanceof Error ? error.message : String(error),
			})
			return null
		}
	}

	/**
	 * Checks if code indexing is enabled for an organization
	 * @param organization - The organization object
	 * @returns true if code indexing is enabled (defaults to false if not specified)
	 */
	public static isCodeIndexingEnabled(organization: PraisonaiOrganization | null): boolean {
		// Default to true if organization is null or setting is not specified
		return organization?.settings?.code_indexing_enabled ?? false
	}
}
