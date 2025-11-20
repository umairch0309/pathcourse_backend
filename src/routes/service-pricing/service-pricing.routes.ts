import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

const servicePricingResponseSchema = z
  .object({
    id: z.string(),
    serviceId: z.string(),
    service: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .optional(),
    duration: z.number().int(),
    userPrice: z.number(),
    doctorAmount: z.number(),
    platformAmount: z.number(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .describe('Service pricing information')

const createServicePricingBodySchema = z
  .object({
    serviceId: z.string().describe('Service ID'),
    duration: z.number().int().min(1).describe('Duration in minutes (15, 30, 45, or 60)'),
    userPrice: z.number().positive().describe('Total price paid by user'),
    doctorAmount: z.number().positive().describe('Amount received by doctor'),
    platformAmount: z.number().positive().describe('Amount kept by platform'),
  })
  .describe('Request body for creating service pricing')
  .refine(
    data => Math.abs(data.doctorAmount + data.platformAmount - data.userPrice) < 0.01,
    {
      message: 'Doctor amount + Platform amount must equal user price',
      path: ['userPrice'],
    }
  )

const updateServicePricingBodySchema = z
  .object({
    userPrice: z.number().positive().optional().describe('Total price paid by user'),
    doctorAmount: z.number().positive().optional().describe('Amount received by doctor'),
    platformAmount: z.number().positive().optional().describe('Amount kept by platform'),
    isActive: z.boolean().optional().describe('Whether this pricing is active'),
  })
  .describe('Request body for updating service pricing')

const servicePricingListResponseSchema = z
  .object({
    pricing: z.array(servicePricingResponseSchema),
  })
  .describe('List of service pricing options')

export const SERVICE_PRICING_ROUTES = {
  getAll: createRoute({
    path: '/service-pricing',
    method: 'get',
    tags: [TAGS.servicePricing],
    summary: 'Get all active service pricing options',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(servicePricingListResponseSchema),
        'Service pricing retrieved successfully'
      ),
    },
  }),

  getByDuration: createRoute({
    path: '/service-pricing/duration/{duration}',
    method: 'get',
    tags: [TAGS.servicePricing],
    summary: 'Get service pricing by duration',
    request: {
      params: z.object({
        duration: z.string().describe('Duration in minutes'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(servicePricingResponseSchema),
        'Service pricing retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Service pricing not found'),
    },
  }),

  create: createRoute({
    path: '/service-pricing',
    method: 'post',
    tags: [TAGS.servicePricing],
    summary: 'Create new service pricing (Admin only)',
    request: {
      body: jsonContentRequired(createServicePricingBodySchema, 'Request body for creating service pricing'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(servicePricingResponseSchema),
        'Service pricing created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createServicePricingBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.CONFLICT]: jsonContent(zodResponseSchema(), 'Service pricing for this duration already exists'),
    },
  }),

  update: createRoute({
    path: '/service-pricing/{id}',
    method: 'put',
    tags: [TAGS.servicePricing],
    summary: 'Update service pricing by ID (Admin only)',
    request: {
      params: z.object({
        id: z.string().describe('Service pricing ID'),
      }),
      body: jsonContentRequired(updateServicePricingBodySchema, 'Request body for updating service pricing'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(servicePricingResponseSchema),
        'Service pricing updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateServicePricingBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Service pricing not found'),
    },
  }),

  updateByDuration: createRoute({
    path: '/service-pricing/duration/{duration}',
    method: 'put',
    tags: [TAGS.servicePricing],
    summary: 'Update service pricing by duration (Admin only)',
    request: {
      params: z.object({
        duration: z.string().describe('Duration in minutes'),
      }),
      query: z.object({
        serviceId: z.string().optional().describe('Service ID (optional, defaults to Open Ear service)'),
      }),
      body: jsonContentRequired(updateServicePricingBodySchema, 'Request body for updating service pricing'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(servicePricingResponseSchema),
        'Service pricing updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateServicePricingBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Service pricing not found'),
    },
  }),

  delete: createRoute({
    path: '/service-pricing/{id}',
    method: 'delete',
    tags: [TAGS.servicePricing],
    summary: 'Delete service pricing by ID (Admin only - soft delete)',
    request: {
      params: z.object({
        id: z.string().describe('Service pricing ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(zodResponseSchema(), 'Service pricing deleted successfully'),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Service pricing not found'),
    },
  }),
}

