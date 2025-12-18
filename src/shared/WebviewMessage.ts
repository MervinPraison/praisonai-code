import { z } from "zod"

import {
	type RooCodeSettings,
	type ProviderSettings,
	type PromptComponent,
	type ModeConfig,
	type InstallMarketplaceItemOptions,
	type MarketplaceItem,
	type ShareVisibility,
	type QueuedMessage,
	marketplaceItemSchema,
	// praisonaicode_change start
	CommitRange,
	HistoryItem,
	GlobalState,
	// praisonaicode_change end
} from "@roo-code/types"

import { Mode } from "./modes"

export type ClineAskResponse =
	| "yesButtonClicked"
	| "noButtonClicked"
	| "messageResponse"
	| "objectResponse"
	| "retry_clicked" // praisonaicode_change: Added retry_clicked for payment required dialog

export type PromptMode = Mode | "enhance"

export type AudioType = "notification" | "celebration" | "progress_loop"

export interface UpdateTodoListPayload {
	todos: any[]
}

export type EditQueuedMessagePayload = Pick<QueuedMessage, "id" | "text" | "images">

// praisonaicode_change start: Type-safe global state update message
export type GlobalStateValue<K extends keyof GlobalState> = GlobalState[K]
export type UpdateGlobalStateMessage<K extends keyof GlobalState = keyof GlobalState> = {
	type: "updateGlobalState"
	stateKey: K
	stateValue: GlobalStateValue<K>
}
// praisonaicode_change end: Type-safe global state update message

