import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { EDUCATION_ROUTES } from '~/routes/education/education.routes'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import { EDUCATION_SERVICES } from '~/services/education.service'
import type { HandlerMapFromRoutes } from '~/types'

const formatEducationResponse = (education: {
  id: string
  doctorId: string
  degree: string
  startYear: Date
  endYear: Date | null
  document: string | null
  institution_name: string
  createdAt: Date
  updatedAt: Date
}) => ({
  id: education.id,
  doctorId: education.doctorId,
  degree: education.degree,
  startYear: education.startYear.toISOString(),
  endYear: education.endYear?.toISOString() || null,
  document: education.document,
  institution_name: education.institution_name,
  createdAt: education.createdAt.toISOString(),
  updatedAt: education.updatedAt.toISOString(),
})

const handleEducationError = (error: unknown): never => {
  if (error instanceof HttpError) {
    throw error
  }
  if (error instanceof Error) {
    if (error.message === 'Education not found') {
      throw new HttpError('Education record not found', HttpStatusCodes.NOT_FOUND)
    }
    if (error.message.includes('Unauthorized')) {
      throw new HttpError(
        'Unauthorized: Education does not belong to this doctor',
        HttpStatusCodes.FORBIDDEN
      )
    }
  }
  throw new HttpError('Operation failed', HttpStatusCodes.INTERNAL_SERVER_ERROR)
}

export const EDUCATION_ROUTES_HANDLER: HandlerMapFromRoutes<typeof EDUCATION_ROUTES> = {
  bulkCreate: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can create education records
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    // Get doctor record
    const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
    if (!doctor) {
      throw new HttpError('Doctor information not found', HttpStatusCodes.NOT_FOUND)
    }

    const { educations } = c.req.valid('json')

    try {
      const createdEducations = await EDUCATION_SERVICES.bulkCreate({
        doctorId: doctor.id,
        educations: educations.map(edu => ({
          degree: edu.degree,
          startYear: new Date(edu.startYear),
          endYear: edu.endYear ? new Date(edu.endYear) : null,
          document: edu.document || null,
          institution_name: edu.institution_name,
        })),
      })

      return c.json(
        {
          message: `Successfully created ${createdEducations.length} education record(s)`,
          success: true,
          data: {
            educations: createdEducations.map(formatEducationResponse),
          },
        },
        HttpStatusCodes.CREATED
      )
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      if (error instanceof Error && error.message === 'Doctor not found') {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        'Failed to create education records',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can access their education records
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    // Get doctor record
    const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
    if (!doctor) {
      throw new HttpError('Doctor information not found', HttpStatusCodes.NOT_FOUND)
    }

    const educations = await EDUCATION_SERVICES.getAllByDoctorId(doctor.id)

    return c.json(
      {
        message: 'Education records retrieved successfully',
        success: true,
        data: {
          educations: educations.map(formatEducationResponse),
        },
      },
      HttpStatusCodes.OK
    )
  },

  getById: async c => {
    const { id } = c.req.valid('param')

    const education = await EDUCATION_SERVICES.getById(id)

    if (!education) {
      throw new HttpError('Education record not found', HttpStatusCodes.NOT_FOUND)
    }

    return c.json(
      {
        message: 'Education record retrieved successfully',
        success: true,
        data: formatEducationResponse(education),
      },
      HttpStatusCodes.OK
    )
  },

  update: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can update education records
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    // Get doctor record
    const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
    if (!doctor) {
      throw new HttpError('Doctor information not found', HttpStatusCodes.NOT_FOUND)
    }

    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    try {
      const updatedEducation = await EDUCATION_SERVICES.update({
        id,
        doctorId: doctor.id,
        degree: body.degree,
        startYear: body.startYear ? new Date(body.startYear) : undefined,
        endYear:
          body.endYear !== undefined ? (body.endYear ? new Date(body.endYear) : null) : undefined,
        document: body.document !== undefined ? body.document : undefined,
        institution_name: body.institution_name,
      })

      return c.json(
        {
          message: 'Education record updated successfully',
          success: true,
          data: formatEducationResponse(updatedEducation),
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      handleEducationError(error)
    }
  },

  delete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can delete education records
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    // Get doctor record
    const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
    if (!doctor) {
      throw new HttpError('Doctor information not found', HttpStatusCodes.NOT_FOUND)
    }

    const { id } = c.req.valid('param')

    try {
      await EDUCATION_SERVICES.delete({
        id,
        doctorId: doctor.id,
      })

      return c.json(
        {
          message: 'Education record deleted successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      handleEducationError(error)
    }
  },
}
