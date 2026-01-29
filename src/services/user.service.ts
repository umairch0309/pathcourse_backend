import prisma from '~/lib/prisma'
import { extractS3KeyFromUrl, keysToSignedUrls } from '~/lib/s3'

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

export const USER_SERVICES = {
  updateRole: async (data: { userId: string; role: string }) => {
    const user = await prisma.user.update({
      where: { id: data.userId },
      data: {
        role: data.role,
        onboardingStage: 'USER_INFO',
      },
    })
    return user
  },

  createOrUpdateUserInfo: async (data: {
    userId: string
    gender?: string | null
    dateOfBirth?: Date | null
    phone?: string | null
    address?: string | null
  }) => {
    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true },
    })

    if (!user) {
      throw new Error('User not found')
    }
    // Create or update user info first
    const userInfo = await prisma.userInfo.upsert({
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

    // Determine onboarding stage based on role
    let onboardingStage: string
    if (user.role === 'doctor') {
      onboardingStage = 'DOCTOR_INFO'
    } else if (user.role === 'patient') {
      onboardingStage = 'COMPLETED'
    } else {
      onboardingStage = 'USER_INFO'
    }

    // Update user onboarding stage after user info is created
    await prisma.user.update({
      where: { id: data.userId },
      data: { onboardingStage },
    })

    return userInfo
  },

  getUserInfo: async (userId: string) => {
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isAnonymous: true,
            employeeCode: true,
          },
        },
      },
    })
    return userInfo
  },

  toggleAnonymousMode: async (userId: string) => {
    // Get current user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isAnonymous: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Only patients can use anonymous mode
    if (user.role !== 'patient') {
      throw new Error('Only patients can use anonymous mode')
    }

    // Toggle anonymous mode
    const newAnonymousStatus = !user.isAnonymous

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isAnonymous: newAnonymousStatus,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isAnonymous: true,
        employeeCode: true,
      },
    })

    return updatedUser
  },

  // Block a patient (admin only)
  blockPatient: async (patientId: string, banReason?: string) => {
    // Ensure the user is a patient
    const patient = await prisma.user.findFirst({
      where: {
        id: patientId,
        role: 'patient',
      },
      select: {
        id: true,
      },
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    // Update user to set banned status
    await prisma.user.update({
      where: { id: patientId },
      data: {
        banned: true,
        banReason: banReason || null,
        banExpires: null, // Permanent ban unless specified
      },
    })

    // Return updated patient using existing helper
    const updated = await USER_SERVICES.getPatientById(patientId)

    if (!updated) {
      throw new Error('Patient not found after update')
    }

    return updated
  },

  // Unblock a patient (admin only)
  unblockPatient: async (patientId: string) => {
    // Ensure the user is a patient
    const patient = await prisma.user.findFirst({
      where: {
        id: patientId,
        role: 'patient',
      },
      select: {
        id: true,
      },
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    // Update user to remove banned status
    await prisma.user.update({
      where: { id: patientId },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
    })

    const updated = await USER_SERVICES.getPatientById(patientId)

    if (!updated) {
      throw new Error('Patient not found after update')
    }

    return updated
  },

  // Get all patients (admin only)
  getAllPatients: async (filters?: { page?: number; limit?: number; search?: string }) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where = {
      role: 'patient',
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters.search, mode: 'insensitive' as const } },
          { employeeCode: { contains: filters.search, mode: 'insensitive' as const } },
          { enterpriseCode: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
          onboardingStage: true,
          enterpriseCode: true,
          employeeCode: true,
          isAnonymous: true,
          createdAt: true,
          updatedAt: true,
          userInfo: {
            select: {
              id: true,
              gender: true,
              dateOfBirth: true,
              phone: true,
              address: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Convert user images to signed URLs
    const patientsWithSignedUrls = await Promise.all(
      patients.map(async patient => ({
        ...patient,
        image: await convertUserImageToSignedUrl(patient.image),
      }))
    )

    return {
      patients: patientsWithSignedUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  // Get patient by ID (admin only)
  getPatientById: async (patientId: string) => {
    const patient = await prisma.user.findFirst({
      where: {
        id: patientId,
        role: 'patient',
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        onboardingStage: true,
        enterpriseCode: true,
        employeeCode: true,
        isAnonymous: true,
        createdAt: true,
        updatedAt: true,
        userInfo: {
          select: {
            id: true,
            gender: true,
            dateOfBirth: true,
            phone: true,
            address: true,
          },
        },
      },
    })

    if (!patient) {
      return null
    }

    // Convert user image to signed URL
    const image = await convertUserImageToSignedUrl(patient.image)

    return {
      ...patient,
      image,
    }
  },

  // Get user by ID (for admin profile)
  getUserById: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!user) {
      return null
    }
    const image = await convertUserImageToSignedUrl(user.image)
    return {
      ...user,
      image,
    }
  },

  // Update admin profile
  updateAdminProfile: async (data: {
    userId: string
    name?: string
    image?: string | null
    phone?: string | null
  }) => {
    const updateData: {
      name?: string
      image?: string | null
      phone?: string | null
    } = {}

    if (data.name !== undefined) {
      updateData.name = data.name
    }
    if (data.image !== undefined) {
      updateData.image = data.image
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone
    }

    const user = await prisma.user.update({
      where: { id: data.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Convert image to signed URL
    const image = await convertUserImageToSignedUrl(user.image)

    return {
      ...user,
      image,
    }
  },
}
