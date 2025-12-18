import { useEffect, useState } from "react"
import { ProfileDataResponsePayload } from "@roo/WebviewMessage"
import { vscode } from "@/utils/vscode"

export function usePraisonaiIdentity(praisonaicodeToken: string, machineId: string) {
	const [praisonaiIdentity, setPraisonaiIdentity] = useState("")
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === "profileDataResponse") {
				const payload = event.data.payload as ProfileDataResponsePayload | undefined
				const success = payload?.success || false
				const tokenFromMessage = payload?.data?.praisonaicodeToken || ""
				const email = payload?.data?.user?.email || ""
				if (!success) {
					console.error("KILOTEL: Failed to identify Praisonai user, message doesn't indicate success:", payload)
				} else if (tokenFromMessage !== praisonaicodeToken) {
					console.error("KILOTEL: Failed to identify Praisonai user, token mismatch:", payload)
				} else if (!email) {
					console.error("KILOTEL: Failed to identify Praisonai user, email missing:", payload)
				} else {
					console.debug("KILOTEL: Praisonai user identified:", email)
					setPraisonaiIdentity(email)
					window.removeEventListener("message", handleMessage)
				}
			}
		}

		if (praisonaicodeToken) {
			console.debug("KILOTEL: fetching profile...")
			window.addEventListener("message", handleMessage)
			vscode.postMessage({
				type: "fetchProfileDataRequest",
			})
		} else {
			console.debug("KILOTEL: no Praisonai user")
			setPraisonaiIdentity("")
		}

		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [praisonaicodeToken])
	return praisonaiIdentity || machineId
}
