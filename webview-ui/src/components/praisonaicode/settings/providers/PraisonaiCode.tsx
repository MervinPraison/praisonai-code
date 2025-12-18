import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { Button } from "@src/components/ui"
import { type ProviderSettings, type OrganizationAllowList } from "@roo-code/types"
import type { RouterModels } from "@roo/api"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { inputEventTransform } from "../../../settings/transforms"
import { ModelPicker } from "../../../settings/ModelPicker"
import { vscode } from "@src/utils/vscode"
import { OrganizationSelector } from "../../common/OrganizationSelector"
import { getAppUrl } from "@roo-code/types"
import { usePraisonaiIdentity } from "@src/utils/praisonaicode/usePraisonaiIdentity"

type PraisonaiCodeProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
	currentApiConfigName?: string
	hidePraisonaiCodeButton?: boolean
	routerModels?: RouterModels
	organizationAllowList: OrganizationAllowList
	praisonaicodeDefaultModel: string
}

export const PraisonaiCode = ({
	apiConfiguration,
	setApiConfigurationField,
	currentApiConfigName,
	hidePraisonaiCodeButton,
	routerModels,
	organizationAllowList,
	praisonaicodeDefaultModel,
}: PraisonaiCodeProps) => {
	const { t } = useAppTranslation()

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	// Use the existing hook to get user identity
	const userIdentity = usePraisonaiIdentity(apiConfiguration.praisonaicodeToken || "", "")
	const isPraisonaiCodeAiUser = userIdentity.endsWith("@praisonai.com")

	const arePraisonaicodeWarningsDisabled = apiConfiguration.praisonaicodeTesterWarningsDisabledUntil
		? apiConfiguration.praisonaicodeTesterWarningsDisabledUntil > Date.now()
		: false

	const handleToggleTesterWarnings = useCallback(() => {
		const newTimestamp = Date.now() + (arePraisonaicodeWarningsDisabled ? 0 : 24 * 60 * 60 * 1000)
		setApiConfigurationField("praisonaicodeTesterWarningsDisabledUntil", newTimestamp)
	}, [arePraisonaicodeWarningsDisabled, setApiConfigurationField])

	return (
		<>
			<div>
				<label className="block font-medium -mb-2">{t("praisonaicode:settings.provider.account")}</label>
			</div>
			{!hidePraisonaiCodeButton &&
				(apiConfiguration.praisonaicodeToken ? (
					<div>
						<Button
							variant="secondary"
							onClick={async () => {
								setApiConfigurationField("praisonaicodeToken", "")

								vscode.postMessage({
									type: "upsertApiConfiguration",
									text: currentApiConfigName,
									apiConfiguration: {
										...apiConfiguration,
										praisonaicodeToken: "",
										praisonaicodeOrganizationId: undefined,
									},
								})
							}}>
							{t("praisonaicode:settings.provider.logout")}
						</Button>
					</div>
				) : (
					<Button
						variant="secondary"
						onClick={() => {
							vscode.postMessage({
								type: "switchTab",
								tab: "auth",
								values: { returnTo: "settings", profileName: currentApiConfigName },
							})
						}}>
						{t("praisonaicode:settings.provider.login")}
					</Button>
				))}

			<VSCodeTextField
				value={apiConfiguration?.praisonaicodeToken || ""}
				type="password"
				onInput={handleInputChange("praisonaicodeToken")}
				placeholder={t("praisonaicode:settings.provider.apiKey")}
				className="w-full">
				<div className="flex justify-between items-center mb-1">
					<label className="block font-medium">{t("praisonaicode:settings.provider.apiKey")}</label>
				</div>
			</VSCodeTextField>

			<OrganizationSelector showLabel />

			<ModelPicker
				apiConfiguration={apiConfiguration}
				setApiConfigurationField={setApiConfigurationField}
				defaultModelId={praisonaicodeDefaultModel}
				models={routerModels?.praisonaicode ?? {}}
				modelIdKey="praisonaicodeModel"
				serviceName="PraisonAI Code"
				serviceUrl={getAppUrl()}
				organizationAllowList={organizationAllowList}
			/>

			{/* PRAISONAICODE-TESTER warnings setting - only visible for @praisonai.com users */}
			{isPraisonaiCodeAiUser && (
				<div className="mb-4">
					<label className="block font-medium mb-2">Disable PRAISONAICODE-TESTER warnings</label>
					<div className="text-sm text-vscode-descriptionForeground mb-2">
						{arePraisonaicodeWarningsDisabled
							? `Warnings disabled until ${new Date(apiConfiguration.praisonaicodeTesterWarningsDisabledUntil || 0).toLocaleString()}`
							: "PRAISONAICODE-TESTER warnings are currently enabled"}
					</div>
					<Button variant="secondary" onClick={handleToggleTesterWarnings} className="text-sm">
						{arePraisonaicodeWarningsDisabled ? "Enable warnings now" : "Disable warnings for 1 day"}
					</Button>
				</div>
			)}
		</>
	)
}
