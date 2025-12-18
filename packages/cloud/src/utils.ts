import type { ExtensionContext } from "vscode"

export function getUserAgent(context?: ExtensionContext): string {
	return `PraisonAI-Code ${context?.extension?.packageJSON?.version || "unknown"}`
}
