import { getPraisonaiBaseUriFromToken } from "@roo-code/types"
import { AUTOCOMPLETE_PROVIDER_MODELS, AutocompleteProviderKey } from "../types"

export { AUTOCOMPLETE_PROVIDER_MODELS }
export type { AutocompleteProviderKey }

/**
 * Check if the Praisonaicode account has a positive balance
 * @param praisonaicodeToken - The Praisonaicode JWT token
 * @param praisonaicodeOrganizationId - Optional organization ID to include in headers
 * @returns Promise<boolean> - True if balance > 0, false otherwise
 */
export async function checkPraisonaicodeBalance(praisonaicodeToken: string, praisonaicodeOrganizationId?: string): Promise<boolean> {
	try {
		const baseUrl = getPraisonaiBaseUriFromToken(praisonaicodeToken)

		const headers: Record<string, string> = {
			Authorization: `Bearer ${praisonaicodeToken}`,
		}

		if (praisonaicodeOrganizationId) {
			headers["X-PraisonaiCode-OrganizationId"] = praisonaicodeOrganizationId
		}

		const response = await fetch(`${baseUrl}/api/profile/balance`, {
			headers,
		})

		if (!response.ok) {
			return false
		}

		const data = await response.json()
		const balance = data.balance ?? 0
		return balance > 0
	} catch (error) {
		console.error("Error checking praisonaicode balance:", error)
		return false
	}
}
