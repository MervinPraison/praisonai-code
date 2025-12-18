/**
 * Model validation atoms for Praisonaicode provider
 * Validates model availability when router models are updated
 */

import { atom } from "jotai"
import { validateModelAvailability } from "../../services/praisonaicode/modelValidation.js"
import { extensionStateAtom, routerModelsAtom } from "./extension.js"
import { providerAtom, updateProviderAtom } from "./config.js"
import { addMessageAtom } from "./ui.js"
import { logs } from "../../services/logs.js"
import type { CliMessage } from "../../types/cli.js"
import { generateModelFallbackMessage } from "../../ui/utils/messages.js"

/**
 * Effect atom to validate model when router models are updated
 * This runs automatically when routerModels change
 */
export const validateModelOnRouterModelsUpdateAtom = atom(null, async (get, set) => {
	const routerModels = get(routerModelsAtom)
	const currentProvider = get(providerAtom)
	const extensionState = get(extensionStateAtom)

	// Only validate for Praisonaicode provider
	if (!currentProvider || currentProvider.provider !== "praisonaicode") {
		return
	}

	// Skip if no router models available yet
	if (!routerModels?.praisonaicode) {
		logs.debug("No router models available for validation", "modelValidation")
		return
	}

	const currentModel = currentProvider.praisonaicodeModel
	const availableModels = routerModels.praisonaicode

	// Skip if no current model set
	if (!currentModel) {
		logs.debug("No current model set, skipping validation", "modelValidation")
		return
	}

	// Check if current model is available
	if (validateModelAvailability(currentModel, availableModels)) {
		logs.debug(`Model ${currentModel} is valid for current organization`, "modelValidation")
		return
	}

	// Model not available - need fallback
	logs.warn(`Model ${currentModel} not available for current organization`, "modelValidation")

	// Get default fallback model
	const fallbackModel = (extensionState?.praisonaicodeDefaultModel as string) || Object.keys(availableModels)[0] || ""

	if (!fallbackModel) {
		logs.error("No models available for fallback", "modelValidation")
		return
	}

	// Update to fallback model
	const modelIdKey = "praisonaicodeModel"
	await set(updateProviderAtom, currentProvider.id, {
		[modelIdKey]: fallbackModel,
	})

	// Get organization name for message
	const orgName = currentProvider.praisonaicodeOrganizationId ? "this organization" : "Personal"

	const cliMessage: CliMessage = generateModelFallbackMessage({
		previousModel: currentModel,
		newModel: fallbackModel,
		organizationName: orgName,
	})

	set(addMessageAtom, cliMessage)

	logs.info(`Model switched to fallback: ${fallbackModel}`, "modelValidation")
})
