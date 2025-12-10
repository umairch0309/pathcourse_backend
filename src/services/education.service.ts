import prisma from '~/lib/prisma'

export const EDUCATION_SERVICES = {
  bulkCreate: async (data: {
    doctorId: string
    educations: Array<{
      degree: string
      startYear: Date
      endYear?: Date | null
      document?: string | null
      institution_name: string
    }>
  }) => {
    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      select: { id: true },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Create all education records
    const createdEducations = await prisma.$transaction(
      data.educations.map(education =>
        prisma.education.create({
          data: {
            doctorId: data.doctorId,
            degree: education.degree,
            startYear: education.startYear,
            endYear: education.endYear,
            document: education.document,
            institution_name: education.institution_name,
          },
        })
      )
    )

    return createdEducations
  },

  getAllByDoctorId: async (doctorId: string) => {
    const educations = await prisma.education.findMany({
      where: { doctorId },
      orderBy: { startYear: 'desc' },
    })

    return educations
  },

  getById: async (id: string) => {
    const education = await prisma.education.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            userid: true,
            professional_email: true,
          },
        },
      },
    })

    return education
  },

  update: async (data: {
    id: string
    doctorId: string
    degree?: string
    startYear?: Date
    endYear?: Date | null
    document?: string | null
    institution_name?: string
  }) => {
    // Verify ownership
    const education = await prisma.education.findUnique({
      where: { id: data.id },
      select: { doctorId: true },
    })

    if (!education) {
      throw new Error('Education not found')
    }

    if (education.doctorId !== data.doctorId) {
      throw new Error('Unauthorized: Education does not belong to this doctor')
    }

    // Update education
    const updatedEducation = await prisma.education.update({
      where: { id: data.id },
      data: {
        degree: data.degree,
        startYear: data.startYear,
        endYear: data.endYear,
        document: data.document,
        institution_name: data.institution_name,
      },
    })

    return updatedEducation
  },

  delete: async (data: { id: string; doctorId: string }) => {
    // Verify ownership
    const education = await prisma.education.findUnique({
      where: { id: data.id },
      select: { doctorId: true },
    })

    if (!education) {
      throw new Error('Education not found')
    }

    if (education.doctorId !== data.doctorId) {
      throw new Error('Unauthorized: Education does not belong to this doctor')
    }

    // Delete education
    await prisma.education.delete({
      where: { id: data.id },
    })

    return { success: true }
  },
}
