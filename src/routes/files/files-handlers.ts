import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import { deleteObjectsFromS3, generateDownloadUrl, generateUploadUrl } from '~/lib/s3'
import type { FILES_ROUTES } from '~/routes/files/files-routes'
import type { HandlerMapFromRoutes } from '~/types'

// Helper function to extract S3 key from file URL or return the key if it's already a key
const extractS3KeyFromUrl = (fileUrlOrKey: string): string => {
  try {
    // Try to parse as URL
    const url = new URL(fileUrlOrKey)
    // Remove leading slash from pathname to get the key
    return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
  } catch {
    // If URL parsing fails, assume it's already a key
    return fileUrlOrKey
  }
}

export const FILES_ROUTES_HANDLER: HandlerMapFromRoutes<typeof FILES_ROUTES> = {
  generateUploadUrl: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }
    const role = user.role
    const name = user.name

    const { fileName, fileType } = c.req.valid('json')

    try {
      // Sanitize file name
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const extension = fileType.split('/')[1] || 'bin'
      const uniqueKey = `${sanitizedFileName}-${Date.now()}.${extension}`
      const key = `${role}/${name}/${uniqueKey}`

      // Generate upload URL
      const uploadUrl = await generateUploadUrl(key, 3600) // 1 hour expiry

      // Generate signed download URL for immediate access
      const downloadExpiryTime = 7 * 24 * 3600 // 7 days
      const fileUrl = await generateDownloadUrl(key, downloadExpiryTime)
      const expiresAt = new Date(Date.now() + downloadExpiryTime * 1000).toISOString()

      return c.json(
        {
          message: 'Upload URL generated successfully',
          data: {
            uploadUrl,
            key,
            fileUrl,
            expiresAt,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error generating upload URL:', error)
      throw new HttpError('Failed to generate upload URL', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },
  deleteFiles: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const fileUrls = c.req.valid('json').fileUrls

    try {
      // Extract S3 keys from file URLs or use keys directly
      const keysToDelete: string[] = fileUrls.map(fileUrlOrKey => extractS3KeyFromUrl(fileUrlOrKey))

      if (keysToDelete.length === 0) {
        throw new HttpError('No valid file URLs or keys provided', HttpStatusCodes.BAD_REQUEST)
      }

      // Delete files from S3
      await deleteObjectsFromS3(keysToDelete)

      return c.json(
        {
          message: `Successfully deleted ${keysToDelete.length} file(s)`,
          deletedFiles: keysToDelete,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error deleting files:', error)
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError('Failed to delete files', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },
  getSignedUrl: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { key, expiresIn } = c.req.valid('json')

    try {
      // Extract S3 key from URL or use key directly
      const s3Key = extractS3KeyFromUrl(key)

      // Default expiry is 1 hour (3600 seconds)
      const expirySeconds = expiresIn || 3600

      // Generate signed download URL
      const signedUrl = await generateDownloadUrl(s3Key, expirySeconds)
      const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString()

      return c.json(
        {
          signedUrl,
          expiresIn: expirySeconds,
          expiresAt,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error generating signed URL:', error)
      throw new HttpError('Failed to generate signed URL', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },
}
