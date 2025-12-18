import type {
	GlobalSettings,
	ProviderSettingsEntry,
	ProviderSettings,
	ModelInfo, // praisonaicode_change
	HistoryItem,
	ModeConfig,
	TelemetrySetting,
	Experiments,
	ClineMessage,
	MarketplaceItem,
	TodoItem,
	CloudUserInfo,
	CloudOrganizationMembership,
	OrganizationAllowList,
	ShareVisibility,
	QueuedMessage,
} from "@roo-code/types"

import { GitCommit } from "../utils/git"

import { McpServer } from "./mcp"
import { McpMarketplaceCatalog, McpDownloadResponse } from "./praisonaicode/mcp"
import { Mode } from "./modes"
import { ModelRecord, RouterModels } from "./api"
// praisonaicode_change start
import {
	ProfileDataResponsePayload,
	BalanceDataResponsePayload,
	TaskHistoryResponsePayload,
	TasksByIdResponsePayload,
} from "./WebviewMessage"
import { ClineRulesToggles } from "./cline-rules"
import { PraisonaiCodeWrapperProperties } from "./praisonaicode/wrapper"
import { DeploymentRecord } from "../api/providers/fetchers/sap-ai-core"
import { STTSegment } from "./sttContract" // praisonaicode_change: STT segment type
// praisonaicode_change end

// Command interface for frontend/backend communication
export interface Command {
	name: string
	source: "global" | "project" | "built-in"
	filePath?: string
	description?: string
	argumentHint?: string
}

// Type for marketplace installed metadata
export interface MarketplaceInstalledMetadata {
	project: Record<string, { type: string }>
	global: Record<string, { type: string }>
}

// Indexing status types
export interface IndexingStatus {
	systemStatus: string
	message?: string
	processedItems: number
	totalItems: number
	currentItemUnit?: string
	workspacePath?: string
	gitBranch?: string // Current git branch being indexed
	manifest?: {
		totalFiles: number
		totalChunks: number
		lastUpdated: string
	}
}

export interface IndexingStatusUpdateMessage {
	type: "indexingStatusUpdate"
	values: IndexingStatus
}

export interface LanguageModelChatSelector {
	vendor?: string
	family?: string
	version?: string
	id?: string
}

