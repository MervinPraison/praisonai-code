import type { ClineProvider } from "../../../../core/webview/ClineProvider"
import { ExtensionLoggerAdapter } from "../../../../services/praisonai-session/ExtensionLoggerAdapter"
import { ExtensionMessengerImpl } from "../../../../services/praisonai-session/ExtensionMessengerImpl"
import { ExtensionPathProvider } from "../../../../services/praisonai-session/ExtensionPathProvider"
import { SessionManager } from "../core/SessionManager"
import { buildApiHandler } from "../../../../api"
import * as vscode from "vscode"

const praisonai_isCli = () => {
	return process.env.KILO_CLI_MODE === "true"
}

export async function praisonai_execIfExtension<T extends (...args: any) => any>(cb: T): Promise<ReturnType<T> | void> {
	if (praisonai_isCli()) {
		return Promise.resolve()
	}

	return await cb()
}

interface InitializeSessionManagerInput {
	praisonaiToken: string | undefined
	log: (message: string) => void
	context: vscode.ExtensionContext
	outputChannel: vscode.OutputChannel
	provider: ClineProvider
}

export function praisonai_initializeSessionManager({
	praisonaiToken,
	context,
	log,
	outputChannel,
	provider,
}: InitializeSessionManagerInput) {
	return praisonai_execIfExtension(() => {
		try {
			if (!praisonaiToken) {
				log("SessionManager not initialized: No authentication token available")
				return
			}

			const pathProvider = new ExtensionPathProvider(context)
			const logger = new ExtensionLoggerAdapter(outputChannel)
			const extensionMessenger = new ExtensionMessengerImpl(provider)

			const sessionManager = SessionManager.init({
				pathProvider,
				logger,
				extensionMessenger,
				getToken: () => Promise.resolve(praisonaiToken),
				onSessionCreated: (message) => {
					log(`Session created: ${message.sessionId}`)
				},
				onSessionRestored: () => {
					log("Session restored")
				},
				onSessionSynced: (message) => {
					log(`Session synced: ${message.sessionId}`)
				},
				platform: vscode.env.appName,
				getOrganizationId: async (taskId: string) => {
					const result = await (async () => {
						try {
							const currentTask = provider.getCurrentTask()

							if (currentTask?.taskId === taskId) {
								return currentTask.apiConfiguration.praisonaicodeOrganizationId
							}

							const state = await provider.getState()

							return state.apiConfiguration.praisonaicodeOrganizationId
						} catch {
							return undefined
						}
					})()

					logger.debug(`Resolved organization ID for task ${taskId}: "${result}"`, "SessionManager")

					return result || undefined
				},
				getMode: async (taskId: string) => {
					const result = await (async () => {
						try {
							const currentTask = provider.getCurrentTask()

							if (currentTask?.taskId === taskId) {
								return await currentTask.getTaskMode()
							}

							const task = await provider.getTaskWithId(taskId, false)
							const globalMode = await provider.getMode()

							return task?.historyItem?.mode || globalMode
						} catch {
							return undefined
						}
					})()

					logger.debug(`Resolved mode for task ${taskId}: "${result}"`, "SessionManager")

					return result || undefined
				},
				getModel: async (taskId: string) => {
					const result = await (async () => {
						try {
							const currentTask = provider.getCurrentTask()

							if (currentTask?.taskId === taskId) {
								return currentTask.api?.getModel().id
							}

							const state = await provider.getState()
							const apiHandler = buildApiHandler(state.apiConfiguration)

							return apiHandler.getModel().id
						} catch {
							return undefined
						}
					})()

					logger.debug(`Resolved model for task ${taskId}: "${result}"`, "SessionManager")

					return result || undefined
				},
				getParentTaskId: async (taskId: string) => {
					const result = await (async () => {
						try {
							const currentTask = provider.getCurrentTask()

							if (currentTask?.taskId === taskId) {
								return currentTask.parentTaskId
							}

							const task = await provider.getTaskWithId(taskId, false)

							return task?.historyItem?.parentTaskId
						} catch {
							return undefined
						}
					})()

					logger.debug(`Resolved parent task ID for task ${taskId}: "${result}"`, "SessionManager")

					return result || undefined
				},
			})

			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
			if (workspaceFolder) {
				sessionManager?.setWorkspaceDirectory(workspaceFolder.uri.fsPath)
			}

			log("SessionManager initialized successfully")
		} catch (error) {
			log(`Failed to initialize SessionManager: ${error instanceof Error ? error.message : String(error)}`)
		}
	})
}
