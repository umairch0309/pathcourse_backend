import prisma from '~/lib/prisma'

export const PROFESSIONAL_EXPERIENCE_SERVICES = {
  createOrUpdate: async (data: {
    doctorId: string
    age_group: string
    languages: string[]
    profession: string
    special_interest_area: string
  }) => {
    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      select: { id: true },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Create or update professional experience
    const professionalExperience = await prisma.professionalExperience.upsert({
      where: { doctorId: data.doctorId },
      update: {
        age_group: data.age_group,
        languages: data.languages,
        profession: data.profession,
        special_interest_area: data.special_interest_area,
      },
      create: {
        doctorId: data.doctorId,
        age_group: data.age_group,
        languages: data.languages,
        profession: data.profession,
        special_interest_area: data.special_interest_area,
      },
    })

    return professionalExperience
  },

  getByDoctorId: async (doctorId: string) => {
    const professionalExperience = await prisma.professionalExperience.findUnique({
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

    return professionalExperience
  },
}