// Represents JSON data that is sent from extension to webview, called
// ExtensionMessage and has 'type' enum which can be 'plusButtonClicked' or
// 'settingsButtonClicked' or 'hello'. Webview will hold state.
export interface ExtensionMessage {
	type:
		| "action"
		| "state"
		| "selectedImages"
		| "theme"
		| "workspaceUpdated"
		| "invoke"
		| "messageUpdated"
		| "mcpServers"
		| "enhancedPrompt"
		| "commitSearchResults"
		| "listApiConfig"
		| "routerModels"
		| "openAiModels"
		| "ollamaModels"
		| "lmStudioModels"
		| "vsCodeLmModels"
		| "huggingFaceModels"
		| "sapAiCoreModels" // praisonaicode_change
		| "sapAiCoreDeployments" // praisonaicode_change
		| "vsCodeLmApiAvailable"
		| "updatePrompt"
		| "systemPrompt"
		| "autoApprovalEnabled"
		| "yoloMode" // praisonaicode_change
		| "updateCustomMode"
		| "deleteCustomMode"
		| "exportModeResult"
		| "importModeResult"
		| "checkRulesDirectoryResult"
		| "deleteCustomModeCheck"
		| "currentCheckpointUpdated"
		| "checkpointInitWarning"
		| "showHumanRelayDialog"
		| "humanRelayResponse"
		| "humanRelayCancel"
		| "insertTextToChatArea" // praisonaicode_change
		| "browserToolEnabled"
		| "browserConnectionResult"
		| "remoteBrowserEnabled"
		| "ttsStart"
		| "ttsStop"
		| "maxReadFileLine"
		| "fileSearchResults"
		| "toggleApiConfigPin"
		| "mcpMarketplaceCatalog" // praisonaicode_change
		| "mcpDownloadDetails" // praisonaicode_change
		| "showSystemNotification" // praisonaicode_change
		| "openInBrowser" // praisonaicode_change
		| "acceptInput"
		| "focusChatInput" // praisonaicode_change
		| "stt:started" // praisonaicode_change: STT session started
		| "stt:transcript" // praisonaicode_change: STT transcript update
		| "stt:volume" // praisonaicode_change: STT volume level
		| "stt:stopped" // praisonaicode_change: STT session stopped
		| "setHistoryPreviewCollapsed"
		| "commandExecutionStatus"
		| "mcpExecutionStatus"
		| "vsCodeSetting"
		| "profileDataResponse" // praisonaicode_change
		| "balanceDataResponse" // praisonaicode_change
		| "updateProfileData" // praisonaicode_change
		| "profileConfigurationForEditing" // praisonaicode_change: Response with profile config for editing
		| "authenticatedUser"
		| "condenseTaskContextResponse"
		| "singleRouterModelFetchResponse"
		| "rooCreditBalance"
		| "indexingStatusUpdate"
		| "indexCleared"
		| "codebaseIndexConfig"
		| "rulesData" // praisonaicode_change
		| "marketplaceInstallResult"
		| "marketplaceRemoveResult"
		| "marketplaceData"
		| "mermaidFixResponse" // praisonaicode_change
		| "tasksByIdResponse" // praisonaicode_change
		| "taskHistoryResponse" // praisonaicode_change
		| "shareTaskSuccess"
		| "codeIndexSettingsSaved"
		| "codeIndexSecretStatus"
		| "showDeleteMessageDialog"
		| "showEditMessageDialog"
		| "praisonaicodeNotificationsResponse" // praisonaicode_change
		| "usageDataResponse" // praisonaicode_change
		| "keybindingsResponse" // praisonaicode_change
		| "autoPurgeEnabled" // praisonaicode_change
		| "autoPurgeDefaultRetentionDays" // praisonaicode_change
		| "autoPurgeFavoritedTaskRetentionDays" // praisonaicode_change
		| "autoPurgeCompletedTaskRetentionDays" // praisonaicode_change
		| "autoPurgeIncompleteTaskRetentionDays" // praisonaicode_change
		| "manualPurge" // praisonaicode_change
		| "commands"
		| "insertTextIntoTextarea"
		| "dismissedUpsells"
		| "interactionRequired"
		| "managedIndexerState" // praisonaicode_change
		| "managedIndexerEnabled" // praisonaicode_change
		| "browserSessionUpdate"
		| "browserSessionNavigate"
		| "organizationSwitchResult"
		| "showTimestamps" // praisonaicode_change
		| "apiMessagesSaved" // praisonaicode_change: File save event for API messages
		| "taskMessagesSaved" // praisonaicode_change: File save event for task messages
		| "taskMetadataSaved" // praisonaicode_change: File save event for task metadata
		| "managedIndexerState" // praisonaicode_change
		| "singleCompletionResult" // praisonaicode_change
		| "deviceAuthStarted" // praisonaicode_change: Device auth initiated
		| "deviceAuthPolling" // praisonaicode_change: Device auth polling update
		| "deviceAuthComplete" // praisonaicode_change: Device auth successful
		| "deviceAuthFailed" // praisonaicode_change: Device auth failed
		| "deviceAuthCancelled" // praisonaicode_change: Device auth cancelled
		| "chatCompletionResult" // praisonaicode_change: FIM completion result for chat text area
	text?: string
	// praisonaicode_change start
	completionRequestId?: string // Correlation ID from request
	completionText?: string // The completed text
	completionError?: string // Error message if failed
	payload?:
		| ProfileDataResponsePayload
		| BalanceDataResponsePayload
		| TasksByIdResponsePayload
		| TaskHistoryResponsePayload
		| [string, string] // For file save events [taskId, filePath]
	// praisonaicode_change end
	// Checkpoint warning message
	checkpointWarning?: {
		type: "WAIT_TIMEOUT" | "INIT_TIMEOUT"
		timeout: number
	}
	action?:
		| "chatButtonClicked"
		| "settingsButtonClicked"
		| "historyButtonClicked"
		| "promptsButtonClicked" // praisonaicode_change
		| "profileButtonClicked" // praisonaicode_change
		| "marketplaceButtonClicked"
		| "mcpButtonClicked" // praisonaicode_change
		| "cloudButtonClicked"
		| "didBecomeVisible"
		| "focusInput"
		| "switchTab"
		| "focusChatInput" // praisonaicode_change
		| "toggleAutoApprove"
	invoke?: "newChat" | "sendMessage" | "primaryButtonClick" | "secondaryButtonClick" | "setChatBoxMessage"
	state?: ExtensionState
	images?: string[]
	filePaths?: string[]
	openedTabs?: Array<{
		label: string
		isActive: boolean
		path?: string
	}>
	clineMessage?: ClineMessage
	routerModels?: RouterModels
	openAiModels?: string[]
	ollamaModels?: ModelRecord
	lmStudioModels?: ModelRecord
	vsCodeLmModels?: { vendor?: string; family?: string; version?: string; id?: string }[]
	huggingFaceModels?: Array<{
		id: string
		object: string
		created: number
		owned_by: string
		providers: Array<{
			provider: string
			status: "live" | "staging" | "error"
			supports_tools?: boolean
			supports_structured_output?: boolean
			context_length?: number
			pricing?: {
				input: number
				output: number
			}
		}>
	}>
	sapAiCoreModels?: ModelRecord // praisonaicode_change
	sapAiCoreDeployments?: DeploymentRecord // praisonaicode_change
	mcpServers?: McpServer[]
	commits?: GitCommit[]
	listApiConfig?: ProviderSettingsEntry[]
	apiConfiguration?: ProviderSettings // praisonaicode_change: For profileConfigurationForEditing response
	mode?: Mode
	customMode?: ModeConfig
	slug?: string
	success?: boolean
	values?: Record<string, any>
	sessionId?: string // praisonaicode_change: STT session ID
	segments?: STTSegment[] // praisonaicode_change: STT transcript segments (complete state)
	isFinal?: boolean // praisonaicode_change: STT transcript is final
	level?: number // praisonaicode_change: STT volume level (0-1)
	reason?: "completed" | "cancelled" | "error" // praisonaicode_change: STT stop reason
	requestId?: string
	promptText?: string
	results?: { path: string; type: "file" | "folder"; label?: string }[]
	error?: string
	mcpMarketplaceCatalog?: McpMarketplaceCatalog // praisonaicode_change
	mcpDownloadDetails?: McpDownloadResponse // praisonaicode_change
	notificationOptions?: {
		title?: string
		subtitle?: string
		message: string
	} // praisonaicode_change
	url?: string // praisonaicode_change
	keybindings?: Record<string, string> // praisonaicode_change
	setting?: string
	value?: any
	hasContent?: boolean // For checkRulesDirectoryResult
	items?: MarketplaceItem[]
	userInfo?: CloudUserInfo
	organizationAllowList?: OrganizationAllowList
	tab?: string
	// praisonaicode_change: Rules data
	globalRules?: ClineRulesToggles
	localRules?: ClineRulesToggles
	globalWorkflows?: ClineRulesToggles
	localWorkflows?: ClineRulesToggles
	marketplaceItems?: MarketplaceItem[]
	organizationMcps?: MarketplaceItem[]
	marketplaceInstalledMetadata?: MarketplaceInstalledMetadata
	fixedCode?: string | null // For mermaidFixResponse // praisonaicode_change
	errors?: string[]
	visibility?: ShareVisibility
	rulesFolderPath?: string
	settings?: any
	messageTs?: number
	hasCheckpoint?: boolean
	context?: string
	// praisonaicode_change start: Notifications
	notifications?: Array<{
		id: string
		title: string
		message: string
		action?: {
			actionText: string
			actionURL: string
		}
	}>
	// praisonaicode_change end
	commands?: Command[]
	queuedMessages?: QueuedMessage[]
	list?: string[] // For dismissedUpsells
	organizationId?: string | null // For organizationSwitchResult
	// praisonaicode_change start: Managed Indexer
	managedIndexerEnabled?: boolean
	managedIndexerState?: Array<{
		workspaceFolderPath: string
		workspaceFolderName: string
		gitBranch: string | null
		projectId: string | null
		isIndexing: boolean
		hasManifest: boolean
		manifestFileCount: number
		hasWatcher: boolean
		error?: {
			type: string
			message: string
			timestamp: string
			context?: {
				filePath?: string
				branch?: string
				operation?: string
			}
		}
	}> // praisonaicode_change end: Managed Indexer
	browserSessionMessages?: ClineMessage[] // For browser session panel updates
	isBrowserSessionActive?: boolean // For browser session panel updates
	stepIndex?: number // For browserSessionNavigate: the target step index to display
	// praisonaicode_change start: Device auth data
	deviceAuthCode?: string
	deviceAuthVerificationUrl?: string
	deviceAuthExpiresIn?: number
	deviceAuthTimeRemaining?: number
	deviceAuthToken?: string
	deviceAuthUserEmail?: string
	deviceAuthError?: string
	// praisonaicode_change end: Device auth data
}

