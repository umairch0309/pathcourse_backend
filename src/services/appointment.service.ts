import prisma from '~/lib/prisma'

export const APPOINTMENT_SERVICES = {
  create: async (data: {
    doctorId: string
    patientId: string
    appointmentFor: string
    issue: string
    age?: number
    uploadId?: string
    scheduledAt?: Date
    relationWithPatient?: string
    patientName?: string
    patientAge?: number
  }) => {
    // Check if doctor exists and is available
    const doctor = await prisma.doctor.findUnique({
      where: { userid: data.doctorId },
      include: { user: true },
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    if (!doctor.isAvailable) {
      throw new Error('Doctor is not available for appointments at this time')
    }

    // Validate "someone else" fields if appointmentFor is "someone else"
    if (data.appointmentFor === 'someone else') {
      if (!data.relationWithPatient || !data.patientName || !data.patientAge) {
        throw new Error(
          'Relation with patient, patient name, and patient age are required when booking for someone else'
        )
      }
    }

    // Set scheduledAt to current time if not provided (appointment is booked for now)
    const scheduledAt = data.scheduledAt || new Date()

    // Create appointment with BOOKED status
    const appointment = await prisma.appointment.create({
      data: {
        doctorId: data.doctorId,
        patientId: data.patientId,
        appointmentFor: data.appointmentFor,
        issue: data.issue,
        age: data.age,
        uploadId: data.uploadId,
        scheduledAt: scheduledAt,
        relationWithPatient: data.relationWithPatient,
        patientName: data.patientName,
        patientAge: data.patientAge,
        status: 'BOOKED',
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        patient: {
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

    // After creating appointment, set doctor as unavailable for the appointment duration (15 minutes)
    // This ensures the doctor remains unavailable during the appointment time
    await prisma.doctor.update({
      where: { userid: data.doctorId },
      data: {
        isAvailable: false,
      },
    })

    return appointment
  },

  getById: async (id: string) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        patient: {
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

    return appointment
  },

  getAll: async (filters?: {
    doctorId?: string
    patientId?: string
    status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW'
    page?: number
    limit?: number
  }) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where: {
      doctorId?: string
      patientId?: string
      status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW'
    } = {}

    if (filters?.doctorId) {
      where.doctorId = filters.doctorId
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ])

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  updateStatus: async (id: string, status: 'BOOKED' | 'COMPLETED' | 'NO_SHOW') => {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    })

    if (!appointment) {
      throw new Error('Appointment not found')
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' && !appointment.endedAt ? { endedAt: new Date() } : {}),
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        patient: {
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

    // If appointment is completed or marked as no-show, the doctor can manually toggle availability back on
    // The syncAvailabilityWithMeetingStatus will check for other upcoming appointments and prevent
    // availability if there are any within the next 15 minutes

    return updatedAppointment
  },
}
