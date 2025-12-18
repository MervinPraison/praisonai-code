import { getApiUrl } from "@roo-code/types"
import { logs } from "../services/logs.js"
import type { PraisonaicodeNotification } from "../state/atoms/notifications.js"
import type { ProviderConfig } from "../config/types.js"
import { generateMessage } from "../ui/utils/messages.js"

/**
 * Response from the Praisonaicode notifications API
 */
interface NotificationsResponse {
	notifications: PraisonaicodeNotification[]
}

/**
 * Fetch notifications from the Praisonaicode backend
 *
 * @param provider - The provider configuration (must be a praisonaicode provider)
 * @returns Array of notifications, or empty array if fetch fails or provider is not praisonaicode
 */
export async function fetchPraisonaicodeNotifications({
	provider,
	praisonaicodeToken,
}: ProviderConfig): Promise<PraisonaicodeNotification[]> {
	if (provider !== "praisonaicode") {
		logs.debug("Provider is not praisonaicode, skipping notification fetch", "fetchPraisonaicodeNotifications", {
			provider,
		})
		return []
	}

	if (!praisonaicodeToken || typeof praisonaicodeToken !== "string") {
		logs.debug("No praisonaicode token found, skipping notification fetch", "fetchPraisonaicodeNotifications")
		return []
	}

	const url = getApiUrl("/api/users/notifications")

	logs.debug("Fetching Praisonaicode notifications", "NotificationsUtil", { url })

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${praisonaicodeToken}`,
			"Content-Type": "application/json",
		},
	})

	if (!response.ok) {
		logs.error("Failed to fetch Praisonaicode notifications", "NotificationsUtil", {
			status: response.status,
		})
		return []
	}

	const { notifications } = (await response.json()) as NotificationsResponse

	return notifications.filter(({ showIn }) => !showIn || showIn.includes("cli"))
}

/**
 * Check if a provider supports notifications
 *
 * @param provider - The provider configuration
 * @returns true if the provider supports notifications
 */
export function supportsNotifications(provider: ProviderConfig): boolean {
	return provider.provider === "praisonaicode" && !!provider.praisonaicodeToken
}

/**
 * Generate a CLI message from a Praisonaicode notification
 *
 * @param notification - The notification to convert to a CLI message
 * @returns A CLI message object
 */
export function generateNotificationMessage(notification: PraisonaicodeNotification) {
	let content = `## ${notification.title}\n\n${notification.message}`

	if (notification.action) {
		content += `\n\n[${notification.action.actionText}](${notification.action.actionURL})`
	}

	return {
		...generateMessage(),
		type: "system" as const,
		content,
	}
}