export interface WebviewMessage {
	type:
		| "updateTodoList"
		| "deleteMultipleTasksWithIds"
		| "currentApiConfigName"
		| "saveApiConfiguration"
		| "upsertApiConfiguration"
		| "deleteApiConfiguration"
		| "loadApiConfiguration"
		| "loadApiConfigurationById"
		| "getProfileConfigurationForEditing" // praisonaicode_change: Request to get profile config without activating
		| "renameApiConfiguration"
		| "getListApiConfiguration"
		| "customInstructions"
		| "webviewDidLaunch"
		| "newTask"
		| "askResponse"
		| "terminalOperation"
		| "clearTask"
		| "didShowAnnouncement"
		| "selectImages"
		| "exportCurrentTask"
		| "shareCurrentTask"
		| "showTaskWithId"
		| "deleteTaskWithId"
		| "exportTaskWithId"
		| "importSettings"
		| "toggleToolAutoApprove"
		| "openExtensionSettings"
		| "openInBrowser"
		| "fetchOpenGraphData"
		| "checkIsImageUrl"
		| "exportSettings"
		| "resetState"
		| "flushRouterModels"
		| "requestRouterModels"
		| "requestOpenAiModels"
		| "requestOllamaModels"
		| "requestLmStudioModels"
		| "requestRooModels"
		| "requestRooCreditBalance"
		| "requestVsCodeLmModels"
		| "requestHuggingFaceModels"
		| "requestSapAiCoreModels" // praisonaicode_change
		| "requestSapAiCoreDeployments" // praisonaicode_change
		| "openImage"
		| "saveImage"
		| "openFile"
		| "openMention"
		| "cancelTask"
		| "updateVSCodeSetting"
		| "getVSCodeSetting"
		| "vsCodeSetting"
		| "updateCondensingPrompt"
		| "yoloGatekeeperApiConfigId" // praisonaicode_change: AI gatekeeper for YOLO mode
		| "playSound"
		| "playTts"
		| "stopTts"
		| "ttsEnabled"
		| "ttsSpeed"
		| "openKeyboardShortcuts"
		| "openMcpSettings"
		| "openProjectMcpSettings"
		| "restartMcpServer"
		| "refreshAllMcpServers"
		| "toggleToolAlwaysAllow"
		| "toggleToolEnabledForPrompt"
		| "toggleMcpServer"
		| "updateMcpTimeout"
		| "fuzzyMatchThreshold" // praisonaicode_change
		| "morphApiKey" // praisonaicode_change: Morph fast apply - global setting
		| "fastApplyModel" // praisonaicode_change: Fast Apply model selection
		| "fastApplyApiProvider" // praisonaicode_change: Fast Apply model api base url
		| "writeDelayMs" // praisonaicode_change
		| "diagnosticsEnabled" // praisonaicode_change
		| "enhancePrompt"
		| "enhancedPrompt"
		| "draggedImages"
		| "deleteMessage"
		| "deleteMessageConfirm"
		| "submitEditedMessage"
		| "editMessageConfirm"
		| "enableMcpServerCreation"
		| "remoteControlEnabled"
		| "taskSyncEnabled"
		| "searchCommits"
		| "setApiConfigPassword"
		| "mode"
		| "updatePrompt"
		| "getSystemPrompt"
		| "copySystemPrompt"
		| "systemPrompt"
		| "enhancementApiConfigId"
		| "commitMessageApiConfigId" // praisonaicode_change
		| "terminalCommandApiConfigId" // praisonaicode_change
		| "ghostServiceSettings" // praisonaicode_change
		| "stt:start" // praisonaicode_change: Start STT recording
		| "stt:stop" // praisonaicode_change: Stop STT recording
		| "stt:cancel" // praisonaicode_change: Cancel STT recording
		| "includeTaskHistoryInEnhance" // praisonaicode_change
		| "snoozeAutocomplete" // praisonaicode_change
		| "autoApprovalEnabled"
		| "yoloMode" // praisonaicode_change
		| "updateCustomMode"
		| "deleteCustomMode"
		| "setopenAiCustomModelInfo"
		| "openCustomModesSettings"
		| "checkpointDiff"
		| "checkpointRestore"
		| "requestCheckpointRestoreApproval"
		| "seeNewChanges" // praisonaicode_change
		| "deleteMcpServer"
		| "humanRelayResponse"
		| "humanRelayCancel"
		| "insertTextToChatArea" // praisonaicode_change
		| "codebaseIndexEnabled"
		| "telemetrySetting"
		| "testBrowserConnection"
		| "browserConnectionResult"
		| "allowVeryLargeReads" // praisonaicode_change
		| "showFeedbackOptions" // praisonaicode_change
		| "fetchMcpMarketplace" // praisonaicode_change
		| "silentlyRefreshMcpMarketplace" // praisonaicode_change
		| "fetchLatestMcpServersFromHub" // praisonaicode_change
		| "downloadMcp" // praisonaicode_change
		| "showSystemNotification" // praisonaicode_change
		| "showAutoApproveMenu" // praisonaicode_change
		| "reportBug" // praisonaicode_change
		| "profileButtonClicked" // praisonaicode_change
		| "fetchProfileDataRequest" // praisonaicode_change
		| "profileDataResponse" // praisonaicode_change
		| "fetchBalanceDataRequest" // praisonaicode_change
		| "shopBuyCredits" // praisonaicode_change
		| "balanceDataResponse" // praisonaicode_change
		| "updateProfileData" // praisonaicode_change
		| "condense" // praisonaicode_change
		| "toggleWorkflow" // praisonaicode_change
		| "refreshRules" // praisonaicode_change
		| "toggleRule" // praisonaicode_change
		| "createRuleFile" // praisonaicode_change
		| "deleteRuleFile" // praisonaicode_change
		| "searchFiles"
		| "toggleApiConfigPin"
		| "hasOpenedModeSelector"
		| "cloudButtonClicked"
		| "rooCloudSignIn"
		| "cloudLandingPageSignIn"
		| "rooCloudSignOut"
		| "rooCloudManualUrl"
		| "switchOrganization"
		| "condenseTaskContextRequest"
		| "requestIndexingStatus"
		| "startIndexing"
		| "cancelIndexing" // praisonaicode_change
		| "clearIndexData"
		| "indexingStatusUpdate"
		| "indexCleared"
		| "focusPanelRequest"
		| "clearUsageData" // praisonaicode_change
		| "getUsageData" // praisonaicode_change
		| "usageDataResponse" // praisonaicode_change
		| "showTaskTimeline" // praisonaicode_change
		| "sendMessageOnEnter" // praisonaicode_change
		| "showTimestamps" // praisonaicode_change
		| "hideCostBelowThreshold" // praisonaicode_change
		| "toggleTaskFavorite" // praisonaicode_change
		| "fixMermaidSyntax" // praisonaicode_change
		| "mermaidFixResponse" // praisonaicode_change
		| "openGlobalKeybindings" // praisonaicode_change
		| "getKeybindings" // praisonaicode_change
		| "setReasoningBlockCollapsed"
		| "setHistoryPreviewCollapsed" // praisonaicode_change
		| "openExternal"
		| "filterMarketplaceItems"
		| "mcpButtonClicked"
		| "marketplaceButtonClicked"
		| "installMarketplaceItem"
		| "installMarketplaceItemWithParameters"
		| "cancelMarketplaceInstall"
		| "removeInstalledMarketplaceItem"
		| "marketplaceInstallResult"
		| "fetchMarketplaceData"
		| "switchTab"
		| "profileThresholds" // praisonaicode_change
		| "editMessage" // praisonaicode_change
		| "systemNotificationsEnabled" // praisonaicode_change
		| "dismissNotificationId" // praisonaicode_change
		| "tasksByIdRequest" // praisonaicode_change
		| "taskHistoryRequest" // praisonaicode_change
		| "updateGlobalState" // praisonaicode_change
		| "autoPurgeEnabled" // praisonaicode_change
		| "autoPurgeDefaultRetentionDays" // praisonaicode_change
		| "autoPurgeFavoritedTaskRetentionDays" // praisonaicode_change
		| "autoPurgeCompletedTaskRetentionDays" // praisonaicode_change
		| "autoPurgeIncompleteTaskRetentionDays" // praisonaicode_change
		| "manualPurge" // praisonaicode_change
		| "shareTaskSuccess" // praisonaicode_change
		| "exportMode"
		| "exportModeResult"
		| "importMode"
		| "importModeResult"
		| "checkRulesDirectory"
		| "checkRulesDirectoryResult"
		| "saveCodeIndexSettingsAtomic"
		| "requestCodeIndexSecretStatus"
		| "fetchPraisonaicodeNotifications"
		| "requestCommands"
		| "openCommandFile"
		| "deleteCommand"
		| "createCommand"
		| "insertTextIntoTextarea"
		| "showMdmAuthRequiredNotification"
		| "imageGenerationSettings"
		| "praisonaiCodeImageApiKey" // praisonaicode_change
		| "queueMessage"
		| "removeQueuedMessage"
		| "editQueuedMessage"
		| "dismissUpsell"
		| "getDismissedUpsells"
		| "updateSettings"
		| "requestManagedIndexerState" // praisonaicode_change
		| "allowedCommands"
		| "deniedCommands"
		| "killBrowserSession"
		| "openBrowserSessionPanel"
		| "showBrowserSessionPanelAtStep"
		| "refreshBrowserSessionPanel"
		| "browserPanelDidLaunch"
		| "addTaskToHistory" // praisonaicode_change
		| "sessionShare" // praisonaicode_change
		| "shareTaskSession" // praisonaicode_change
		| "sessionFork" // praisonaicode_change
		| "sessionShow" // praisonaicode_change
		| "sessionSelect" // praisonaicode_change
		| "singleCompletion" // praisonaicode_change
		| "openDebugApiHistory"
		| "openDebugUiHistory"
		| "startDeviceAuth" // praisonaicode_change: Start device auth flow
		| "cancelDeviceAuth" // praisonaicode_change: Cancel device auth flow
		| "deviceAuthCompleteWithProfile" // praisonaicode_change: Device auth complete with specific profile
		| "requestChatCompletion" // praisonaicode_change: Request FIM completion for chat text area
	text?: string
	completionRequestId?: string // praisonaicode_change
	shareId?: string // praisonaicode_change - for sessionFork
	sessionId?: string // praisonaicode_change - for sessionSelect
	editedMessageContent?: string
	tab?: "settings" | "history" | "mcp" | "modes" | "chat" | "marketplace" | "cloud" | "auth" // praisonaicode_change
	disabled?: boolean
	context?: string
	dataUri?: string
	askResponse?: ClineAskResponse
	apiConfiguration?: ProviderSettings
	images?: string[]
	bool?: boolean
	value?: number
	stepIndex?: number
	isLaunchAction?: boolean
	forceShow?: boolean
	commands?: string[]
	audioType?: AudioType
	// praisonaicode_change begin
	notificationOptions?: {
		title?: string
		subtitle?: string
		message: string
	}
	mcpId?: string
	toolNames?: string[]
	autoApprove?: boolean
	workflowPath?: string // praisonaicode_change
	enabled?: boolean // praisonaicode_change
	rulePath?: string // praisonaicode_change
	isGlobal?: boolean // praisonaicode_change
	filename?: string // praisonaicode_change
	ruleType?: string // praisonaicode_change
	notificationId?: string // praisonaicode_change
	commandIds?: string[] // praisonaicode_change: For getKeybindings
	// praisonaicode_change end
	serverName?: string
	toolName?: string
	alwaysAllow?: boolean
	isEnabled?: boolean
	mode?: Mode
	promptMode?: PromptMode
	customPrompt?: PromptComponent
	dataUrls?: string[]
	values?: Record<string, any>
	query?: string
	setting?: string
	slug?: string
	language?: string // User's language for speech transcription (STT)
	modeConfig?: ModeConfig
	timeout?: number
	payload?: WebViewMessagePayload
	source?: "global" | "project"
	requestId?: string
	ids?: string[]
	hasSystemPromptOverride?: boolean
	terminalOperation?: "continue" | "abort"
	messageTs?: number
	restoreCheckpoint?: boolean
	historyPreviewCollapsed?: boolean
	filters?: { type?: string; search?: string; tags?: string[] }
	settings?: any
	url?: string // For openExternal
	mpItem?: MarketplaceItem
	mpInstallOptions?: InstallMarketplaceItemOptions
	config?: Record<string, any> // Add config to the payload
	visibility?: ShareVisibility // For share visibility
	hasContent?: boolean // For checkRulesDirectoryResult
	checkOnly?: boolean // For deleteCustomMode check
	upsellId?: string // For dismissUpsell
	list?: string[] // For dismissedUpsells response
	organizationId?: string | null // For organization switching
	useProviderSignup?: boolean // For rooCloudSignIn to use provider signup flow
	historyItem?: HistoryItem // praisonaicode_change For addTaskToHistory
	codeIndexSettings?: {
		// Global state settings
		codebaseIndexEnabled: boolean
		codebaseIndexQdrantUrl: string
		codebaseIndexEmbedderProvider:
			| "openai"
			| "ollama"
			| "openai-compatible"
			| "gemini"
			| "mistral"
			| "vercel-ai-gateway"
			| "bedrock"
			| "openrouter"
		codebaseIndexVectorStoreProvider?: "lancedb" | "qdrant" // praisonaicode_change
		codebaseIndexLancedbVectorStoreDirectory?: string // praisonaicode_change
		codebaseIndexEmbedderBaseUrl?: string
		codebaseIndexEmbedderModelId: string
		codebaseIndexEmbedderModelDimension?: number // Generic dimension for all providers
		codebaseIndexOpenAiCompatibleBaseUrl?: string
		codebaseIndexBedrockRegion?: string
		codebaseIndexBedrockProfile?: string
		codebaseIndexSearchMaxResults?: number
		codebaseIndexSearchMinScore?: number
		// praisonaicode_change start
		codebaseIndexEmbeddingBatchSize?: number
		codebaseIndexScannerMaxBatchRetries?: number
		// praisonaicode_change end
		codebaseIndexOpenRouterSpecificProvider?: string // OpenRouter provider routing

		// Secret settings
		codeIndexOpenAiKey?: string
		codeIndexQdrantApiKey?: string
		codebaseIndexOpenAiCompatibleApiKey?: string
		codebaseIndexGeminiApiKey?: string
		codebaseIndexMistralApiKey?: string
		codebaseIndexVercelAiGatewayApiKey?: string
		codebaseIndexOpenRouterApiKey?: string
	}
	updatedSettings?: RooCodeSettings
}

