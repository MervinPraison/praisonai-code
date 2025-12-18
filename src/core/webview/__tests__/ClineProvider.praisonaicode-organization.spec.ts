// praisonaicode_change - new file
// npx vitest core/webview/__tests__/ClineProvider.praisonaicode-organization.spec.ts

import { setupCommonMocks, setupProvider, createMockWebviewView } from "../../../__tests__/common-mocks"

// Setup all mocks before any imports
setupCommonMocks()

describe("ClineProvider", () => {
	let provider: any
	let mockWebviewView: any

	beforeEach(() => {
		vi.clearAllMocks()
		const setup = setupProvider()
		provider = setup.provider
		mockWebviewView = createMockWebviewView()
	})

	describe("praisonaicodeOrganizationId", () => {
		test("preserves praisonaicodeOrganizationId when no previous token exists", async () => {
			await provider.resolveWebviewView(mockWebviewView)
			const messageHandler = (mockWebviewView.webview.onDidReceiveMessage as any).mock.calls[0][0]

			const mockUpsertProviderProfile = vi.fn()
			;(provider as any).upsertProviderProfile = mockUpsertProviderProfile
			;(provider as any).providerSettingsManager = {
				getProfile: vi.fn().mockResolvedValue({
					// Simulate saved config with NO praisonaicodeToken (common case)
					name: "test-config",
					apiProvider: "anthropic",
					apiKey: "test-key",
					id: "test-id",
				}),
			} as any

			await messageHandler({
				type: "upsertApiConfiguration",
				text: "test-config",
				apiConfiguration: {
					apiProvider: "anthropic" as const,
					apiKey: "test-key",
					praisonaicodeToken: "test-praisonai-token",
					praisonaicodeOrganizationId: "org-123",
				},
			})

			expect(mockUpsertProviderProfile).toHaveBeenCalledWith(
				"test-config",
				expect.objectContaining({
					praisonaicodeToken: "test-praisonai-token",
					praisonaicodeOrganizationId: "org-123", // Should be preserved
				}),
				false, // activate parameter
			)
		})

		test("clears praisonaicodeOrganizationId when token actually changes", async () => {
			await provider.resolveWebviewView(mockWebviewView)
			const messageHandler = (mockWebviewView.webview.onDidReceiveMessage as any).mock.calls[0][0]

			const mockUpsertProviderProfile = vi.fn()
			;(provider as any).upsertProviderProfile = mockUpsertProviderProfile
			;(provider as any).providerSettingsManager = {
				getProfile: vi.fn().mockResolvedValue({
					// Simulate saved config with DIFFERENT praisonaicodeToken
					name: "test-config",
					apiProvider: "anthropic",
					apiKey: "test-key",
					praisonaicodeToken: "old-praisonai-token",
					id: "test-id",
				}),
			} as any

			await messageHandler({
				type: "upsertApiConfiguration",
				text: "test-config",
				apiConfiguration: {
					apiProvider: "anthropic" as const,
					apiKey: "test-key",
					praisonaicodeToken: "new-praisonai-token", // Different token
					praisonaicodeOrganizationId: "org-123",
				},
			})

			// Verify the organization ID was cleared for security
			expect(mockUpsertProviderProfile).toHaveBeenCalledWith(
				"test-config",
				expect.objectContaining({
					praisonaicodeToken: "new-praisonai-token",
					praisonaicodeOrganizationId: undefined, // Should be cleared
				}),
				false, // activate parameter
			)
		})
	})
})
