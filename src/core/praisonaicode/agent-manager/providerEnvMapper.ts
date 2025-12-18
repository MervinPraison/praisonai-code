import type { ProviderSettings } from "@roo-code/types"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

type EnvOverrides = Record<string, string>

const hasNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0

type CliConfigShape = {
	provider?: unknown
	providers?: unknown
}

type CliProviderShape = {
	id?: unknown
	provider?: unknown
}

const getHomeDirFromEnv = (baseEnv: NodeJS.ProcessEnv): string | undefined =>
	baseEnv.HOME || baseEnv.USERPROFILE || baseEnv.HOMEPATH

const getCliConfigPath = (baseEnv: NodeJS.ProcessEnv): string => {
	const homeDir = getHomeDirFromEnv(baseEnv) || os.homedir()
	return path.join(homeDir, ".praisonaicode", "cli", "config.json")
}

const readCliConfig = (filePath: string): CliConfigShape | undefined => {
	try {
		const raw = fs.readFileSync(filePath, "utf8")
		return JSON.parse(raw) as CliConfigShape
	} catch {
		return undefined
	}
}

const findPraisonaicodeProviderId = (config: CliConfigShape | undefined): string | undefined => {
	const providers = Array.isArray(config?.providers) ? (config!.providers as unknown[]) : []
	const praisonaiProviders = providers.filter((p): p is CliProviderShape => {
		const provider = (p as CliProviderShape | undefined)?.provider
		const id = (p as CliProviderShape | undefined)?.id
		return provider === "praisonaicode" && hasNonEmptyString(id)
	})

	if (praisonaiProviders.length === 0) {
		return undefined
	}

	const defaultPraisonai = praisonaiProviders.find((p) => p.id === "default")
	return (defaultPraisonai?.id as string | undefined) ?? (praisonaiProviders[0]!.id as string)
}

const getTempDirFromEnv = (baseEnv: NodeJS.ProcessEnv): string =>
	baseEnv.TMPDIR || baseEnv.TEMP || baseEnv.TMP || os.tmpdir()

/**
 * Inject IDE Praisonaicode authentication into Agent Manager CLI spawns.
 *
 * Design choice: we only inject Praisonaicode auth (not BYOK providers) to avoid
 * maintaining provider-specific env mappings here.
 *
 * Behavior:
 * - If the IDE's active provider is `praisonaicode` and a token exists, we inject:
 *   - `PRAISONAICODE_TOKEN` (required)
 *   - `PRAISONAICODE_ORGANIZATION_ID` (optional)
 *
 * Provider selection strategy (important for older CLIs):
 * - If the user's CLI config contains a `praisonaicode` provider entry, we set `KILO_PROVIDER`
 *   to that provider id so the CLI switches to it without changing other CLI settings.
 * - If no `praisonaicode` provider exists in CLI config, we fall back to env-config mode by
 *   setting `KILO_PROVIDER_TYPE=praisonaicode` and required vars. To ensure the CLI uses env
 *   config even when a config file exists, we override `HOME` to a temporary directory.
 * - If missing/partial, we log and return `{}` so the CLI runs unchanged.
 */
export const buildProviderEnvOverrides = (
	apiConfiguration: ProviderSettings | undefined,
	baseEnv: NodeJS.ProcessEnv,
	log: (message: string) => void,
	debugLog: (message: string) => void,
): EnvOverrides => {
	if (!apiConfiguration) {
		debugLog("[AgentManager] No apiConfiguration found; using existing environment.")
		return {}
	}

	if (!apiConfiguration.apiProvider) {
		log("[AgentManager] apiConfiguration missing provider; skipping CLI env injection.")
		return {}
	}

	if (apiConfiguration.apiProvider !== "praisonaicode") {
		debugLog(`[AgentManager] Provider "${apiConfiguration.apiProvider}" not eligible for env injection; skipping.`)
		return {}
	}

	if (!hasNonEmptyString(apiConfiguration.praisonaicodeToken)) {
		log("[AgentManager] Missing Praisonaicode token in apiConfiguration; skipping CLI auth injection.")
		return {}
	}

	const overrides: EnvOverrides = {}

	// Prefer switching to an existing Praisonaicode provider entry in the user's CLI config
	// (preserves other CLI settings like auto-approval and themes).
	const cliConfigPath = getCliConfigPath(baseEnv)
	const hasCliConfigFile = fs.existsSync(cliConfigPath)

	const cliConfig = hasCliConfigFile ? readCliConfig(cliConfigPath) : undefined
	const praisonaicodeProviderId = findPraisonaicodeProviderId(cliConfig)

	if (praisonaicodeProviderId) {
		overrides.KILO_PROVIDER = praisonaicodeProviderId
		overrides.PRAISONAICODE_TOKEN = apiConfiguration.praisonaicodeToken
	} else {
		// Fallback: env-config mode requires model id as well.
		if (!hasNonEmptyString(apiConfiguration.praisonaicodeModel)) {
			log("[AgentManager] Missing Praisonaicode model in apiConfiguration; skipping CLI auth injection.")
			return {}
		}

		overrides.KILO_PROVIDER = "default"
		overrides.KILO_PROVIDER_TYPE = "praisonaicode"
		overrides.PRAISONAICODE_TOKEN = apiConfiguration.praisonaicodeToken
		overrides.PRAISONAICODE_MODEL = apiConfiguration.praisonaicodeModel

		// Older CLIs will only honor env-config when no config file exists. If a user has configured
		// another provider in the CLI, we override HOME so the CLI doesn't see their existing config.
		if (hasCliConfigFile) {
			const tempDir = getTempDirFromEnv(baseEnv)
			const isolatedHome = path.join(tempDir, "praisonaicode-agent-manager-home")
			// Cross-platform: Node's os.homedir() uses USERPROFILE on Windows.
			overrides.HOME = isolatedHome
			overrides.USERPROFILE = isolatedHome
		}
	}

	if (hasNonEmptyString(apiConfiguration.praisonaicodeOrganizationId)) {
		overrides.PRAISONAICODE_ORGANIZATION_ID = apiConfiguration.praisonaicodeOrganizationId
	}

	const appliedKeys = Object.keys(overrides).filter((key) => key !== "PRAISONAICODE_TOKEN")
	debugLog(`[AgentManager] Injecting Praisonaicode CLI auth env (keys: ${appliedKeys.join(", ")})`)

	return overrides
}
