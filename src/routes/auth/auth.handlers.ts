import * as HttpStatusCodes from 'stoker/http-status-codes'
import { auth } from '~/lib/auth'
import { HttpError } from '~/lib/error'
import { generateUniqueEmployeeCode } from '~/lib/generate-employee-code'
import prisma from '~/lib/prisma'
import type { AUTH_ROUTES } from '~/routes/auth/auth.routes'
import { ENTERPRISE_SERVICES } from '~/services/enterprise.service'
import type { HandlerMapFromRoutes } from '~/types'

export const AUTH_ROUTES_HANDLER: HandlerMapFromRoutes<typeof AUTH_ROUTES> = {
  patientSignup: async c => {
    const { name, email, password, enterpriseCode } = c.req.valid('json')

    // Validate enterprise code exists
    const enterprise = await ENTERPRISE_SERVICES.getByCode(enterpriseCode)
    if (!enterprise) {
      throw new HttpError('Invalid enterprise code', HttpStatusCodes.BAD_REQUEST)
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      throw new HttpError('Email already exists', HttpStatusCodes.CONFLICT)
    }

    // Generate unique employee code for this enterprise
    const employeeCode = await generateUniqueEmployeeCode(enterpriseCode)

    // Sign up the user using better-auth
    try {
      const signupResult = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      })

      if (!signupResult || !signupResult.user) {
        throw new HttpError('Failed to create user account', HttpStatusCodes.INTERNAL_SERVER_ERROR)
      }

      // Update user with patient-specific fields
      const updatedUser = await prisma.user.update({
        where: { id: signupResult.user.id },
        data: {
          role: 'patient',
          enterpriseCode,
          employeeCode,
          onboardingStage: 'USER_INFO', // Patients skip role selection since they're already set as patient
        },
      })

      // Format response
      const formattedResponse = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        enterpriseCode: updatedUser.enterpriseCode,
        employeeCode: updatedUser.employeeCode,
        onboardingStage: updatedUser.onboardingStage,
      }

      return c.json(
        {
          message: 'Patient signed up successfully',
          success: true,
          data: formattedResponse,
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: unknown) {
      // Handle better-auth specific errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        throw new HttpError('Email already exists', HttpStatusCodes.CONFLICT)
      }
      throw new HttpError(
        errorMessage || 'Failed to create patient account',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  doctorSignup: async c => {
    const { name, email, password } = c.req.valid('json')

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      throw new HttpError('Email already exists', HttpStatusCodes.CONFLICT)
    }

    // Sign up the user using better-auth
    try {
      const signupResult = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      })

      if (!signupResult || !signupResult.user) {
        throw new HttpError('Failed to create user account', HttpStatusCodes.INTERNAL_SERVER_ERROR)
      }

      // Update user with doctor-specific fields
      const updatedUser = await prisma.user.update({
        where: { id: signupResult.user.id },
        data: {
          role: 'doctor',
          onboardingStage: 'DOCTOR_INFO', // Doctors go through role selection flow
        },
      })

      // Format response
      const formattedResponse = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        onboardingStage: updatedUser.onboardingStage,
      }

      return c.json(
        {
          message: 'Doctor signed up successfully',
          success: true,
          data: formattedResponse,
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: unknown) {
      // Handle better-auth specific errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        throw new HttpError('Email already exists', HttpStatusCodes.CONFLICT)
      }
      throw new HttpError(
        errorMessage || 'Failed to create doctor account',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}
