import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, openAPI } from 'better-auth/plugins'
import { ORIGINS } from '~/config/origins'
import prisma from '~/lib/prisma'
import { ac, admin as adminRole, doctor, guest, patient } from './permissions'
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  advanced: {
    ...(Bun.env.NODE_ENV === 'production'
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: '.hasseebmayo.com',
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      onboardingStage: {
        type: 'string',
        defaultValue: 'ROLE_SELECTION',
      },
      enterpriseCode: {
        type: 'string',
        defaultValue: null,
        required: false,
      },
      employeeCode: {
        type: 'string',
        defaultValue: null,
        required: false,
      },
    },
  },
  plugins: [
    openAPI({
      theme: 'kepler',
    }),
    admin({
      defaultRole: 'guest',
      ac: ac,
      roles: { admin: adminRole, doctor, patient, guest },
    }),
  ],
  trustedOrigins: ORIGINS,
})
