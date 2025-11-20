import prisma from '~/lib/prisma'

export const SERVICE_PRICING_SERVICES = {
  getAll: async (serviceId?: string) => {
    const pricing = await prisma.servicePricing.findMany({
      where: {
        isActive: true,
        ...(serviceId && { serviceId }),
      },
      include: {
        service: true,
      },
      orderBy: { duration: 'asc' },
    })
    return pricing
  },

  getById: async (id: string) => {
    const pricing = await prisma.servicePricing.findUnique({
      where: { id },
      include: {
        service: true,
      },
    })
    return pricing
  },

  getByDuration: async (duration: number, serviceId?: string) => {
    const pricing = await prisma.servicePricing.findFirst({
      where: {
        duration,
        ...(serviceId && { serviceId }),
        isActive: true,
      },
      include: {
        service: true,
      },
    })
    return pricing
  },

  create: async (data: {
    serviceId: string
    duration: number
    userPrice: number
    doctorAmount: number
    platformAmount: number
  }) => {
    // Validate that amounts add up correctly
    const total = data.doctorAmount + data.platformAmount
    if (Math.abs(total - data.userPrice) > 0.01) {
      throw new Error('Doctor amount + Platform amount must equal user price')
    }

    const pricing = await prisma.servicePricing.create({
      data: {
        serviceId: data.serviceId,
        duration: data.duration,
        userPrice: data.userPrice,
        doctorAmount: data.doctorAmount,
        platformAmount: data.platformAmount,
        isActive: true,
      },
      include: {
        service: true,
      },
    })
    return pricing
  },

  update: async (id: string, data: {
    userPrice?: number
    doctorAmount?: number
    platformAmount?: number
    isActive?: boolean
  }) => {
    // If updating prices, validate they add up
    if (data.userPrice !== undefined || data.doctorAmount !== undefined || data.platformAmount !== undefined) {
      const existing = await prisma.servicePricing.findUnique({
        where: { id },
      })

      if (!existing) {
        throw new Error('Service pricing not found')
      }

      const userPrice = data.userPrice ?? Number(existing.userPrice)
      const doctorAmount = data.doctorAmount ?? Number(existing.doctorAmount)
      const platformAmount = data.platformAmount ?? Number(existing.platformAmount)

      const total = doctorAmount + platformAmount
      if (Math.abs(total - userPrice) > 0.01) {
        throw new Error('Doctor amount + Platform amount must equal user price')
      }
    }

    const pricing = await prisma.servicePricing.update({
      where: { id },
      data,
      include: {
        service: true,
      },
    })
    return pricing
  },

  updateByDuration: async (duration: number, serviceId: string, data: {
    userPrice?: number
    doctorAmount?: number
    platformAmount?: number
    isActive?: boolean
  }) => {
    // If updating prices, validate they add up
    if (data.userPrice !== undefined || data.doctorAmount !== undefined || data.platformAmount !== undefined) {
      const existing = await prisma.servicePricing.findFirst({
        where: {
          serviceId,
          duration,
        },
      })

      if (!existing) {
        throw new Error('Service pricing not found')
      }

      const userPrice = data.userPrice ?? Number(existing.userPrice)
      const doctorAmount = data.doctorAmount ?? Number(existing.doctorAmount)
      const platformAmount = data.platformAmount ?? Number(existing.platformAmount)

      const total = doctorAmount + platformAmount
      if (Math.abs(total - userPrice) > 0.01) {
        throw new Error('Doctor amount + Platform amount must equal user price')
      }
    }

    // Find the pricing record first
    const existing = await prisma.servicePricing.findFirst({
      where: {
        serviceId,
        duration,
      },
    })

    if (!existing) {
      throw new Error('Service pricing not found')
    }

    const pricing = await prisma.servicePricing.update({
      where: { id: existing.id },
      data,
      include: {
        service: true,
      },
    })
    return pricing
  },

  delete: async (id: string) => {
    // Soft delete by setting isActive to false
    const pricing = await prisma.servicePricing.update({
      where: { id },
      data: { isActive: false },
    })
    return pricing
  },
}