// praisonaicode_change: Create discriminated union for type-safe messages
export type MaybeTypedWebviewMessage = WebviewMessage | UpdateGlobalStateMessage

// praisonaicode_change begin
export type OrganizationRole = "owner" | "admin" | "member"

export type UserOrganizationWithApiKey = {
	id: string
	name: string
	balance: number
	role: OrganizationRole
	apiKey: string
}

export type ProfileData = {
	praisonaicodeToken: string
	user: {
		id: string
		name: string
		email: string
		image: string
	}
	organizations?: UserOrganizationWithApiKey[]
}

export interface ProfileDataResponsePayload {
	success: boolean
	data?: ProfileData
	error?: string
}

export interface BalanceDataResponsePayload {
	// New: Payload for balance data
	success: boolean
	data?: any // Replace 'any' with a more specific type if known for balance
	error?: string
}

export interface SeeNewChangesPayload {
	commitRange: CommitRange
}

export interface TasksByIdRequestPayload {
	requestId: string
	taskIds: string[]
}

export interface TaskHistoryRequestPayload {
	requestId: string
	workspace: "current" | "all"
	sort: "newest" | "oldest" | "mostExpensive" | "mostTokens" | "mostRelevant"
	favoritesOnly: boolean
	pageIndex: number
	search?: string
}

