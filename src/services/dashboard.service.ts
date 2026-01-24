import prisma from '~/lib/prisma'

export const DASHBOARD_SERVICES = {
  // Get dashboard stats for admin
  getStats: async () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get all stats in parallel
    const [
      totalApprovedDoctors,
      totalPatients,
      totalUserQueries,
      totalSessionsThisMonth,
      completedSessionsThisMonth,
    ] = await Promise.all([
      // Total approved doctors (onboardingStage = 'COMPLETED' and role = 'doctor')
      prisma.user.count({
        where: {
          role: 'doctor',
          onboardingStage: 'COMPLETED',
        },
      }),

      // Total patients (role = 'patient')
      prisma.user.count({
        where: {
          role: 'patient',
        },
      }),

      // Total user queries
      prisma.userQuery.count({}),

      // Total sessions this month (all appointments created this month)
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Completed sessions this month
      prisma.appointment.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ])

    return {
      totalApprovedDoctors,
      totalPatients,
      totalUserQueries,
      totalSessionsThisMonth,
      completedSessionsThisMonth,
    }
  },
}