export type ExtensionState = Pick<
	GlobalSettings,
	| "currentApiConfigName"
	| "listApiConfigMeta"
	| "pinnedApiConfigs"
	| "customInstructions"
	| "dismissedUpsells"
	| "autoApprovalEnabled"
	| "yoloMode" // praisonaicode_change
	| "alwaysAllowReadOnly"
	| "alwaysAllowReadOnlyOutsideWorkspace"
	| "alwaysAllowWrite"
	| "alwaysAllowWriteOutsideWorkspace"
	| "alwaysAllowWriteProtected"
	| "alwaysAllowDelete" // praisonaicode_change
	| "alwaysAllowBrowser"
	| "alwaysApproveResubmit"
	| "alwaysAllowMcp"
	| "alwaysAllowModeSwitch"
	| "alwaysAllowSubtasks"
	| "alwaysAllowFollowupQuestions"
	| "alwaysAllowExecute"
	| "alwaysAllowUpdateTodoList"
	| "followupAutoApproveTimeoutMs"
	| "allowedCommands"
	| "deniedCommands"
	| "allowedMaxRequests"
	| "allowedMaxCost"
	| "browserToolEnabled"
	| "browserViewportSize"
	| "showAutoApproveMenu" // praisonaicode_change
	| "hideCostBelowThreshold" // praisonaicode_change
	| "screenshotQuality"
	| "remoteBrowserEnabled"
	| "cachedChromeHostUrl"
	| "remoteBrowserHost"
	| "ttsEnabled"
	| "ttsSpeed"
	| "soundEnabled"
	| "soundVolume"
	| "maxConcurrentFileReads"
	| "allowVeryLargeReads" // praisonaicode_change
	| "terminalOutputLineLimit"
	| "terminalOutputCharacterLimit"
	| "terminalShellIntegrationTimeout"
	| "terminalShellIntegrationDisabled"
	| "terminalCommandDelay"
	| "terminalPowershellCounter"
	| "terminalZshClearEolMark"
	| "terminalZshOhMy"
	| "terminalZshP10k"
	| "terminalZdotdir"
	| "terminalCompressProgressBar"
	| "diagnosticsEnabled"
	| "diffEnabled"
	| "fuzzyMatchThreshold"
	| "morphApiKey" // praisonaicode_change: Morph fast apply - global setting
	| "fastApplyModel" // praisonaicode_change: Fast Apply model selection
	| "fastApplyApiProvider" // praisonaicode_change: Fast Apply model api base url
	// | "experiments" // Optional in GlobalSettings, required here.
	| "language"
	| "modeApiConfigs"
	| "customModePrompts"
	| "customSupportPrompts"
	| "enhancementApiConfigId"
	| "localWorkflowToggles" // praisonaicode_change
	| "globalRulesToggles" // praisonaicode_change
	| "localRulesToggles" // praisonaicode_change
	| "globalWorkflowToggles" // praisonaicode_change
	| "commitMessageApiConfigId" // praisonaicode_change
	| "terminalCommandApiConfigId" // praisonaicode_change
	| "dismissedNotificationIds" // praisonaicode_change
	| "ghostServiceSettings" // praisonaicode_change
	| "autoPurgeEnabled" // praisonaicode_change
	| "autoPurgeDefaultRetentionDays" // praisonaicode_change
	| "autoPurgeFavoritedTaskRetentionDays" // praisonaicode_change
	| "autoPurgeCompletedTaskRetentionDays" // praisonaicode_change
	| "autoPurgeIncompleteTaskRetentionDays" // praisonaicode_change
	| "autoPurgeLastRunTimestamp" // praisonaicode_change
	| "condensingApiConfigId"
	| "customCondensingPrompt"
	| "yoloGatekeeperApiConfigId" // praisonaicode_change: AI gatekeeper for YOLO mode
	| "codebaseIndexConfig"
	| "codebaseIndexModels"
	| "profileThresholds"
	| "systemNotificationsEnabled" // praisonaicode_change
	| "includeDiagnosticMessages"
	| "maxDiagnosticMessages"
	| "imageGenerationProvider"
	| "openRouterImageGenerationSelectedModel"
	| "includeTaskHistoryInEnhance"
	| "reasoningBlockCollapsed"
	| "includeCurrentTime"
	| "includeCurrentCost"
	| "maxGitStatusFiles"
