import { describe, expect, it, vi, beforeEach } from "vitest"

const isWindows = process.platform === "win32"

describe("findPraisonaicodeCli", () => {
	beforeEach(() => {
		vi.resetModules()
	})

	const loginShellTests = isWindows ? it.skip : it

	loginShellTests("finds CLI via login shell and returns trimmed result", async () => {
		// Login shell is tried first, so mock it to succeed
		const execSyncMock = vi.fn().mockReturnValue("/Users/test/.nvm/versions/node/v20/bin/praisonaicode\n")
		vi.doMock("node:child_process", () => ({ execSync: execSyncMock }))
		vi.doMock("../../../../utils/fs", () => ({ fileExistsAtPath: vi.fn().mockResolvedValue(false) }))

		const { findPraisonaicodeCli } = await import("../CliPathResolver")
		const result = await findPraisonaicodeCli()

		expect(result).toBe("/Users/test/.nvm/versions/node/v20/bin/praisonaicode")
		// First call should be login shell (on non-Windows)
		expect(execSyncMock).toHaveBeenCalledWith(
			expect.stringContaining("which praisonaicode"),
			expect.objectContaining({ encoding: "utf-8" }),
		)
	})

	loginShellTests("falls back to direct PATH when login shell fails", async () => {
		let callCount = 0
		const execSyncMock = vi.fn().mockImplementation((cmd: string) => {
			callCount++
			// First call (login shell) fails, second call (direct PATH) succeeds
			if (callCount === 1) {
				throw new Error("login shell failed")
			}
			return "/usr/local/bin/praisonaicode\n"
		})
		vi.doMock("node:child_process", () => ({ execSync: execSyncMock }))
		vi.doMock("../../../../utils/fs", () => ({ fileExistsAtPath: vi.fn().mockResolvedValue(false) }))

		const { findPraisonaicodeCli } = await import("../CliPathResolver")
		const result = await findPraisonaicodeCli()

		expect(result).toBe("/usr/local/bin/praisonaicode")
		expect(execSyncMock).toHaveBeenCalledTimes(2)
	})

	it("falls back to npm paths when all PATH lookups fail", async () => {
		const execSyncMock = vi.fn().mockImplementation(() => {
			throw new Error("not found")
		})
		const fileExistsMock = vi.fn().mockImplementation((path: string) => {
			// Return true for first path checked to verify fallback works
			return Promise.resolve(path.includes("praisonaicode"))
		})
		vi.doMock("node:child_process", () => ({ execSync: execSyncMock }))
		vi.doMock("../../../../utils/fs", () => ({ fileExistsAtPath: fileExistsMock }))

		const { findPraisonaicodeCli } = await import("../CliPathResolver")
		const result = await findPraisonaicodeCli()

		expect(result).not.toBeNull()
		expect(fileExistsMock).toHaveBeenCalled()
	})

	it("returns null when CLI is not found anywhere", async () => {
		vi.doMock("node:child_process", () => ({
			execSync: vi.fn().mockImplementation(() => {
				throw new Error("not found")
			}),
		}))
		vi.doMock("../../../../utils/fs", () => ({ fileExistsAtPath: vi.fn().mockResolvedValue(false) }))

		const { findPraisonaicodeCli } = await import("../CliPathResolver")
		const logMock = vi.fn()
		const result = await findPraisonaicodeCli(logMock)

		expect(result).toBeNull()
		expect(logMock).toHaveBeenCalledWith("praisonaicode CLI not found")
	})

	it("logs when praisonaicode not in direct PATH", async () => {
		vi.doMock("node:child_process", () => ({
			execSync: vi.fn().mockImplementation(() => {
				throw new Error("not found")
			}),
		}))
		vi.doMock("../../../../utils/fs", () => ({ fileExistsAtPath: vi.fn().mockResolvedValue(false) }))

		const { findPraisonaicodeCli } = await import("../CliPathResolver")
		const logMock = vi.fn()
		await findPraisonaicodeCli(logMock)

		expect(logMock).toHaveBeenCalledWith("praisonaicode not found in direct PATH lookup")
	})
})
