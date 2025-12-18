import { z } from "zod"
import { praisonaiLanguages } from "./praisonaicode/praisonaiLanguages.js"

/**
 * CodeAction
 */

export const praisonaiCodeActionIds = ["addToContextAndFocus"] as const // praisonaicode_change
export const codeActionIds = [
	...praisonaiCodeActionIds, // praisonaicode_change
	"explainCode",
	"fixCode",
	"improveCode",
	"addToContext",
	"newTask",
] as const

export type CodeActionId = (typeof codeActionIds)[number]

export type CodeActionName = "EXPLAIN" | "FIX" | "IMPROVE" | "ADD_TO_CONTEXT" | "NEW_TASK"

/**
 * TerminalAction
 */

export const terminalActionIds = ["terminalAddToContext", "terminalFixCommand", "terminalExplainCommand"] as const

export type TerminalActionId = (typeof terminalActionIds)[number]

export type TerminalActionName = "ADD_TO_CONTEXT" | "FIX" | "EXPLAIN"

export type TerminalActionPromptType = `TERMINAL_${TerminalActionName}`

/**
 * Command
 */

export const commandIds = [
	"activationCompleted",

	"plusButtonClicked",
	"promptsButtonClicked",
	"mcpButtonClicked",

	"historyButtonClicked",
	"marketplaceButtonClicked",
	"popoutButtonClicked",
	"cloudButtonClicked",
	"settingsButtonClicked",

	"openInNewTab",
	"agentManagerOpen", // praisonaicode_change

	"showHumanRelayDialog",
	"registerHumanRelayCallback",
	"unregisterHumanRelayCallback",
	"handleHumanRelayResponse",

	"newTask",

	"setCustomStoragePath",
	"importSettings",

	// "focusInput", // praisonaicode_change
	"acceptInput",
	"profileButtonClicked", // praisonaicode_change
	"helpButtonClicked", // praisonaicode_change
	"focusChatInput", // praisonaicode_change
	"importSettings", // praisonaicode_change
	"exportSettings", // praisonaicode_change
	"generateTerminalCommand", // praisonaicode_change
	"handleExternalUri", // praisonaicode_change - for JetBrains plugin URL forwarding
	"focusPanel",
	"toggleAutoApprove",
] as const

export type CommandId = (typeof commandIds)[number]

/**
 * Language
 */

export const languages = [
	...praisonaiLanguages,
	"ca",
	"de",
	"en",
	"es",
	"fr",
	"hi",
	"id",
	"it",
	"ja",
	"ko",
	"nl",
	"pl",
	"pt-BR",
	"ru",
	"tr",
	"vi",
	"zh-CN",
	"zh-TW",
] as const

export const languagesSchema = z.enum(languages)

export type Language = z.infer<typeof languagesSchema>

export const isLanguage = (value: string): value is Language => languages.includes(value as Language)
