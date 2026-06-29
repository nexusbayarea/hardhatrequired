import { z } from 'zod';

export const zipSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code');
export const radiusSchema = z.number().int().min(1).max(100);
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email().optional();
export const phoneSchema = z.string().optional();

export const searchFiltersSchema = z.object({
  zip: zipSchema,
  radius: radiusSchema
});

export const searchRequestSchema = z.object({
  zip: zipSchema,
  radius: radiusSchema,
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional()
});

export const orgCreateSchema = z.object({
  name: z.string().min(1).max(255),
  subscriptionTier: z.enum(['starter', 'pro', 'enterprise']).optional()
});

export const orgUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subscriptionTier: z.enum(['starter', 'pro', 'enterprise']).optional()
});

export const campaignCreateSchema = z.object({
  name: z.string().min(1).max(255),
  verticalSlug: z.string().optional()
});

export const outreachLogSchema = z.object({
  companyId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  interactionType: z.enum(['CALL', 'EMAIL', 'LINKEDIN', 'NOTE']),
  outcome: z.enum([
    'no_answer', 'left_voicemail', 'busy',
    'connected_interested', 'connected_not_interested',
    'sent_proposal', 'out_of_service'
  ]),
  notes: z.string().optional()
});

export const authInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'SALES', 'VIEWER'])
});

export const usageEventSchema = z.object({
  eventType: z.enum(['search', 'enrichment', 'export', 'campaign']),
  units: z.number().int().min(1).default(1),
  metadata: z.record(z.unknown()).optional()
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data?: T; error?: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return { error: `${firstError.path.join('.')}: ${firstError.message}` };
  }
  return { data: result.data };
}
