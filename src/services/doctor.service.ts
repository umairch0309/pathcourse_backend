import prisma from '~/lib/prisma'

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

    return doctor
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
      },
    })

    return doctor
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
          },
        },
      },
    })

    return doctor
  },
}
