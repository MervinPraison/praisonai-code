import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getPraisonaicodeProfile } from "../../auth/providers/praisonaicode/shared.js"
import type { PraisonaicodeProfileData } from "../../auth/types.js"

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as typeof fetch

describe("getPraisonaicodeProfile", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("should fetch profile data successfully with organizations", async () => {
		const mockProfileData: PraisonaicodeProfileData = {
			user: {
				name: "John Doe",
				email: "john@example.com",
				image: "https://example.com/avatar.jpg",
			},
			organizations: [
				{
					id: "org-123",
					name: "Acme Corp",
					role: "admin",
				},
				{
					id: "org-456",
					name: "My Startup",
					role: "member",
				},
			],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockProfileData,
		})

		const result = await getPraisonaicodeProfile("test-token-1234567890")

		expect(result).toEqual(mockProfileData)
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("/api/profile"),
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer test-token-1234567890",
					"Content-Type": "application/json",
				}),
			}),
		)
	})

	it("should fetch profile data successfully without organizations", async () => {
		const mockProfileData: PraisonaicodeProfileData = {
			user: {
				name: "Jane Doe",
				email: "jane@example.com",
			},
			organizations: [],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockProfileData,
		})

		const result = await getPraisonaicodeProfile("test-token-1234567890")

		expect(result).toEqual(mockProfileData)
		expect(result.organizations).toHaveLength(0)
	})

	it("should throw INVALID_TOKEN error for 401 Unauthorized", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
		})

		await expect(getPraisonaicodeProfile("invalid-token")).rejects.toThrow("INVALID_TOKEN")
	})

	it("should throw INVALID_TOKEN error for 403 Forbidden", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 403,
		})

		await expect(getPraisonaicodeProfile("invalid-token")).rejects.toThrow("INVALID_TOKEN")
	})

	it("should throw error with status code for other HTTP errors", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
		})

		await expect(getPraisonaicodeProfile("test-token")).rejects.toThrow("Failed to fetch profile: 500")
	})

	it("should handle network errors", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Network error"))

		await expect(getPraisonaicodeProfile("test-token")).rejects.toThrow("Failed to fetch profile: Network error")
	})

	it("should handle timeout errors", async () => {
		mockFetch.mockRejectedValueOnce(new Error("The operation was aborted"))

		await expect(getPraisonaicodeProfile("test-token")).rejects.toThrow(
			"Failed to fetch profile: The operation was aborted",
		)
	})

	it("should handle JSON parsing errors", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => {
				throw new Error("Invalid JSON")
			},
		})

		await expect(getPraisonaicodeProfile("test-token")).rejects.toThrow("Failed to fetch profile: Invalid JSON")
	})

	it("should handle empty token gracefully", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: { email: "test@example.com" },
				organizations: [],
			}),
		})

		const result = await getPraisonaicodeProfile("")

		expect(result).toBeDefined()
		expect(mockFetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer ",
				}),
			}),
		)
	})

	it("should include proper headers in the request", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ user: {}, organizations: [] }),
		})

		await getPraisonaicodeProfile("test-token-1234567890")

		expect(mockFetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				headers: expect.objectContaining({
					"Content-Type": "application/json",
					Authorization: "Bearer test-token-1234567890",
				}),
			}),
		)
	})

	it("should handle profile with only user data", async () => {
		const mockProfileData: PraisonaicodeProfileData = {
			user: {
				name: "Test User",
				email: "test@example.com",
			},
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockProfileData,
		})

		const result = await getPraisonaicodeProfile("test-token")

		expect(result).toEqual(mockProfileData)
		expect(result.organizations).toBeUndefined()
	})

	it("should handle profile with multiple organizations", async () => {
		const mockProfileData: PraisonaicodeProfileData = {
			user: {
				email: "user@example.com",
			},
			organizations: [
				{ id: "org-1", name: "Org 1", role: "owner" },
				{ id: "org-2", name: "Org 2", role: "admin" },
				{ id: "org-3", name: "Org 3", role: "member" },
			],
		}

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockProfileData,
		})

		const result = await getPraisonaicodeProfile("test-token")

		expect(result.organizations).toHaveLength(3)
		expect(result.organizations?.[0]).toEqual({ id: "org-1", name: "Org 1", role: "owner" })
	})
})
