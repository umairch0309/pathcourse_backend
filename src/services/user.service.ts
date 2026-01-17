import prisma from '~/lib/prisma'

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
}
