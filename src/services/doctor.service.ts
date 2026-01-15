import { doctorConnectionTracker } from '~/lib/doctor-connection-tracker'
import prisma from '~/lib/prisma'
import { keysToSignedUrls } from '~/lib/s3'

// Helper function to extract S3 key from file URL or return the key if it's already a key
const extractS3KeyFromUrl = (fileUrlOrKey: string | null): string | null => {
  if (!fileUrlOrKey) {
    return null
  }
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

// Helper function to convert document URLs to signed URLs
const convertDocumentsToSignedUrls = async (
  documents: {
    id: string
    resume: string | null
    medicalLicense: string | null
    introductionVideo: string | null
  } | null
) => {
  if (!documents) {
    return null
  }

  const keys = [
    extractS3KeyFromUrl(documents.resume),
    extractS3KeyFromUrl(documents.medicalLicense),
    extractS3KeyFromUrl(documents.introductionVideo),
  ].filter((key): key is string => key !== null)

  if (keys.length === 0) {
    return {
      id: documents.id,
      resume: documents.resume,
      medicalLicense: documents.medicalLicense,
      introductionVideo: documents.introductionVideo,
    }
  }

  const signedUrls = await keysToSignedUrls(keys, 7 * 24 * 3600) // 7 days
  const signedUrlsArray = Array.isArray(signedUrls) ? signedUrls : [signedUrls]

  let urlIndex = 0
  return {
    id: documents.id,
    resume: documents.resume ? signedUrlsArray[urlIndex++] || documents.resume : documents.resume,
    medicalLicense: documents.medicalLicense
      ? signedUrlsArray[urlIndex++] || documents.medicalLicense
      : documents.medicalLicense,
    introductionVideo: documents.introductionVideo
      ? signedUrlsArray[urlIndex++] || documents.introductionVideo
      : documents.introductionVideo,
  }
}

// Helper function to convert education document URL to signed URL
const convertEducationDocumentToSignedUrl = async (documentUrl: string | null) => {
  if (!documentUrl) {
    return null
  }
  const key = extractS3KeyFromUrl(documentUrl)
  if (!key) {
    return null
  }
  return keysToSignedUrls(key, 7 * 24 * 3600) // 7 days
}

// Helper function to convert user image key to signed URL
const convertUserImageToSignedUrl = async (
  imageKeyOrUrl: string | null
): Promise<string | null> => {
  if (!imageKeyOrUrl) {
    return null
  }
  // If it's already a URL starting with https, return as is
  if (imageKeyOrUrl.startsWith('http://') || imageKeyOrUrl.startsWith('https://')) {
    return imageKeyOrUrl
  }
  // Otherwise, treat it as a key and convert to signed URL
  const key = extractS3KeyFromUrl(imageKeyOrUrl)
  if (!key) {
    return imageKeyOrUrl
  }
  const signedUrl = await keysToSignedUrls(key, 7 * 24 * 3600) // 7 days
  return Array.isArray(signedUrl) ? signedUrl[0] : signedUrl
}

export const DOCTOR_SERVICES = {
  createOrUpdate: async (data: {
    userId: string
    professional_contact: string
    professional_email: string
    image?: string | null
    // Optional user info fields
    gender?: string | null
    dateOfBirth?: Date | null
    phone?: string | null
    address?: string | null
  }) => {
    // Check if user exists and is a doctor
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'doctor') {
      throw new Error('User is not a doctor')
    }

    // Update user image if provided
    if (data.image !== undefined) {
      await prisma.user.update({
        where: { id: data.userId },
        data: { image: data.image },
      })
    }

    // Create or update user info if any user info fields are provided
    if (
      data.gender !== undefined ||
      data.dateOfBirth !== undefined ||
      data.phone !== undefined ||
      data.address !== undefined
    ) {
      await prisma.userInfo.upsert({
        where: { userId: data.userId },
        update: {
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
          address: data.address,
        },
        create: {
          userId: data.userId,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
          address: data.address,
        },
      })
    }

    // Create or update doctor record
    const doctor = await prisma.doctor.upsert({
      where: { userid: data.userId },
      update: {
        professional_contact: data.professional_contact,
        professional_email: data.professional_email,
      },
      create: {
        userid: data.userId,
        professional_contact: data.professional_contact,
        professional_email: data.professional_email,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    })

    // Convert user image to signed URL
    const userImage = await convertUserImageToSignedUrl(doctor.user.image)

    return {
      ...doctor,
      user: {
        ...doctor.user,
        image: userImage,
      },
    }
  },

  getByUserId: async (userId: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { userid: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        documents: true,
        education: true,
      },
    })

    if (!doctor) {
      return null
    }

    // Convert document URLs to signed URLs
    const documents = await convertDocumentsToSignedUrls(doctor.documents)
    const education = await Promise.all(
      doctor.education.map(async edu => ({
        ...edu,
        document: await convertEducationDocumentToSignedUrl(edu.document),
      }))
    )

    return {
      ...doctor,
      documents,
      education,
    }
  },

  getById: async (id: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            onboardingStage: true,
          },
        },
        documents: true,
        education: true,
        professionalExperience: true,
      },
    })

    if (!doctor) {
      return null
    }

    // Convert document URLs and user image to signed URLs
    const documents = await convertDocumentsToSignedUrls(doctor.documents)
    const education = await Promise.all(
      doctor.education.map(async edu => ({
        ...edu,
        document: await convertEducationDocumentToSignedUrl(edu.document),
      }))
    )
    const userImage = await convertUserImageToSignedUrl(doctor.user.image)

    return {
      ...doctor,
      user: {
        ...doctor.user,
        image: userImage,
      },
      documents,
      education,
    }
  },

  getPendingDoctors: async (filters?: { page?: number; limit?: number; search?: string }) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where = {
      user: {
        role: 'doctor',
        onboardingStage: {
          in: ['WAITING_FOR_ADMIN'],
        },
      },
      ...(filters?.search && {
        OR: [
          { professional_email: { contains: filters.search, mode: 'insensitive' as const } },
          { user: { name: { contains: filters.search, mode: 'insensitive' as const } } },
          { user: { email: { contains: filters.search, mode: 'insensitive' as const } } },
        ],
      }),
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              onboardingStage: true,
              createdAt: true,
            },
          },
          documents: true,
          education: true,
          professionalExperience: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.doctor.count({ where }),
    ])

    // Convert document URLs and user images to signed URLs for all doctors
    const doctorsWithSignedUrls = await Promise.all(
      doctors.map(async doctor => ({
        ...doctor,
        user: {
          ...doctor.user,
          image: await convertUserImageToSignedUrl(doctor.user.image),
        },
        documents: await convertDocumentsToSignedUrls(doctor.documents),
        education: await Promise.all(
          doctor.education.map(async edu => ({
            ...edu,
            document: await convertEducationDocumentToSignedUrl(edu.document),
          }))
        ),
      }))
    )

    return {
      doctors: doctorsWithSignedUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  approveDoctor: async (doctorId: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Update user onboarding stage to COMPLETED
    await prisma.user.update({
      where: { id: doctor.userid },
      data: {
        onboardingStage: 'COMPLETED',
      },
    })

    // Clear reject reason if exists
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        rejectReason: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            onboardingStage: true,
          },
        },
      },
    })

    // Convert user image to signed URL
    const userImage = await convertUserImageToSignedUrl(updatedDoctor.user.image)

    return {
      ...updatedDoctor,
      user: {
        ...updatedDoctor.user,
        image: userImage,
      },
    }
  },

  rejectDoctor: async (doctorId: string, rejectReason: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Update user onboarding stage to REJECTED
    await prisma.user.update({
      where: { id: doctor.userid },
      data: {
        onboardingStage: 'REJECTED',
      },
    })

    // Save reject reason
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        rejectReason,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            onboardingStage: true,
          },
        },
      },
    })

    // Convert user image to signed URL
    const userImage = await convertUserImageToSignedUrl(updatedDoctor.user.image)

    return {
      ...updatedDoctor,
      user: {
        ...updatedDoctor.user,
        image: userImage,
      },
    }
  },

  toggleAvailability: async (userId: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { userid: userId },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    const newAvailabilityStatus = !doctor.isAvailable

    const updatedDoctor = await prisma.doctor.update({
      where: { userid: userId },
      data: {
        isAvailable: newAvailabilityStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            onboardingStage: true,
          },
        },
      },
    })

    // Register connection in tracker when doctor becomes available
    // This ensures connection tracking starts immediately
    if (newAvailabilityStatus) {
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      doctorConnectionTracker.registerConnection(userId, connectionId)
      console.log(`Doctor ${userId} availability toggled ON - connection registered with ID: ${connectionId}`)
    } else {
      // Remove connection when doctor becomes unavailable
      doctorConnectionTracker.removeConnection(userId)
      console.log(`Doctor ${userId} availability toggled OFF - connection removed`)
    }

    // Convert user image to signed URL
    const userImage = await convertUserImageToSignedUrl(updatedDoctor.user.image)

    return {
      ...updatedDoctor,
      user: {
        ...updatedDoctor.user,
        image: userImage,
      },
    }
  },

  getAvailableDoctors: async (filters?: { page?: number; limit?: number; search?: string }) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where = {
      isAvailable: true,
      user: {
        role: 'doctor',
        onboardingStage: 'COMPLETED', // Only show approved doctors
      },
      ...(filters?.search && {
        OR: [
          { professional_email: { contains: filters.search, mode: 'insensitive' as const } },
          { user: { name: { contains: filters.search, mode: 'insensitive' as const } } },
        ],
      }),
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              onboardingStage: true,
            },
          },
          documents: true,
          education: true,
          professionalExperience: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.doctor.count({ where }),
    ])

    // Convert document URLs and user images to signed URLs for all doctors
    const doctorsWithSignedUrls = await Promise.all(
      doctors.map(async doctor => ({
        ...doctor,
        user: {
          ...doctor.user,
          image: await convertUserImageToSignedUrl(doctor.user.image),
        },
        documents: await convertDocumentsToSignedUrls(doctor.documents),
        education: await Promise.all(
          doctor.education.map(async edu => ({
            ...edu,
            document: await convertEducationDocumentToSignedUrl(edu.document),
          }))
        ),
      }))
    )

    return {
      doctors: doctorsWithSignedUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  updateMeetingStatus: async (userId: string, isInMeeting: boolean) => {
    const doctor = await prisma.doctor.findUnique({
      where: { userid: userId },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // When doctor enters a meeting, automatically set isAvailable to false
    // When doctor exits a meeting, keep isAvailable as false (they need to manually toggle it back on)
    const updatedDoctor = await prisma.doctor.update({
      where: { userid: userId },
      data: {
        isInMeeting,
        // If entering meeting, set unavailable. If exiting, keep current availability state
        isAvailable: isInMeeting ? false : doctor.isAvailable,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            onboardingStage: true,
          },
        },
      },
    })

    // Convert user image to signed URL
    const userImage = await convertUserImageToSignedUrl(updatedDoctor.user.image)

    return {
      ...updatedDoctor,
      user: {
        ...updatedDoctor.user,
        image: userImage,
      },
    }
  },

  registerConnection: async (userId: string, connectionId: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { userid: userId },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Update last seen timestamp in a connection tracking table
    // For now, we'll use a simple approach with UserSession or create a DoctorConnection model
    // Since we don't have DoctorConnection, we'll track it in memory or use UserSession
    // For simplicity, we'll just update the doctor's last activity
    // In production, you'd want a proper connection tracking system

    return {
      connectionId,
      timestamp: new Date(),
    }
  },

  updateConnectionHeartbeat: async (userId: string, connectionId?: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { userid: userId },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Always update heartbeat FIRST - this will create connection if it doesn't exist
    // or update the existing one with fresh timestamp
    doctorConnectionTracker.updateHeartbeat(userId, connectionId)

    // CRITICAL: If heartbeats are coming in, the doctor is clearly online
    // If they were marked as unavailable due to a stale connection check,
    // we MUST restore their availability immediately
    // This is the key fix - heartbeats = doctor is online = should be available if they want to be

    // Get fresh doctor data to check current status
    const currentDoctor = await prisma.doctor.findUnique({
      where: { userid: userId },
      select: { isAvailable: true, isInMeeting: true },
    })

    if (!currentDoctor) {
      throw new Error('Doctor not found')
    }

    // If doctor is sending heartbeats but marked as unavailable (and not in meeting),
    // restore availability immediately
    // This handles the case where stale checker incorrectly marked them as unavailable
    if (!currentDoctor.isAvailable && !currentDoctor.isInMeeting) {
      // Doctor is sending heartbeats but marked unavailable - restore availability
      await prisma.doctor.update({
        where: { userid: userId },
        data: {
          isAvailable: true,
        },
      })
      console.log(`Doctor ${userId} availability restored via heartbeat - was incorrectly marked unavailable`)
    }

    // Sync availability with meeting status (ensure isAvailable is false if in meeting)
    await DOCTOR_SERVICES.syncAvailabilityWithMeetingStatus(userId)

    return {
      timestamp: new Date(),
    }
  },

  handleDisconnection: async (userId: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { userid: userId },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // CRITICAL: Triple-check that the connection is actually stale before marking as unavailable
    // This prevents race conditions where heartbeats arrive right after stale detection
    const isActuallyStale = !doctorConnectionTracker.isConnected(userId)

    if (!isActuallyStale) {
      // Connection is not actually stale - heartbeat must have arrived
      // Don't mark as unavailable
      console.log(`Doctor ${userId} connection restored - not marking as unavailable`)
      return {
        isAvailable: doctor.isAvailable,
        isInMeeting: doctor.isInMeeting,
      }
    }

    // IMPORTANT: Only mark as unavailable if doctor's isAvailable is currently true
    // If it's already false, don't do anything (might have been toggled off manually)
    // This prevents the stale checker from overriding manual toggles
    if (!doctor.isAvailable) {
      console.log(`Doctor ${userId} is already unavailable - skipping disconnection handling`)
      // Remove from tracker but don't change availability
      doctorConnectionTracker.removeConnection(userId)
      return {
        isAvailable: false,
        isInMeeting: doctor.isInMeeting,
      }
    }

    // Final check: Verify connection is still stale one more time
    // This is the last chance to catch a heartbeat that arrived during processing
    const finalCheck = !doctorConnectionTracker.isConnected(userId)
    if (!finalCheck) {
      console.log(`Doctor ${userId} connection restored during disconnection handling - aborting`)
      return {
        isAvailable: doctor.isAvailable,
        isInMeeting: doctor.isInMeeting,
      }
    }

    // Remove from connection tracker
    doctorConnectionTracker.removeConnection(userId)

    // When doctor disconnects, set isAvailable to false
    // Only if they're not in a meeting (if in meeting, isAvailable is already false)
    if (!doctor.isInMeeting) {
      await prisma.doctor.update({
        where: { userid: userId },
        data: {
          isAvailable: false,
        },
      })
      console.log(`Doctor ${userId} marked as unavailable due to stale connection (no heartbeat for 40+ seconds)`)
    }

    return {
      isAvailable: false,
      isInMeeting: doctor.isInMeeting,
    }
  },

  // Method to automatically sync availability with meeting status
  syncAvailabilityWithMeetingStatus: async (userId: string) => {
    const doctor = await prisma.doctor.findUnique({
      where: { userid: userId },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // If doctor is in meeting, ensure isAvailable is false
    if (doctor.isInMeeting && doctor.isAvailable) {
      await prisma.doctor.update({
        where: { userid: userId },
        data: {
          isAvailable: false,
        },
      })
      return { updated: true, isAvailable: false }
    }

    return { updated: false, isAvailable: doctor.isAvailable }
  },
}
