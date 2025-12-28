import { z } from 'zod';
import { insertPropertySchema, insertLeadSchema, properties, leads, profiles } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  properties: {
    list: {
      method: 'GET' as const,
      path: '/api/properties',
      input: z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        agentId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof properties.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/properties/:id',
      responses: {
        200: z.custom<typeof properties.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/properties',
      input: insertPropertySchema,
      responses: {
        201: z.custom<typeof properties.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/properties/:id',
      input: insertPropertySchema.partial(),
      responses: {
        200: z.custom<typeof properties.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/properties/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  leads: {
    list: {
      method: 'GET' as const,
      path: '/api/leads',
      input: z.object({
        status: z.string().optional(),
        assignedTo: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof leads.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/leads',
      input: insertLeadSchema,
      responses: {
        201: z.custom<typeof leads.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/leads/:id',
      input: insertLeadSchema.partial(),
      responses: {
        200: z.custom<typeof leads.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  profile: {
    get: {
      method: 'GET' as const,
      path: '/api/profile/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profile/me',
      input: z.object({
        role: z.enum(["admin", "agent"]).optional(),
        phoneNumber: z.string().optional(),
        agencyName: z.string().optional(),
        licenseNumber: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
