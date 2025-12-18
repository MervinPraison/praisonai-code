import * as vscode from "vscode"
import { JETBRAIN_PRODUCTS, PraisonaiCodeWrapperProperties } from "../../shared/praisonaicode/wrapper"

export const getPraisonaiCodeWrapperProperties = (): PraisonaiCodeWrapperProperties => {
	const appName = vscode.env.appName
	const praisonaiCodeWrapped = appName.includes("wrapper")
	let praisonaiCodeWrapper = null
	let praisonaiCodeWrapperTitle = null
	let praisonaiCodeWrapperCode = null
	let praisonaiCodeWrapperVersion = null
	let praisonaiCodeWrapperJetbrains = false

	if (praisonaiCodeWrapped) {
		const wrapperMatch = appName.split("|")
		praisonaiCodeWrapper = wrapperMatch[1].trim() || null
		praisonaiCodeWrapperCode = wrapperMatch[2].trim() || null
		praisonaiCodeWrapperVersion = wrapperMatch[3].trim() || null
		praisonaiCodeWrapperJetbrains = praisonaiCodeWrapperCode !== "cli"
		praisonaiCodeWrapperTitle =
			praisonaiCodeWrapperCode === "cli"
				? "PraisonAI Code CLI"
				: JETBRAIN_PRODUCTS[praisonaiCodeWrapperCode as keyof typeof JETBRAIN_PRODUCTS]?.name || "JetBrains IDE"
	}

	return {
		praisonaiCodeWrapped,
		praisonaiCodeWrapper,
		praisonaiCodeWrapperTitle,
		praisonaiCodeWrapperCode,
		praisonaiCodeWrapperVersion,
		praisonaiCodeWrapperJetbrains,
	}
}
