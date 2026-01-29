/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { doctorConnectionTracker } from '~/lib/doctor-connection-tracker'
import prisma from '~/lib/prisma'
import { DOCTOR_SERVICES } from '~/services/doctor.service'

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

    // -----------------------------------------------------------------------
    // Enterprise monthly session limit & per-patient weekly limit
    // -----------------------------------------------------------------------

    // Get patient (to access enterpriseCode)
    const patient = await prisma.user.findUnique({
      where: { id: data.patientId },
      select: {
        enterpriseCode: true,
      },
    })

    if (!patient) {
      throw new Error('Patient not found')
    }

    // If patient is linked to an enterprise, enforce enterprise monthly quota
    if (patient.enterpriseCode) {
      const enterprise = await prisma.enterprise.findUnique({
        where: { code: patient.enterpriseCode },
        select: {
          id: true,
          sessionsPerMonth: true,
        },
      })

      if (!enterprise) {
        throw new Error('Enterprise not found for this patient')
      }

      // Compute current month range based on scheduledAt
      const month = scheduledAt.getMonth() // 0-11
      const year = scheduledAt.getFullYear()
      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

      // Count enterprise sessions for this month (BOOKED or COMPLETED)
      const enterpriseSessionsThisMonth = await prisma.appointment.count({
        where: {
          status: {
            in: ['BOOKED', 'COMPLETED'],
          },
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          patient: {
            enterpriseCode: patient.enterpriseCode,
          },
        },
      })

      if (enterpriseSessionsThisMonth >= enterprise.sessionsPerMonth) {
        throw new Error('Enterprise monthly session limit reached for this patient group')
      }
    }

    // Enforce per-patient weekly limit: max 3 sessions per calendar week
    // Week is considered Monday (0:00) to Sunday (23:59:59.999) based on scheduledAt
    const scheduledDay = scheduledAt.getDay() // 0 (Sun) - 6 (Sat)
    // Calculate how many days to subtract to get Monday
    const diffToMonday = (scheduledDay + 6) % 7 // maps Mon->0, Tue->1, ..., Sun->6

    const startOfWeek = new Date(
      scheduledAt.getFullYear(),
      scheduledAt.getMonth(),
      scheduledAt.getDate() - diffToMonday,
      0,
      0,
      0,
      0
    )
    const endOfWeek = new Date(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth(),
      startOfWeek.getDate() + 6,
      23,
      59,
      59,
      999
    )

    const patientSessionsThisWeek = await prisma.appointment.count({
      where: {
        patientId: data.patientId,
        status: {
          in: ['BOOKED', 'COMPLETED'],
        },
        scheduledAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    })

    if (patientSessionsThisWeek >= 3) {
      throw new Error('Weekly session limit reached (maximum 3 sessions per week per user)')
    }

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
            isAnonymous: true,
            employeeCode: true,
          },
        },
        patient: {
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

    // After creating appointment, set doctor as unavailable for the appointment duration (15 minutes)
    // This ensures the doctor remains unavailable during the appointment time
    await prisma.doctor.update({
      where: { userid: data.doctorId },
      data: {
        isAvailable: false,
      },
    })

    // Create notification for doctor about new appointment
    const { createNotificationForUser, NOTIFICATION_TYPES } = await import(
      '~/lib/notification-helper'
    )
    await createNotificationForUser(
      data.doctorId,
      NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
      `New appointment booked with ${appointment.patient.name || 'a patient'}. Click to join the session.`,
      appointment.id
    )

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
            isAnonymous: true,
            employeeCode: true,
          },
        },
        patient: {
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

    return appointment
  },

  getByIdWithFullDetails: async (id: string) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            doctor: {
              include: {
                documents: true,
                education: true,
                professionalExperience: true,
              },
            },
            userInfo: true,
          },
        },
        patient: {
          include: {
            userInfo: true,
          },
        },
      },
    })

    return appointment
  },

  getPatientAppointments: async (
    patientId: string,
    filters?: {
      status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW'
      page?: number
      limit?: number
    }
  ) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where: {
      patientId: string
      status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW'
    } = {
      patientId,
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
            include: {
              doctor: {
                include: {
                  documents: true,
                  education: true,
                  professionalExperience: true,
                },
              },
              userInfo: true,
            },
          },
          patient: {
            include: {
              userInfo: true,
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

  getDoctorAppointments: async (
    doctorId: string,
    filters?: {
      status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW'
      page?: number
      limit?: number
    }
  ) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where: {
      doctorId: string
      status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW'
    } = {
      doctorId,
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
            include: {
              doctor: {
                include: {
                  documents: true,
                  education: true,
                  professionalExperience: true,
                },
              },
              userInfo: true,
            },
          },
          patient: {
            include: {
              userInfo: true,
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
              isAnonymous: true,
              employeeCode: true,
            },
          },
          patient: {
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

  updateStartedAt: async (id: string, doctorId: string, startedAt?: Date) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    })

    if (!appointment) {
      throw new Error('Appointment not found')
    }

    if (appointment.doctorId !== doctorId) {
      throw new Error('You do not have permission to update this appointment')
    }

    const startTime = startedAt || new Date()

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        startedAt: startTime,
      },
      include: {
        doctor: {
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
        patient: {
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

    return updatedAppointment
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
            isAnonymous: true,
            employeeCode: true,
          },
        },
        patient: {
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

    // Create notifications based on status
    const { createNotificationForUser, NOTIFICATION_TYPES } = await import(
      '~/lib/notification-helper'
    )
    if (status === 'COMPLETED') {
      await Promise.all([
        createNotificationForUser(
          updatedAppointment.doctorId,
          NOTIFICATION_TYPES.APPOINTMENT_COMPLETED,
          `Appointment with ${updatedAppointment.patient.name || 'patient'} has been completed.`,
          updatedAppointment.id
        ),
        createNotificationForUser(
          updatedAppointment.patientId,
          NOTIFICATION_TYPES.APPOINTMENT_COMPLETED,
          `Your appointment with ${updatedAppointment.doctor.name} has been completed.`,
          updatedAppointment.id
        ),
      ])
    } else if (status === 'NO_SHOW') {
      await Promise.all([
        createNotificationForUser(
          updatedAppointment.doctorId,
          NOTIFICATION_TYPES.APPOINTMENT_NO_SHOW,
          `Appointment with ${updatedAppointment.patient.name || 'patient'} was marked as no-show.`,
          updatedAppointment.id
        ),
        createNotificationForUser(
          updatedAppointment.patientId,
          NOTIFICATION_TYPES.APPOINTMENT_NO_SHOW,
          `Your appointment with ${updatedAppointment.doctor.name} was marked as no-show.`,
          updatedAppointment.id
        ),
      ])
    }

    // If appointment is completed, automatically set doctor availability to true
    // But only if there are no other active or upcoming appointments within 15 minutes
    if (status === 'COMPLETED') {
      const now = new Date()
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)

      // Check if doctor has any other active or upcoming appointments within 15 minutes
      // This includes appointments that started in the past (still active) or upcoming (within next 15 min)
      const activeOrUpcomingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          status: 'BOOKED',
          id: {
            not: id, // Exclude the current appointment
          },
          scheduledAt: {
            gte: fifteenMinutesAgo, // Within last 15 minutes (active) or next 15 minutes (upcoming)
            lte: fifteenMinutesFromNow,
          },
        },
      })

      // Only set availability to true if there are no active or upcoming appointments
      if (!activeOrUpcomingAppointment) {
        // Check if doctor exists and is not in a meeting
        const doctor = await prisma.doctor.findUnique({
          where: { userid: appointment.doctorId },
          select: { isInMeeting: true, isAvailable: true },
        })

        if (doctor && !doctor.isInMeeting) {
          // Update doctor availability to true
          await prisma.doctor.update({
            where: { userid: appointment.doctorId },
            data: {
              isAvailable: true,
            },
          })

          // Register connection in tracker when doctor becomes available
          // This ensures connection tracking starts immediately
          const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          doctorConnectionTracker.registerConnection(appointment.doctorId, connectionId)
          console.log(
            `Doctor ${appointment.doctorId} availability set to true after appointment completion - connection registered with ID: ${connectionId}`
          )
        }
      }
    }

    return updatedAppointment
  },

  /**
   * Get last N completed sessions for a doctor (session history)
   * Default: last 4 completed appointments
   */
  getDoctorSessionHistory: async (doctorId: string, limit = 4) => {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: 'COMPLETED',
      },
      orderBy: {
        // Prefer most recently ended sessions first; fallback to createdAt if needed
        endedAt: 'desc',
      },
      take: limit,
      include: {
        doctor: {
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
        patient: {
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
        sessionReason: true,
      },
    })

    return appointments
  },

  /**
   * Get last N completed sessions for a patient (session history)
   * Default: last 5 completed appointments
   */
  getPatientSessionHistory: async (patientId: string, limit = 5) => {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        status: 'COMPLETED',
      },
      orderBy: {
        // Most recently ended sessions first
        endedAt: 'desc',
      },
      take: limit,
      include: {
        doctor: {
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
        patient: {
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

    return appointments
  },

  /**
   * Get last N session reason records for a doctor
   * Default: last 3 records (completed appointments with a sessionReason)
   */
  getDoctorSessionReasonHistory: async (doctorId: string, limit = 3) => {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: 'COMPLETED',
        sessionReason: {
          isNot: null,
        },
      },
      orderBy: {
        // Order by most recently ended or created sessions
        endedAt: 'desc',
      },
      take: limit,
      include: {
        doctor: {
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
        patient: {
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
        sessionReason: true,
      },
    })

    return appointments
  },

  /**
   * Get full session reason history for a doctor with pagination
   */
  getDoctorFullSessionReasonHistory: async (
    doctorId: string,
    options?: {
      page?: number
      limit?: number
    }
  ) => {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const skip = (page - 1) * limit

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          doctorId,
          status: 'COMPLETED',
          sessionReason: {
            isNot: null,
          },
        },
        orderBy: {
          endedAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          doctor: {
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
          patient: {
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
          sessionReason: true,
        },
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          status: 'COMPLETED',
          sessionReason: {
            isNot: null,
          },
        },
      }),
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

  /**
   * Get yearly session reason stats for a doctor (for graph integration)
   * Returns per-month counts per SessionReasonType
   */
  getDoctorYearlySessionReasonStats: async (doctorId: string, year: number) => {
    const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: 'COMPLETED',
        scheduledAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
        sessionReason: {
          isNot: null,
        },
      },
      include: {
        sessionReason: true,
      },
    })

    // Initialize stats structure: 12 months x 3 reason types
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const initialPerMonth = months.map(month => ({
      month,
      LETTING_OFF_STEAM: 0,
      TALKING_THROUGH_STRESS_OR_UNCERTAINTY: 0,
      NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD: 0,
      total: 0,
    }))

    for (const appointment of appointments) {
      if (!appointment.scheduledAt || !appointment.sessionReason) {
        continue
      }
      const monthIndex = appointment.scheduledAt.getMonth() // 0-11
      const bucket = initialPerMonth[monthIndex]

      const reason = appointment.sessionReason.reason as
        | 'LETTING_OFF_STEAM'
        | 'TALKING_THROUGH_STRESS_OR_UNCERTAINTY'
        | 'NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD'

      if (reason === 'LETTING_OFF_STEAM') {
        bucket.LETTING_OFF_STEAM += 1
      } else if (reason === 'TALKING_THROUGH_STRESS_OR_UNCERTAINTY') {
        bucket.TALKING_THROUGH_STRESS_OR_UNCERTAINTY += 1
      } else if (reason === 'NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD') {
        bucket.NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD += 1
      }

      bucket.total += 1
    }

    return {
      year,
      months: initialPerMonth,
    }
  },

  /**
   * Get monthly stats for a doctor's appointments
   * Returns total and completed appointments for the given month/year
   */
  getDoctorMonthlyStats: async (doctorId: string, month: number, year: number) => {
    // month is 1-12; Date expects 0-11
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

    const [totalAppointments, completedAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          doctorId,
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          status: 'COMPLETED',
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ])

    return {
      month,
      year,
      totalAppointments,
      completedAppointments,
    }
  },

  /**
   * Get monthly stats for a patient's appointments
   * Returns total and completed appointments for the given month/year
   */
  getPatientMonthlyStats: async (patientId: string, month: number, year: number) => {
    // month is 1-12; Date expects 0-11
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

    const [totalAppointments, completedAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          patientId,
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          patientId,
          status: 'COMPLETED',
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ])

    return {
      month,
      year,
      totalAppointments,
      completedAppointments,
    }
  },

  /**
   * Get weekly activity stats for a patient's appointments
   * Returns counts per weekday for the current week (Mon-Sun)
   * Designed for simple bar chart activity graphs.
   */
  getPatientWeeklyActivityStats: async (patientId: string, referenceDate: Date) => {
    // Compute start of week (Monday) and end of week (Sunday) based on reference date
    const day = referenceDate.getDay() // 0 (Sun) - 6 (Sat)
    const diffToMonday = (day + 6) % 7 // days since Monday
    const startOfWeek = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - diffToMonday,
      0,
      0,
      0,
      0
    )
    const endOfWeek = new Date(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth(),
      startOfWeek.getDate() + 6,
      23,
      59,
      59,
      999
    )

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        status: 'COMPLETED',
        scheduledAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      select: {
        scheduledAt: true,
      },
    })

    const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

    const days = weekdayLabels.map((label, index) => {
      const date = new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate() + index
      )
      return {
        weekday: label,
        date,
        count: 0,
      }
    })

    for (const apt of appointments) {
      if (!apt.scheduledAt) {
        continue
      }
      const idx = Math.floor(
        (apt.scheduledAt.getTime() - startOfWeek.getTime()) / (24 * 60 * 60 * 1000)
      )
      if (idx >= 0 && idx < days.length) {
        days[idx].count += 1
      }
    }

    return {
      weekStart: startOfWeek,
      weekEnd: endOfWeek,
      days,
    }
  },

  /**
   * Mark appointments as NO_SHOW if 20 minutes have passed since scheduledAt
   * Only affects appointments with status BOOKED that haven't been completed
   * Also checks if doctors can be restored to available status
   */
  markNoShowAppointments: async () => {
    const now = new Date()
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000) // 20 minutes ago

    // Find all BOOKED appointments where scheduledAt is more than 20 minutes ago
    const appointmentsToMark = await prisma.appointment.findMany({
      where: {
        status: 'BOOKED',
        scheduledAt: {
          not: null,
          lte: twentyMinutesAgo, // scheduledAt is 20+ minutes in the past
        },
      },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        scheduledAt: true,
      },
    })

    if (appointmentsToMark.length === 0) {
      return {
        marked: 0,
        appointments: [],
      }
    }

    // Update all found appointments to NO_SHOW status
    const updateResult = await prisma.appointment.updateMany({
      where: {
        id: {
          in: appointmentsToMark.map(apt => apt.id),
        },
      },
      data: {
        status: 'NO_SHOW',
      },
    })

    // Create notifications for no-show appointments
    const { createNotificationForUser, NOTIFICATION_TYPES } = await import(
      '~/lib/notification-helper'
    )
    const notificationPromises = appointmentsToMark.flatMap(apt => [
      createNotificationForUser(
        apt.doctorId,
        NOTIFICATION_TYPES.APPOINTMENT_NO_SHOW,
        `Appointment was marked as no-show.`,
        apt.id
      ),
      createNotificationForUser(
        apt.patientId,
        NOTIFICATION_TYPES.APPOINTMENT_NO_SHOW,
        `Your appointment was marked as no-show.`,
        apt.id
      ),
    ])
    await Promise.all(notificationPromises)

    // Get unique doctor IDs to check availability restoration
    const uniqueDoctorIds = Array.from(new Set(appointmentsToMark.map(apt => apt.doctorId)))

    // Check and restore doctor availability for each affected doctor
    for (const doctorId of uniqueDoctorIds) {
      try {
        // Sync availability - this will check for other upcoming appointments
        // and restore availability if there are no active appointments
        await DOCTOR_SERVICES.syncAvailabilityWithMeetingStatus(doctorId)
      } catch (error) {
        console.error(`[No-Show Cron] Error syncing availability for doctor ${doctorId}:`, error)
      }
    }

    console.log(
      `[No-Show Cron] Marked ${updateResult.count} appointment(s) as NO_SHOW. Appointment IDs: ${appointmentsToMark.map(apt => apt.id).join(', ')}`
    )

    return {
      marked: updateResult.count,
      appointments: appointmentsToMark.map(apt => ({
        id: apt.id,
        doctorId: apt.doctorId,
        patientId: apt.patientId,
        scheduledAt: apt.scheduledAt,
      })),
    }
  },

  submitSessionReason: async (data: {
    appointmentId: string
    doctorId: string
    reason:
      | 'LETTING_OFF_STEAM'
      | 'TALKING_THROUGH_STRESS_OR_UNCERTAINTY'
      | 'NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD'
  }) => {
    // Check if appointment exists and belongs to the doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        sessionReason: true,
      },
    })

    if (!appointment) {
      throw new Error('Appointment not found')
    }

    if (appointment.doctorId !== data.doctorId) {
      throw new Error('You do not have permission to submit session reason for this appointment')
    }

    if (appointment.status !== 'COMPLETED') {
      throw new Error('Session reason can only be submitted for completed appointments')
    }

    // Create or update session reason
    const sessionReason = await prisma.sessionReason.upsert({
      where: { appointmentId: data.appointmentId },
      update: {
        reason: data.reason,
        updatedAt: new Date(),
      },
      create: {
        appointmentId: data.appointmentId,
        reason: data.reason,
      },
    })

    return sessionReason
  },

  // Get all appointments for admin (with full details)
  getAllForAdmin: async (filters?: {
    doctorId?: string
    patientId?: string
    status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW'
    page?: number
    limit?: number
    search?: string
    isArchived?: boolean
  }) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters?.doctorId) {
      where.doctorId = filters.doctorId
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.isArchived !== undefined) {
      where.isArchived = filters.isArchived
    }

    // Search functionality
    if (filters?.search) {
      where.AND = [
        {
          OR: [
            { issue: { contains: filters.search, mode: 'insensitive' } },
            { patientName: { contains: filters.search, mode: 'insensitive' } },
            { doctor: { name: { contains: filters.search, mode: 'insensitive' } } },
            { doctor: { email: { contains: filters.search, mode: 'insensitive' } } },
            { patient: { name: { contains: filters.search, mode: 'insensitive' } } },
            { patient: { email: { contains: filters.search, mode: 'insensitive' } } },
          ],
        },
      ]
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
              phone: true,
              role: true,
              isAnonymous: true,
              employeeCode: true,
              enterpriseCode: true,
              banned: true,
              onboardingStage: true,
            },
          },
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
              role: true,
              isAnonymous: true,
              employeeCode: true,
              enterpriseCode: true,
              banned: true,
              onboardingStage: true,
            },
          },
          appointmentNotes: true,
          sessionReason: true,
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

  // Get appointment by ID for admin (with full details)
  getByIdForAdmin: async (id: string) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            role: true,
            isAnonymous: true,
            employeeCode: true,
            enterpriseCode: true,
            banned: true,
            onboardingStage: true,
            createdAt: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            role: true,
            isAnonymous: true,
            employeeCode: true,
            enterpriseCode: true,
            banned: true,
            onboardingStage: true,
            createdAt: true,
          },
        },
        appointmentNotes: true,
        sessionReason: true,
      },
    })

    return appointment
  },

  // Archive (soft delete) an appointment for admin
  archiveForAdmin: async (id: string) => {
    // Ensure appointment exists
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw new Error('Appointment not found')
    }

    // Mark as archived
    await prisma.appointment.update({
      where: { id },
      data: {
        isArchived: true,
      },
    })

    // Return full details using existing helper
    const archived = await APPOINTMENT_SERVICES.getByIdForAdmin(id)

    if (!archived) {
      throw new Error('Appointment not found after archive')
    }

    return archived
  },

  // Get last N appointments
  getLastN: async (limit: number = 5) => {
    const appointments = await prisma.appointment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        updatedAt: true,
        appointmentFor: true,
        issue: true,
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

    return appointments
  },
}
