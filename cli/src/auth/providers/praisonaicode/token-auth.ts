import inquirer from "inquirer"
import type { AuthResult } from "../../types.js"
import {
	getPraisonaicodeProfile,
	getPraisonaicodeDefaultModel,
	promptOrganizationSelection,
	INVALID_TOKEN_ERROR,
} from "./shared.js"

/**
 * Execute the manual token authentication flow
 * @returns Authentication result with provider config
 * @throws Error if authentication fails
 */
export async function authenticateWithToken(): Promise<AuthResult> {
	console.log("\n🔑 Manual Token Authentication\n")
	console.log("Please navigate to https://app.praisonai.com and copy your API key from the bottom of the page!\n")

	let praisonaicodeToken: string = ""
	let profileData
	let isValidToken = false

	// Loop until we get a valid token
	while (!isValidToken) {
		const { token } = await inquirer.prompt<{ token: string }>([
			{
				type: "password",
				name: "token",
				message: "API Key:",
				mask: true,
			},
		])

		praisonaicodeToken = token

		try {
			// Validate token by fetching profile
			profileData = await getPraisonaicodeProfile(praisonaicodeToken)
			isValidToken = true
		} catch (error) {
			if (error instanceof Error && error.message === INVALID_TOKEN_ERROR) {
				console.error("\n❌ Invalid API key. Please check your key and try again.\n")
				// Loop will continue, prompting for token again
			} else {
				console.error("\n❌ Failed to validate API key. Please try again.\n")
				console.error(`Error: ${error instanceof Error ? error.message : String(error)}\n`)
				// Loop will continue, prompting for token again
			}
		}
	}

	// Token is valid, now handle organization selection
	let praisonaicodeOrganizationId: string | undefined
	if (profileData?.organizations && profileData.organizations.length > 0) {
		praisonaicodeOrganizationId = await promptOrganizationSelection(profileData.organizations)
	}

	// Fetch the default model from Praisonaicode API with organization context
	const praisonaicodeModel = await getPraisonaicodeDefaultModel(praisonaicodeToken, praisonaicodeOrganizationId)

	// Return provider config
	return {
		providerConfig: {
			id: "default",
			provider: "praisonaicode",
			praisonaicodeToken,
			praisonaicodeModel,
			...(praisonaicodeOrganizationId && { praisonaicodeOrganizationId }),
		},
	}
}
