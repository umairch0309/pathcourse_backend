import { RtcRole, RtcTokenBuilder } from 'agora-token'
import prisma from '~/lib/prisma'

// Types for Agora token management
export interface CreateTokenParams {
  appointmentId: string
  userId: string
  userRole: 'doctor' | 'patient'
}

export interface TokenResult {
  token: string
  channel: string
  uid: number
  appId: string
  expiry: Date
  isExisting: boolean
}

export interface AgoraTokenData {
  appointmentId: string
  channel: string
  doctorToken?: string
  patientToken?: string
  doctorUid?: number
  patientUid?: number
  expiry: Date
}

export const AGORA_SERVICES = {
  /**
   * Generate role-specific UID for Agora
   * Doctor: starts with 1, Patient: starts with 2
   */
  generateRoleBasedUid(appointmentId: string, userRole: 'doctor' | 'patient'): number {
    // Create a hash from appointment ID to ensure consistency
    const appointmentHash = appointmentId.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xfffffff
    }, 0)

    // Use different prefixes for doctor (1) and patient (2)
    const rolePrefix = userRole === 'doctor' ? 1 : 2

    // Combine role prefix with appointment hash to create unique UID
    // Ensure UID is within valid range (0 to 2^32-1)
    const uid = parseInt(`${rolePrefix}${Math.abs(appointmentHash).toString().slice(-8)}`, 10)

    return uid > 0 ? uid : Math.abs(uid) + 1000000
  },
  /**
   * Generate or retrieve existing Agora token for appointment
   */
  async generateToken(params: CreateTokenParams): Promise<TokenResult> {
    const { appointmentId, userId, userRole } = params

    // First, verify the appointment exists and get time details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
      },
    })

    if (!appointment) {
      throw new Error('Appointment not found')
    }

    if (!appointment.scheduledAt) {
      throw new Error('Appointment has no scheduled time')
    }

    // Verify user is part of this appointment
    if (userRole === 'doctor' && appointment.doctorId !== userId) {
      throw new Error('Unauthorized: User is not the doctor for this appointment')
    }

    if (userRole === 'patient' && appointment.patientId !== userId) {
      throw new Error('Unauthorized: User is not the patient for this appointment')
    }

    const now = new Date()
    const appointmentStartTime = new Date(appointment.scheduledAt)
    // Appointments are booked for 15 minutes from scheduledAt
    const appointmentEndTime = new Date(appointmentStartTime.getTime() + 15 * 60 * 1000)

    // Calculate access window: 30 minutes before start to 30 minutes after end
    const earliestAccess = new Date(appointmentStartTime.getTime() - 30 * 60 * 1000) // 30 minutes before
    const latestAccess = new Date(appointmentEndTime.getTime() + 30 * 60 * 1000) // 30 minutes after end

    // Check if current time is within access window
    if (now < earliestAccess) {
      const minutesUntilAccess = Math.ceil((earliestAccess.getTime() - now.getTime()) / (1000 * 60))
      throw new Error(
        `Token can only be generated ${minutesUntilAccess} minutes before the appointment starts`
      )
    }

    if (now > latestAccess) {
      throw new Error('The appointment access window has expired')
    }

    // Generate role-specific UID
    const uid = this.generateRoleBasedUid(appointmentId, userRole)

    // Check for existing valid token
    const existingTokenRecord = await this.findValidToken(appointmentId, now)

    if (existingTokenRecord) {
      // Check if token exists for this specific role
      const existingToken =
        userRole === 'doctor' ? existingTokenRecord.doctorToken : existingTokenRecord.patientToken

      if (existingToken) {
        return {
          token: existingToken,
          channel: existingTokenRecord.channel,
          uid,
          appId: Bun.env.AGORA_APP_ID || '',
          expiry: existingTokenRecord.expiry,
          isExisting: true,
        }
      }
    }

    // Generate new token
    const channelName = appointmentId
    const agoraRole = RtcRole.PUBLISHER // Both doctor and patient can publish

    // Token expires at the end of access window
    const tokenExpireTime = Math.floor(latestAccess.getTime() / 1000)

    const token = RtcTokenBuilder.buildTokenWithUid(
      Bun.env.AGORA_APP_ID || '',
      Bun.env.AGORA_CERTIFICATE_ID || '',
      channelName,
      uid,
      agoraRole,
      tokenExpireTime,
      tokenExpireTime
    )

    // Save or update token in database
    await this.saveToken({
      appointmentId,
      channel: channelName,
      [userRole === 'doctor' ? 'doctorToken' : 'patientToken']: token,
      [userRole === 'doctor' ? 'doctorUid' : 'patientUid']: uid,
      expiry: latestAccess,
    })

    return {
      token,
      channel: channelName,
      uid,
      appId: Bun.env.AGORA_APP_ID || '',
      expiry: latestAccess,
      isExisting: false,
    }
  },

  /**
   * Find existing valid token for appointment
   */
  async findValidToken(appointmentId: string, currentTime: Date) {
    return await prisma.agoraToken.findFirst({
      where: {
        appointmentId,
        expiry: {
          gt: currentTime,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  /**
   * Save or update token to database
   */
  async saveToken(data: AgoraTokenData) {
    const existingRecord = await prisma.agoraToken.findFirst({
      where: { appointmentId: data.appointmentId },
    })

    if (existingRecord) {
      // Update existing record with new token data
      return await prisma.agoraToken.update({
        where: { id: existingRecord.id },
        data: {
          doctorToken: data.doctorToken ?? existingRecord.doctorToken,
          patientToken: data.patientToken ?? existingRecord.patientToken,
          doctorUid: data.doctorUid ?? existingRecord.doctorUid,
          patientUid: data.patientUid ?? existingRecord.patientUid,
          expiry: data.expiry,
        },
      })
    } else {
      // Create new record
      return await prisma.agoraToken.create({
        data: {
          appointmentId: data.appointmentId,
          channel: data.channel,
          doctorToken: data.doctorToken,
          patientToken: data.patientToken,
          doctorUid: data.doctorUid,
          patientUid: data.patientUid,
          expiry: data.expiry,
          joinedFirst: '', // Will be updated when someone joins
        },
      })
    }
  },

  /**
   * Update token join status
   */
  async updateJoinStatus(
    appointmentId: string,
    _userId: string,
    userRole: 'doctor' | 'patient',
    action: 'joined' | 'ended'
  ) {
    const now = new Date()
    const updateData: Record<string, Date | string> = {}

    if (action === 'joined') {
      if (userRole === 'doctor') {
        updateData.doctorJoined = now
      } else {
        updateData.patientJoined = now
      }
    } else if (action === 'ended') {
      if (userRole === 'doctor') {
        updateData.doctorEnded = now
      } else {
        updateData.patientEnded = now
      }
    }

    // Find the most recent token for this appointment
    const token = await prisma.agoraToken.findFirst({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    })

    if (!token) {
      throw new Error('No token found for appointment')
    }

    // Update joinedFirst if this is the first person to join
    if (action === 'joined' && !token.doctorJoined && !token.patientJoined) {
      updateData.joinedFirst = userRole
    }

    return await prisma.agoraToken.update({
      where: { id: token.id },
      data: updateData,
    })
  },

  /**
   * Get token statistics for appointment
   */
  async getTokenStats(appointmentId: string) {
    return await prisma.agoraToken.findFirst({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        channel: true,
        doctorToken: true,
        patientToken: true,
        doctorUid: true,
        patientUid: true,
        expiry: true,
        patientJoined: true,
        doctorJoined: true,
        patientEnded: true,
        doctorEnded: true,
        joinedFirst: true,
        createdAt: true,
      },
    })
  },

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens() {
    const now = new Date()
    return await prisma.agoraToken.deleteMany({
      where: {
        expiry: {
          lt: now,
        },
      },
    })
  },

  /**
   * Validate appointment access window
   */
  async validateAppointmentAccess(appointmentId: string): Promise<{
    isValid: boolean
    canAccess: boolean
    appointment?: {
      startTime: Date
      endTime: Date
      earliestAccess: Date
      latestAccess: Date
    }
    message?: string
  }> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment || !appointment.scheduledAt) {
      return {
        isValid: false,
        canAccess: false,
        message: 'Appointment not found or has no scheduled time',
      }
    }

    const now = new Date()
    const startTime = new Date(appointment.scheduledAt)
    // Appointments are booked for 15 minutes from scheduledAt
    const endTime = new Date(startTime.getTime() + 15 * 60 * 1000)
    const earliestAccess = new Date(startTime.getTime() - 30 * 60 * 1000)
    const latestAccess = new Date(endTime.getTime() + 30 * 60 * 1000)

    const canAccess = now >= earliestAccess && now <= latestAccess
    let message = ''

    if (now < earliestAccess) {
      const minutesUntil = Math.ceil((earliestAccess.getTime() - now.getTime()) / (1000 * 60))
      message = `Access available in ${minutesUntil} minutes`
    } else if (now > latestAccess) {
      message = 'Access window has expired'
    } else {
      message = 'Access granted'
    }

    return {
      isValid: true,
      canAccess,
      appointment: {
        startTime,
        endTime,
        earliestAccess,
        latestAccess,
      },
      message,
    }
  },
}
