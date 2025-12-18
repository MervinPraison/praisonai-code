// praisonaicode_change - new file
import { z } from "zod"

/**
 * PraisonAI Code Organization Settings Schema
 * These settings control organization-level features and configurations
 */
export const PraisonaiOrganizationSettingsSchema = z.object({
	model_allow_list: z.array(z.string()).optional(),
	provider_allow_list: z.array(z.string()).optional(),
	default_model: z.string().optional(),
	data_collection: z.enum(["allow", "deny"]).nullable().optional(),
	// null means they were grandfathered in and so they have usage limits enabled
	enable_usage_limits: z.boolean().optional(),
	code_indexing_enabled: z.boolean().optional(),
})

export type PraisonaiOrganizationSettings = z.infer<typeof PraisonaiOrganizationSettingsSchema>

/**
 * PraisonAI Code Organization Schema
 * Represents the full organization object returned from the API
 */
export const PraisonaiOrganizationSchema = z.object({
	id: z.string(),
	name: z.string(),
	settings: PraisonaiOrganizationSettingsSchema,
})

export type PraisonaiOrganization = z.infer<typeof PraisonaiOrganizationSchema>
