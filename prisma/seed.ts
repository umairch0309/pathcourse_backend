import prisma from '../src/lib/prisma'

async function seedPermissions() {
  console.log('Seeding permissions...')

  const permissions = [
    {
      name: 'Dashboard View',
      slug: 'dashboard.view',
      description: 'View dashboard statistics and overview',
    },
    {
      name: 'Enterprise Add',
      slug: 'enterprise.add',
      description: 'Create new enterprises',
    },
    {
      name: 'Enterprise View',
      slug: 'enterprise.view',
      description: 'View enterprises',
    },
    {
      name: 'Enterprise Update',
      slug: 'enterprise.update',
      description: 'Update enterprise details',
    },
    {
      name: 'Enterprise Delete',
      slug: 'enterprise.delete',
      description: 'Delete enterprises',
    },
    {
      name: 'Specialists View',
      slug: 'specialists.view',
      description: 'View specialists/doctors',
    },
    {
      name: 'Specialists Add',
      slug: 'specialists.add',
      description: 'Add new specialists/doctors',
    },
    {
      name: 'Specialists Block/Unblock',
      slug: 'specialists.block_unblock',
      description: 'Block or unblock specialists/doctors',
    },
    {
      name: 'Specialists Accept/Reject',
      slug: 'specialists.accept_reject',
      description: 'Accept or reject specialist/doctor requests',
    },
    {
      name: 'Users View',
      slug: 'users.view',
      description: 'View users/patients',
    },
    {
      name: 'Users Block/Unblock',
      slug: 'users.block_unblock',
      description: 'Block or unblock users/patients',
    },
    {
      name: 'Sessions View',
      slug: 'sessions.view',
      description: 'View appointments/sessions',
    },
    {
      name: 'Sessions Archive',
      slug: 'sessions.archive',
      description: 'Archive (soft delete) appointments/sessions',
    },
    {
      name: 'User Inquiries View',
      slug: 'user_inquiries.view',
      description: 'View user inquiries',
    },
    {
      name: 'User Inquiries Delete',
      slug: 'user_inquiries.delete',
      description: 'Delete user inquiries',
    },
    {
      name: 'Settings View',
      slug: 'settings.view',
      description: 'View and manage settings',
    },
    {
      name: 'Notifications View All',
      slug: 'notifications.view_all',
      description: 'View all admin notifications (no filtering)',
    },
    {
      name: 'Notifications View By Permission',
      slug: 'notifications.view_by_permission',
      description: 'View admin notifications filtered by the team member permissions',
    },
  ]

  for (const permission of permissions) {
    await (prisma as any).permission.upsert({
      where: { slug: permission.slug },
      update: {
        name: permission.name,
        description: permission.description,
      },
      create: permission,
    })
  }

  console.log(`✓ Seeded ${permissions.length} permissions`)
}

async function main() {
  try {
    await seedPermissions()
    console.log('✓ Seed completed successfully')
  } catch (error) {
    console.error('✗ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()

