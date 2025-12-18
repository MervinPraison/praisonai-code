import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { buildProviderEnvOverrides } from "../providerEnvMapper"
import type { ProviderSettings } from "@roo-code/types"

const log = (_msg: string) => {}
const debugLog = (_msg: string) => {}

describe("providerEnvMapper", () => {
	let tempHome: string

	beforeEach(() => {
		tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "provider-env-mapper-"))
	})

	afterEach(() => {
		fs.rmSync(tempHome, { recursive: true, force: true })
	})

	it("returns empty overrides when apiConfiguration is missing", () => {
		const overrides = buildProviderEnvOverrides(undefined, {}, log, debugLog)
		expect(overrides).toEqual({})
	})

	it("injects praisonaicode auth by switching to an existing CLI praisonaicode provider entry", () => {
		const configPath = path.join(tempHome, ".praisonaicode", "cli", "config.json")
		fs.mkdirSync(path.dirname(configPath), { recursive: true })
		fs.writeFileSync(
			configPath,
			JSON.stringify({
				version: "1.0.0",
				provider: "anthropic",
				providers: [
					{ id: "anthropic", provider: "anthropic", apiKey: "x", apiModelId: "y" },
					{
						id: "praisonai-1",
						provider: "praisonaicode",
						praisonaicodeToken: "",
						praisonaicodeModel: "claude-sonnet-4-20250514",
					},
				],
			}),
		)

		const baseEnv = { KEEP_ME: "1", PRAISONAICODE_TOKEN: "user-token" }
		const overrides = buildProviderEnvOverrides(
			{
				apiProvider: "praisonaicode",
				praisonaicodeToken: "ext-token",
			} as ProviderSettings,
			{ ...baseEnv, HOME: tempHome },
			log,
			debugLog,
		)

		expect(overrides.KILO_PROVIDER).toBe("praisonai-1")
		expect(overrides.KILO_PROVIDER_TYPE).toBeUndefined()
		expect(overrides.PRAISONAICODE_MODEL).toBeUndefined()
		expect(overrides.PRAISONAICODE_TOKEN).toBe("ext-token")
		expect(overrides.HOME).toBeUndefined()
		expect(overrides.KEEP_ME).toBeUndefined()
	})

	it("skips injection for non-praisonaicode providers", () => {
		const overrides = buildProviderEnvOverrides(
			{
				apiProvider: "openrouter",
				openRouterApiKey: "or-key",
				openRouterModelId: "openai/gpt-4",
			} as ProviderSettings,
			{},
			log,
			debugLog,
		)

		expect(overrides).toEqual({})
	})

	it("falls back to env-config mode when CLI config has no praisonaicode provider (overrides HOME)", () => {
		const configPath = path.join(tempHome, ".praisonaicode", "cli", "config.json")
		fs.mkdirSync(path.dirname(configPath), { recursive: true })
		fs.writeFileSync(
			configPath,
			JSON.stringify({
				version: "1.0.0",
				provider: "default",
				providers: [{ id: "default", provider: "anthropic", apiKey: "x", apiModelId: "y" }],
			}),
		)

		const overrides = buildProviderEnvOverrides(
			{
				apiProvider: "praisonaicode",
				praisonaicodeToken: "ext-token",
				praisonaicodeModel: "claude-sonnet-4-20250514",
			} as ProviderSettings,
			{ HOME: tempHome, TMPDIR: tempHome },
			log,
			debugLog,
		)

		expect(overrides.HOME).toBe(path.join(tempHome, "praisonaicode-agent-manager-home"))
		expect(overrides.USERPROFILE).toBe(path.join(tempHome, "praisonaicode-agent-manager-home"))
		expect(overrides.KILO_PROVIDER_TYPE).toBe("praisonaicode")
		expect(overrides.PRAISONAICODE_MODEL).toBe("claude-sonnet-4-20250514")
		expect(overrides.PRAISONAICODE_TOKEN).toBe("ext-token")
	})

	it("uses env-config mode without HOME override when no CLI config exists", () => {
		const overrides = buildProviderEnvOverrides(
			{
				apiProvider: "praisonaicode",
				praisonaicodeToken: "ext-token",
				praisonaicodeModel: "claude-sonnet-4-20250514",
			} as ProviderSettings,
			{ HOME: tempHome },
			log,
			debugLog,
		)

		expect(overrides.HOME).toBeUndefined()
		expect(overrides.KILO_PROVIDER_TYPE).toBe("praisonaicode")
		expect(overrides.PRAISONAICODE_MODEL).toBe("claude-sonnet-4-20250514")
		expect(overrides.PRAISONAICODE_TOKEN).toBe("ext-token")
	})

	it("skips injection when praisonaicode token is missing", () => {
		const overrides = buildProviderEnvOverrides(
			{
				apiProvider: "praisonaicode",
				praisonaicodeToken: "",
			} as ProviderSettings,
			{},
			log,
			debugLog,
		)

		expect(overrides).toEqual({})
	})

	it("includes org id when present", () => {
		const overrides = buildProviderEnvOverrides(
			{
				apiProvider: "praisonaicode",
				praisonaicodeToken: "ext-token",
				praisonaicodeModel: "claude-sonnet-4-20250514",
				praisonaicodeOrganizationId: "org-123",
			} as ProviderSettings,
			{ HOME: tempHome },
			log,
			debugLog,
		)

		expect(overrides.PRAISONAICODE_TOKEN).toBe("ext-token")
		expect(overrides.PRAISONAICODE_ORGANIZATION_ID).toBe("org-123")
	})
})
