import { X_PRAISONAICODE_VERSION } from "../../shared/praisonaicode/headers"
import { Package } from "../../shared/package"

export const DEFAULT_HEADERS = {
	// DO NOT ADJUST HTTP-Referer, OpenRouter uses this as an identifier
	// This needs coordination with them if adjustment is needed
	"HTTP-Referer": "https://praisonaicode.ai",
	"X-Title": "PraisonAI Code",
	[X_PRAISONAICODE_VERSION]: Package.version,
	"User-Agent": `PraisonAI-Code/${Package.version}`,
}