export interface TasksByIdResponsePayload {
	requestId: string
	tasks: HistoryItem[]
}

export interface TaskHistoryResponsePayload {
	requestId: string
	historyItems: HistoryItem[]
	pageIndex: number
	pageCount: number
}
// praisonaicode_change end

export const checkoutDiffPayloadSchema = z.object({
	ts: z.number().optional(),
	previousCommitHash: z.string().optional(),
	commitHash: z.string(),
	mode: z.enum(["full", "checkpoint", "from-init", "to-current"]),
})

export type CheckpointDiffPayload = z.infer<typeof checkoutDiffPayloadSchema>

export const checkoutRestorePayloadSchema = z.object({
	ts: z.number(),
	commitHash: z.string(),
	mode: z.enum(["preview", "restore"]),
})

export type CheckpointRestorePayload = z.infer<typeof checkoutRestorePayloadSchema>

export const requestCheckpointRestoreApprovalPayloadSchema = z.object({
	commitHash: z.string(),
	checkpointTs: z.number(),
	messagesToRemove: z.number(),
	confirmationText: z.string(),
})

export type RequestCheckpointRestoreApprovalPayload = z.infer<typeof requestCheckpointRestoreApprovalPayloadSchema>

export interface IndexingStatusPayload {
	state: "Standby" | "Indexing" | "Indexed" | "Error"
	message: string
}

export interface IndexClearedPayload {
	success: boolean
	error?: string
}

export const installMarketplaceItemWithParametersPayloadSchema = z.object({
	item: marketplaceItemSchema,
	parameters: z.record(z.string(), z.any()),
})

export type InstallMarketplaceItemWithParametersPayload = z.infer<
	typeof installMarketplaceItemWithParametersPayloadSchema
>

export type WebViewMessagePayload =
	// praisonaicode_change start
	| ProfileDataResponsePayload
	| BalanceDataResponsePayload
	| SeeNewChangesPayload
	| TasksByIdRequestPayload
	| TaskHistoryRequestPayload
	| RequestCheckpointRestoreApprovalPayload
	// praisonaicode_change end
	| CheckpointDiffPayload
	| CheckpointRestorePayload
	| IndexingStatusPayload
	| IndexClearedPayload
	| InstallMarketplaceItemWithParametersPayload
	| UpdateTodoListPayload
	| EditQueuedMessagePayload
