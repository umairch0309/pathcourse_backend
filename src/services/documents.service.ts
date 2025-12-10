import prisma from '~/lib/prisma'

export const DOCUMENTS_SERVICES = {
  createOrUpdate: async (data: {
    doctorId: string
    resume?: string | null
    medicalLicense?: string | null
    introductionVideo?: string | null
  }) => {
    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      select: { id: true },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Create or update documents
    const documents = await prisma.documents.upsert({
      where: { doctorId: data.doctorId },
      update: {
        resume: data.resume,
        medicalLicense: data.medicalLicense,
        introductionVideo: data.introductionVideo,
      },
      create: {
        doctorId: data.doctorId,
        resume: data.resume || null,
        medicalLicense: data.medicalLicense || null,
        introductionVideo: data.introductionVideo || null,
      },
    })

    return documents
  },

  getByDoctorId: async (doctorId: string) => {
    const documents = await prisma.documents.findUnique({
      where: { doctorId },
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

    return documents
  },
}
