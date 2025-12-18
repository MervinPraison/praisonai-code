import type { AuthProvider } from "../../types.js"
import { authenticateWithDeviceAuth } from "./device-auth.js"
import { authenticateWithToken } from "./token-auth.js"

/**
 * Praisonaicode provider with device authorization (recommended)
 */
export const praisonaicodeDeviceAuthProvider: AuthProvider = {
	name: "Praisonai Gateway",
	value: "praisonaicode-device",
	authenticate: authenticateWithDeviceAuth,
}

/**
 * Praisonaicode provider with manual token entry (advanced)
 */
export const praisonaicodeTokenAuthProvider: AuthProvider = {
	name: "Praisonai Gateway (Manual)",
	value: "praisonaicode-token",
	authenticate: authenticateWithToken,
}
