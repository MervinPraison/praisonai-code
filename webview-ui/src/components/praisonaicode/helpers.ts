import { JETBRAIN_PRODUCTS, PraisonaiCodeWrapperProperties } from "../../../../src/shared/praisonaicode/wrapper"
import { getAppUrl } from "@roo-code/types"

const getJetbrainsUrlScheme = (code: string) => {
	return JETBRAIN_PRODUCTS[code as keyof typeof JETBRAIN_PRODUCTS]?.urlScheme || "jetbrains"
}

const getPraisonaiCodeSource = (uriScheme: string = "vscode", praisonaiCodeWrapperProperties?: PraisonaiCodeWrapperProperties) => {
	if (
		!praisonaiCodeWrapperProperties?.praisonaiCodeWrapped ||
		!praisonaiCodeWrapperProperties.praisonaiCodeWrapper ||
		!praisonaiCodeWrapperProperties.praisonaiCodeWrapperCode
	) {
		return uriScheme
	}

	return `${getJetbrainsUrlScheme(praisonaiCodeWrapperProperties.praisonaiCodeWrapperCode)}`
}

export function getPraisonaiCodeBackendSignInUrl(
	uriScheme: string = "vscode",
	uiKind: string = "Desktop",
	praisonaiCodeWrapperProperties?: PraisonaiCodeWrapperProperties,
) {
	const source = uiKind === "Web" ? "web" : getPraisonaiCodeSource(uriScheme, praisonaiCodeWrapperProperties)
	return getAppUrl(`/sign-in-to-editor?source=${source}`)
}

export function getPraisonaiCodeBackendSignUpUrl(
	uriScheme: string = "vscode",
	uiKind: string = "Desktop",
	praisonaiCodeWrapperProperties?: PraisonaiCodeWrapperProperties,
) {
	const source = uiKind === "Web" ? "web" : getPraisonaiCodeSource(uriScheme, praisonaiCodeWrapperProperties)
	return getAppUrl(`/users/sign_up?source=${source}`)
}
