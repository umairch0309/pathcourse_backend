import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { AGORA_ROUTES } from '~/routes/agora/agora.routes'
import { AGORA_SERVICES } from '~/services/agora'
import type { HandlerMapFromRoutes } from '~/types'

export const AGORA_ROUTES_HANDLER: HandlerMapFromRoutes<typeof AGORA_ROUTES> = {
  /**
   * Generate or retrieve Agora token for appointment
   */
  getToken: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { appointmentId } = c.req.valid('param')

    try {
      // Get user role from session
      const userRole = user.role as 'doctor' | 'patient'

      // Generate or retrieve token using appointmentId and user info from session
      const tokenResult = await AGORA_SERVICES.generateToken({
        appointmentId,
        userId: user.id,
        userRole,
      })

      return c.json(
        {
          message: tokenResult.isExisting
            ? 'Existing token retrieved'
            : 'New token generated successfully',
          token: tokenResult.token,
          channel: tokenResult.channel,
          uid: tokenResult.uid,
          appId: tokenResult.appId,
          expiry: tokenResult.expiry.toISOString(),
          isExisting: tokenResult.isExisting,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (errorMessage.includes('Appointment not found')) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }

      if (errorMessage.includes('Unauthorized')) {
        throw new HttpError(errorMessage, HttpStatusCodes.FORBIDDEN)
      }

      if (
        errorMessage.includes('Token can only be generated') ||
        errorMessage.includes('access window')
      ) {
        throw new HttpError(errorMessage, HttpStatusCodes.BAD_REQUEST)
      }

      console.error('Agora service error:', error)
      throw new HttpError('Failed to generate token', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  /**
   * Validate appointment access window
   */
  validateAccess: async c => {
    const { appointmentId } = c.req.valid('param')

    try {
      const accessValidation = await AGORA_SERVICES.validateAppointmentAccess(appointmentId)

      const responseData = {
        message: accessValidation.message || 'Validation completed',
        isValid: accessValidation.isValid,
        canAccess: accessValidation.canAccess,
        appointment: accessValidation.appointment
          ? {
              startTime: accessValidation.appointment.startTime.toISOString(),
              endTime: accessValidation.appointment.endTime.toISOString(),
              earliestAccess: accessValidation.appointment.earliestAccess.toISOString(),
              latestAccess: accessValidation.appointment.latestAccess.toISOString(),
            }
          : undefined,
      }

      return c.json(responseData, HttpStatusCodes.OK)
    } catch (error) {
      console.error('Agora access validation error:', error)
      throw new HttpError('Failed to validate access', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  /**
   * Get token usage statistics
   */
  getTokenStats: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { appointmentId } = c.req.valid('param')

    try {
      // Get token statistics (service will validate user access)
      const tokenStats = await AGORA_SERVICES.getTokenStats(appointmentId)

      if (!tokenStats) {
        throw new HttpError('No token found for appointment', HttpStatusCodes.NOT_FOUND)
      }

      const responseData = {
        message: 'Token statistics retrieved successfully',
        id: tokenStats.id,
        channel: tokenStats.channel,
        doctorToken: tokenStats.doctorToken,
        patientToken: tokenStats.patientToken,
        doctorUid: tokenStats.doctorUid,
        patientUid: tokenStats.patientUid,
        expiry: tokenStats.expiry.toISOString(),
        patientJoined: tokenStats.patientJoined?.toISOString() || null,
        doctorJoined: tokenStats.doctorJoined?.toISOString() || null,
        patientEnded: tokenStats.patientEnded?.toISOString() || null,
        doctorEnded: tokenStats.doctorEnded?.toISOString() || null,
        joinedFirst: tokenStats.joinedFirst,
        createdAt: tokenStats.createdAt.toISOString(),
      }

      return c.json(responseData, HttpStatusCodes.OK)
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }

      console.error('Agora token stats error:', error)
      throw new HttpError(
        'Failed to retrieve token statistics',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}
