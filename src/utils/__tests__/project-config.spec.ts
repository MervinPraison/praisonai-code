// praisonaicode_change - new file
// npx vitest run src/utils/__tests__/project-config.spec.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import * as path from "path"
import { promises as fs } from "fs"
import * as os from "os"
import { getPraisonaicodeConfigFile, getProjectId, normalizeProjectId } from "../praisonai-config-file"

describe("project-config", () => {
	let tempDir: string

	beforeEach(async () => {
		// Create a temporary directory for testing
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "praisonaicode-test-"))
	})

	afterEach(async () => {
		// Clean up temporary directory
		try {
			await fs.rm(tempDir, { recursive: true, force: true })
		} catch (error) {
			// Ignore cleanup errors
		}
	})

	describe("normalizeProjectId", () => {
		it("extracts repository name from HTTPS git URL", () => {
			expect(normalizeProjectId("https://github.com/MervinPraison/handbook.git")).toBe("handbook")
		})

		it("extracts repository name from SSH git URL", () => {
			expect(normalizeProjectId("git@github.com:MervinPraison/handbook.git")).toBe("handbook")
		})

		it("extracts repository name from SSH git URL without .git extension", () => {
			expect(normalizeProjectId("git@github.com:brianc/node-postgres")).toBe("node-postgres")
		})

		it("returns plain project ID as-is", () => {
			expect(normalizeProjectId("my-project")).toBe("my-project")
		})

		it("returns undefined for undefined input", () => {
			expect(normalizeProjectId(undefined)).toBeUndefined()
		})

		it("handles git URLs without .git extension", () => {
			expect(normalizeProjectId("my-custom-id")).toBe("my-custom-id")
		})
	})

	describe("getProjectConfig", () => {
		it("returns config from .praisonaicode/config.json", async () => {
			const praisonaicodeDir = path.join(tempDir, ".praisonaicode")
			await fs.mkdir(praisonaicodeDir, { recursive: true })
			await fs.writeFile(
				path.join(praisonaicodeDir, "config.json"),
				JSON.stringify({
					project: {
						id: "my-project",
					},
				}),
			)

			const config = await getPraisonaicodeConfigFile(tempDir)

			expect(config).toEqual({
				project: {
					id: "my-project",
				},
			})
		})

		it("returns null when no config file exists", async () => {
			const config = await getPraisonaicodeConfigFile(tempDir)

			expect(config).toBeNull()
		})

		it("returns null when config file is invalid JSON", async () => {
			const praisonaicodeDir = path.join(tempDir, ".praisonaicode")
			await fs.mkdir(praisonaicodeDir, { recursive: true })
			await fs.writeFile(path.join(praisonaicodeDir, "config.json"), "{ invalid json }")

			const config = await getPraisonaicodeConfigFile(tempDir)

			expect(config).toBeNull()
		})
	})

	describe("getProjectId", () => {
		it("returns normalized project ID from config file when available", async () => {
			const praisonaicodeDir = path.join(tempDir, ".praisonaicode")
			await fs.mkdir(praisonaicodeDir, { recursive: true })
			await fs.writeFile(
				path.join(praisonaicodeDir, "config.json"),
				JSON.stringify({
					project: {
						id: "config-project-id",
					},
				}),
			)

			const projectId = await getProjectId(tempDir, "https://github.com/user/repo.git")

			expect(projectId).toBe("config-project-id")
		})

		it("normalizes git repository URL when config file doesn't exist", async () => {
			const projectId = await getProjectId(tempDir, "https://github.com/user/repo.git")

			expect(projectId).toBe("repo")
		})

		it("normalizes SSH git URL when config file doesn't exist", async () => {
			const projectId = await getProjectId(tempDir, "git@github.com:MervinPraison/handbook.git")

			expect(projectId).toBe("handbook")
		})

		it("normalizes git URL when config file has no project.id", async () => {
			const praisonaicodeDir = path.join(tempDir, ".praisonaicode")
			await fs.mkdir(praisonaicodeDir, { recursive: true })
			await fs.writeFile(
				path.join(praisonaicodeDir, "config.json"),
				JSON.stringify({
					project: {},
				}),
			)

			const projectId = await getProjectId(tempDir, "https://github.com/user/repo.git")

			expect(projectId).toBe("repo")
		})

		it("returns undefined when neither config nor git URL is available", async () => {
			const projectId = await getProjectId(tempDir)

			expect(projectId).toBeUndefined()
		})

		it("prioritizes config file over git URL", async () => {
			const praisonaicodeDir = path.join(tempDir, ".praisonaicode")
			await fs.mkdir(praisonaicodeDir, { recursive: true })
			await fs.writeFile(
				path.join(praisonaicodeDir, "config.json"),
				JSON.stringify({
					project: {
						id: "override-project",
					},
				}),
			)

			const projectId = await getProjectId(tempDir, "https://github.com/user/repo.git")

			expect(projectId).toBe("override-project")
		})

		it("normalizes git URL in config file", async () => {
			const praisonaicodeDir = path.join(tempDir, ".praisonaicode")
			await fs.mkdir(praisonaicodeDir, { recursive: true })
			await fs.writeFile(
				path.join(praisonaicodeDir, "config.json"),
				JSON.stringify({
					project: {
						id: "https://github.com/MervinPraison/handbook.git",
					},
				}),
			)

			const projectId = await getProjectId(tempDir)

			expect(projectId).toBe("handbook")
		})
	})
})