> & {
	version: string
	clineMessages: ClineMessage[]
	currentTaskItem?: HistoryItem
	currentTaskTodos?: TodoItem[] // Initial todos for the current task
	apiConfiguration: ProviderSettings
	uriScheme?: string
	uiKind?: string // praisonaicode_change

	praisonaiCodeWrapperProperties?: PraisonaiCodeWrapperProperties // praisonaicode_change: Wrapper information

	praisonaicodeDefaultModel: string
	shouldShowAnnouncement: boolean

	taskHistoryFullLength: number // praisonaicode_change
	taskHistoryVersion: number // praisonaicode_change

	writeDelayMs: number
	requestDelaySeconds: number

	enableCheckpoints: boolean
	checkpointTimeout: number // Timeout for checkpoint initialization in seconds (default: 15)
	maxOpenTabsContext: number // Maximum number of VSCode open tabs to include in context (0-500)
	maxWorkspaceFiles: number // Maximum number of files to include in current working directory details (0-500)
	showRooIgnoredFiles: boolean // Whether to show .praisonaicodeignore'd files in listings
	maxReadFileLine: number // Maximum number of lines to read from a file before truncating
	showAutoApproveMenu: boolean // praisonaicode_change: Whether to show the auto-approve menu in the chat view
	maxImageFileSize: number // Maximum size of image files to process in MB
	maxTotalImageSize: number // Maximum total size for all images in a single read operation in MB

	experiments: Experiments // Map of experiment IDs to their enabled state

	mcpEnabled: boolean
	enableMcpServerCreation: boolean

	mode: Mode
	customModes: ModeConfig[]
	toolRequirements?: Record<string, boolean> // Map of tool names to their requirements (e.g. {"apply_diff": true} if diffEnabled)

	cwd?: string // Current working directory
	telemetrySetting: TelemetrySetting
	telemetryKey?: string
	machineId?: string

	renderContext: "sidebar" | "editor"
	settingsImportedAt?: number
	historyPreviewCollapsed?: boolean
	showTaskTimeline?: boolean // praisonaicode_change
	sendMessageOnEnter?: boolean // praisonaicode_change
	hideCostBelowThreshold?: number // praisonaicode_change

	cloudUserInfo: CloudUserInfo | null
	cloudIsAuthenticated: boolean
	cloudApiUrl?: string
	cloudOrganizations?: CloudOrganizationMembership[]
	sharingEnabled: boolean
	organizationAllowList: OrganizationAllowList
	organizationSettingsVersion?: number

	isBrowserSessionActive: boolean // Actual browser session state

	autoCondenseContext: boolean
	autoCondenseContextPercent: number
	marketplaceItems?: MarketplaceItem[]
	marketplaceInstalledMetadata?: { project: Record<string, any>; global: Record<string, any> }
	profileThresholds: Record<string, number>
	hasOpenedModeSelector: boolean
	openRouterImageApiKey?: string
	praisonaiCodeImageApiKey?: string
	openRouterUseMiddleOutTransform?: boolean
	messageQueue?: QueuedMessage[]
	lastShownAnnouncementId?: string
	apiModelId?: string
	mcpServers?: McpServer[]
	hasSystemPromptOverride?: boolean
	mdmCompliant?: boolean
	remoteControlEnabled: boolean
	taskSyncEnabled: boolean
	featureRoomoteControlEnabled: boolean
	virtualQuotaActiveModel?: { id: string; info: ModelInfo } // praisonaicode_change: Add virtual quota active model for UI display
	showTimestamps?: boolean // praisonaicode_change: Show timestamps in chat messages
	debug?: boolean
	speechToTextStatus?: { available: boolean; reason?: "openaiKeyMissing" | "ffmpegNotInstalled" } // praisonaicode_change: Speech-to-text availability status with failure reason
}

