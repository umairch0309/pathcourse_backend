import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

const generateUploadUrlBodySchema = z
  .object({
    fileName: z.string().min(1).describe('Name of the file to upload'),
    fileType: z
      .string()
      .min(1)
      .describe('MIME type of the file (e.g., image/jpeg, application/pdf)'),
    directory: z.string().optional().describe('Optional directory to upload the file to'),
  })
  .describe('Request body for generating upload URL')

const deleteFilesBodySchema = z
  .object({
    fileUrls: z
      .array(z.string().min(1))
      .min(1)
      .describe('Array of file URLs or S3 keys to delete from S3'),
  })
  .describe('Request body for deleting files')

const getSignedUrlBodySchema = z
  .object({
    key: z.string().min(1).describe('S3 key or URL of the file'),
    expiresIn: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Expiry time in seconds (default: 3600)'),
  })
  .describe('Request body for getting signed URL')

const uploadUrlResponseSchema = z
  .object({
    uploadUrl: z.string().url().describe('Pre-signed URL for uploading the file'),
    key: z.string().describe('S3 key for the uploaded file'),
    fileUrl: z.string().url().describe('Pre-signed URL for downloading/viewing the file'),
    expiresAt: z.string().describe('ISO timestamp when the download URL expires'),
  })
  .describe('Response containing upload URL and download URL information')

const deleteFilesResponseSchema = z
  .object({
    message: z.string().describe('Success message'),
    deletedFiles: z.array(z.string()).describe('Array of successfully deleted file keys'),
  })
  .describe('Response containing deletion results')

const signedUrlResponseSchema = z
  .object({
    signedUrl: z.string().url().describe('Pre-signed URL for downloading/viewing the file'),
    expiresIn: z.number().describe('Expiry time in seconds'),
    expiresAt: z.string().describe('ISO timestamp when the URL expires'),
  })
  .describe('Response containing signed URL information')

export const FILES_ROUTES = {
  generateUploadUrl: createRoute({
    method: 'post',
    path: '/upload-url',
    tags: [TAGS.files],
    middleware: [isAuthenticated],
    request: {
      body: jsonContentRequired(
        generateUploadUrlBodySchema,
        'Request body for generating upload URL'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(uploadUrlResponseSchema),
        'Upload URL generated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(generateUploadUrlBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        zodResponseSchema(),
        'Internal Server Error'
      ),
    },
  }),
  deleteFiles: createRoute({
    method: 'post',
    path: '/delete',
    tags: [TAGS.files],
    middleware: [isAuthenticated],
    request: {
      body: jsonContentRequired(deleteFilesBodySchema, 'Request body for deleting files'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(deleteFilesResponseSchema, 'Files deleted successfully'),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(deleteFilesBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        zodResponseSchema(),
        'Internal Server Error'
      ),
    },
  }),
  getSignedUrl: createRoute({
    method: 'post',
    path: '/signed-url',
    tags: [TAGS.files],
    middleware: [isAuthenticated],
    request: {
      body: jsonContentRequired(getSignedUrlBodySchema, 'Request body for getting signed URL'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        signedUrlResponseSchema,
        'Signed URL generated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(getSignedUrlBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        zodResponseSchema(),
        'Internal Server Error'
      ),
    },
  }),
}
