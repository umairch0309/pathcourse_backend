import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding service and pricing data...')

  // Create or get the "Open Ear" service
  const service = await prisma.service.upsert({
    where: { name: 'Open Ear' },
    update: {},
    create: {
      name: 'Open Ear',
    },
  })
  console.log(`✓ Seeded service: ${service.name}`)

  // Service pricing data based on the pricing structure
  const pricingData = [
    {
      duration: 15,
      userPrice: 25.0,
      doctorAmount: 12.0,
      platformAmount: 13.0,
    },
    {
      duration: 30,
      userPrice: 55.0,
      doctorAmount: 25.0,
      platformAmount: 30.0,
    },
    {
      duration: 45,
      userPrice: 70.0,
      doctorAmount: 32.0,
      platformAmount: 38.0,
    },
    {
      duration: 60,
      userPrice: 95.0,
      doctorAmount: 45.0,
      platformAmount: 50.0,
    },
  ]

  for (const pricing of pricingData) {
    await prisma.servicePricing.upsert({
      where: {
        serviceId_duration: {
          serviceId: service.id,
          duration: pricing.duration,
        },
      },
      update: {
        userPrice: pricing.userPrice,
        doctorAmount: pricing.doctorAmount,
        platformAmount: pricing.platformAmount,
        isActive: true,
      },
      create: {
        serviceId: service.id,
        duration: pricing.duration,
        userPrice: pricing.userPrice,
        doctorAmount: pricing.doctorAmount,
        platformAmount: pricing.platformAmount,
        isActive: true,
      },
    })
    console.log(`✓ Seeded pricing for ${pricing.duration} minutes`)
  }

  console.log('Service and pricing seeding completed!')
}

main()
  .catch(e => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