export interface ClineSayTool {
	tool:
		| "editedExistingFile"
		| "appliedDiff"
		| "newFileCreated"
		| "codebaseSearch"
		| "readFile"
		| "fetchInstructions"
		| "listFilesTopLevel"
		| "listFilesRecursive"
		| "listCodeDefinitionNames"
		| "searchFiles"
		| "switchMode"
		| "newTask"
		| "finishTask"
		| "generateImage"
		| "imageGenerated"
		| "runSlashCommand"
		| "updateTodoList"
		| "deleteFile" // praisonaicode_change: Handles both files and directories
	path?: string
	diff?: string
	content?: string
	// Unified diff statistics computed by the extension
	diffStats?: { added: number; removed: number }
	regex?: string
	filePattern?: string
	mode?: string
	reason?: string
	isOutsideWorkspace?: boolean
	isProtected?: boolean
	additionalFileCount?: number // Number of additional files in the same read_file request
	lineNumber?: number
	query?: string
	// praisonaicode_change start: Directory stats - only present when deleting directories
	stats?: {
		files: number
		directories: number
		size: number
		isComplete: boolean
	}
	// praisonaicode_change end
	batchFiles?: Array<{
		path: string
		lineSnippet: string
		isOutsideWorkspace?: boolean
		key: string
		content?: string
	}>
	batchDiffs?: Array<{
		path: string
		changeCount: number
		key: string
		content: string
		// Per-file unified diff statistics computed by the extension
		diffStats?: { added: number; removed: number }
		diffs?: Array<{
			content: string
			startLine?: number
		}>
	}>
	question?: string
	// praisonaicode_change start
	fastApplyResult?: {
		description?: string
		tokensIn?: number
		tokensOut?: number
		cost?: number
	}
	// praisonaicode_change end
	imageData?: string // Base64 encoded image data for generated images
	// Properties for runSlashCommand tool
	command?: string
	args?: string
	source?: string
	description?: string
}

