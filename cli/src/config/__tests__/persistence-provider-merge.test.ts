import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import * as fs from "fs/promises"
import * as path from "path"
import { loadConfig, setConfigPaths, resetConfigPaths } from "../persistence.js"
import type { CLIConfig } from "../types.js"

// Mock the validation module
vi.mock("../validation.js", () => ({
	validateConfig: vi.fn().mockResolvedValue({ valid: true }),
}))

describe("Provider Merging", () => {
	const testDir = path.join(process.cwd(), "test-config-provider-merge")
	const testFile = path.join(testDir, "config.json")

	beforeEach(async () => {
		await fs.mkdir(testDir, { recursive: true })
		setConfigPaths(testDir, testFile)
	})

	afterEach(async () => {
		resetConfigPaths()
		await fs.rm(testDir, { recursive: true, force: true })
	})

	it("should merge provider fields from defaults when provider type matches", async () => {
		// Create a config file with matching provider type but missing some fields
		const configWithMatchingProvider = {
			version: "1.0.0",
			mode: "code",
			telemetry: true,
			provider: "default",
			providers: [
				{
					id: "default",
					provider: "praisonaicode",
					// Missing praisonaicodeToken and praisonaicodeModel - should be filled from defaults
				},
			],
			theme: "dark",
		}

		await fs.writeFile(testFile, JSON.stringify(configWithMatchingProvider, null, 2))

		// Load the config - it should merge with defaults
		const result = await loadConfig()

		// Check that missing fields were added from defaults
		expect(result.config.providers[0]).toHaveProperty("provider")
		expect(result.config.providers[0].provider).toBe("praisonaicode")
		expect(result.config.providers[0].id).toBe("default")
		expect(result.config.providers[0]).toHaveProperty("praisonaicodeToken")
		expect(result.config.providers[0]).toHaveProperty("praisonaicodeModel")
		expect(result.config.providers[0].praisonaicodeModel).toBe("x-ai/grok-code-fast-1")
		expect(result.validation.valid).toBe(true)
	})

	it("should preserve provider field when present in loaded config", async () => {
		// Create a config file with the provider field
		const configWithProviderField: CLIConfig = {
			version: "1.0.0",
			mode: "code",
			telemetry: true,
			provider: "default",
			providers: [
				{
					id: "default",
					provider: "praisonaicode",
					praisonaicodeToken: "test-token-1234567890",
					praisonaicodeModel: "anthropic/claude-sonnet-4.5",
				},
			],
			theme: "dark",
		}

		await fs.writeFile(testFile, JSON.stringify(configWithProviderField, null, 2))

		// Load the config
		const result = await loadConfig()

		// Check that the provider field is preserved
		expect(result.config.providers[0].provider).toBe("praisonaicode")
		expect(result.config.providers[0].id).toBe("default")
		expect(result.config.providers[0].praisonaicodeToken).toBe("test-token-1234567890")
		expect(result.validation.valid).toBe(true)
	})

	it("should not merge fields when provider types don't match", async () => {
		// Create a config with anthropic provider - should not get praisonaicode fields
		const configWithDifferentProvider = {
			version: "1.0.0",
			mode: "code",
			telemetry: true,
			provider: "anthropic-custom",
			providers: [
				{
					id: "anthropic-custom",
					provider: "anthropic",
					apiKey: "test-anthropic-key",
					// Should not get praisonaicodeToken or praisonaicodeModel
				},
			],
			theme: "dark",
		}

		await fs.writeFile(testFile, JSON.stringify(configWithDifferentProvider, null, 2))

		// Load the config
		const result = await loadConfig()

		// Check that anthropic provider doesn't have praisonaicode-specific fields
		expect(result.config.providers[0].provider).toBe("anthropic")
		expect(result.config.providers[0].apiKey).toBe("test-anthropic-key")
		expect(result.config.providers[0]).not.toHaveProperty("praisonaicodeToken")
		expect(result.config.providers[0]).not.toHaveProperty("praisonaicodeModel")
		expect(result.validation.valid).toBe(true)
	})

	it("should only merge when provider field matches between loaded and default config", async () => {
		// Create a config with praisonaicode provider that has custom values
		const configWithPraisonaicodeProvider = {
			version: "1.0.0",
			mode: "code",
			telemetry: true,
			provider: "custom-praisonai",
			providers: [
				{
					id: "custom-praisonai",
					provider: "praisonaicode",
					praisonaicodeToken: "custom-token-xyz",
					praisonaicodeModel: "anthropic/claude-opus-4",
				},
			],
			theme: "dark",
		}

		await fs.writeFile(testFile, JSON.stringify(configWithPraisonaicodeProvider, null, 2))

		// Load the config
		const result = await loadConfig()

		// Check that custom values are preserved (not overwritten by defaults)
		expect(result.config.providers[0].provider).toBe("praisonaicode")
		expect(result.config.providers[0].id).toBe("custom-praisonai")
		expect(result.config.providers[0].praisonaicodeToken).toBe("custom-token-xyz")
		expect(result.config.providers[0].praisonaicodeModel).toBe("anthropic/claude-opus-4")
		expect(result.validation.valid).toBe(true)
	})
})