// Must keep in sync with system prompt.
export const browserActions = [
	"launch",
	"click",
	"hover",
	"type",
	"press",
	"scroll_down",
	"scroll_up",
	"resize",
	"close",
] as const

export type BrowserAction = (typeof browserActions)[number]

export interface ClineSayBrowserAction {
	action: BrowserAction
	coordinate?: string
	size?: string
	text?: string
	executedCoordinate?: string
}

export type BrowserActionResult = {
	screenshot?: string
	logs?: string
	currentUrl?: string
	currentMousePosition?: string
	viewportWidth?: number
	viewportHeight?: number
}

export interface ClineAskUseMcpServer {
	serverName: string
	type: "use_mcp_tool" | "access_mcp_resource"
	toolName?: string
	arguments?: string
	uri?: string
	response?: string
}

export interface ClineApiReqInfo {
	request?: string
	tokensIn?: number
	tokensOut?: number
	cacheWrites?: number
	cacheReads?: number
	cost?: number
	// praisonaicode_change
	usageMissing?: boolean
	inferenceProvider?: string
	// praisonaicode_change end
	cancelReason?: ClineApiReqCancelReason
	streamingFailedMessage?: string
	apiProtocol?: "anthropic" | "openai"
}

export type ClineApiReqCancelReason = "streaming_failed" | "user_cancelled"
