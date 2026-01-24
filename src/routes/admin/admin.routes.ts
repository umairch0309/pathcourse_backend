import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

const doctorRequestResponseSchema = z
  .object({
    id: z.string(),
    userid: z.string(),
    professional_contact: z.string(),
    professional_email: z.string(),
    secondary_contact: z.string().nullable(),
    isAvailable: z.boolean(),
    isInMeeting: z.boolean(),
    rejectReason: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
      onboardingStage: z.string().nullable(),
      createdAt: z.string().datetime(),
    }),
    documents: z
      .object({
        id: z.string(),
        resume: z.string().nullable(),
        medicalLicense: z.string().nullable(),
        introductionVideo: z.string().nullable(),
      })
      .nullable(),
    education: z.array(
      z.object({
        id: z.string(),
        degree: z.string(),
        institution_name: z.string(),
        startYear: z.string().datetime(),
        endYear: z.string().datetime().nullable(),
      })
    ),
    professionalExperience: z
      .object({
        id: z.string(),
        profession: z.string(),
        special_interest_area: z.string(),
        age_group: z.string(),
        languages: z.array(z.string()),
      })
      .nullable(),
  })
  .describe('Doctor request with full profile information')

const doctorRequestsListResponseSchema = z
  .object({
    doctors: z.array(doctorRequestResponseSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  })
  .describe('List of doctor requests with pagination')

const approveDoctorBodySchema = z
  .object({
    doctorId: z.string().describe('Doctor ID to approve'),
  })
  .describe('Request body for approving a doctor')

const rejectDoctorBodySchema = z
  .object({
    doctorId: z.string().describe('Doctor ID to reject'),
    rejectReason: z.string().min(1).describe('Reason for rejection'),
  })
  .describe('Request body for rejecting a doctor')

const doctorStatusResponseSchema = z
  .object({
    id: z.string(),
    userid: z.string(),
    professional_contact: z.string(),
    professional_email: z.string(),
    rejectReason: z.string().nullable(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      onboardingStage: z.string().nullable(),
    }),
  })
  .describe('Doctor status response after approval or rejection')

const approvedDoctorResponseSchema = z
  .object({
    id: z.string(),
    userid: z.string(),
    professional_contact: z.string(),
    professional_email: z.string(),
    secondary_contact: z.string().nullable(),
    isAvailable: z.boolean(),
    isInMeeting: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
      phone: z.string().nullable(),
      banned: z.boolean().nullable(),
      banReason: z.string().nullable(),
      banExpires: z.string().datetime().nullable(),
      onboardingStage: z.string().nullable(),
      createdAt: z.string().datetime(),
    }),
    documents: z
      .object({
        id: z.string(),
        resume: z.string().nullable(),
        medicalLicense: z.string().nullable(),
        introductionVideo: z.string().nullable(),
      })
      .nullable(),
    education: z.array(
      z.object({
        id: z.string(),
        degree: z.string(),
        institution_name: z.string(),
        startYear: z.string().datetime(),
        endYear: z.string().datetime().nullable(),
        document: z.string().nullable(),
      })
    ),
    professionalExperience: z
      .object({
        id: z.string(),
        profession: z.string(),
        special_interest_area: z.string(),
        age_group: z.string(),
        languages: z.array(z.string()),
      })
      .nullable(),
  })
  .describe('Approved doctor with full profile information')

const approvedDoctorsListResponseSchema = z
  .object({
    doctors: z.array(approvedDoctorResponseSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  })
  .describe('List of approved doctors with pagination')

const createDoctorBodySchema = z
  .object({
    name: z.string().min(1).max(100).describe('Doctor name'),
    email: z.string().email().describe('Doctor email (for login)'),
    password: z.string().min(8).describe('Password (minimum 8 characters)'),
    professional_email: z.string().email().describe('Professional email address'),
    professional_contact: z.string().min(1).describe('Professional contact number'),
    secondary_contact: z.string().optional().nullable().describe('Secondary contact number'),
    phone: z.string().optional().nullable().describe('Phone number'),
  })
  .describe('Request body for creating a new doctor')

const createDoctorResponseSchema = approvedDoctorResponseSchema.describe(
  'Created doctor with full profile information'
)

const blockDoctorBodySchema = z
  .object({
    banReason: z.string().optional().nullable().describe('Reason for blocking the doctor'),
  })
  .describe('Request body for blocking a doctor')

const blockDoctorResponseSchema = z
  .object({
    id: z.string(),
    userid: z.string(),
    professional_contact: z.string(),
    professional_email: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
      phone: z.string().nullable(),
      banned: z.boolean().nullable(),
      banReason: z.string().nullable(),
      banExpires: z.string().datetime().nullable(),
      onboardingStage: z.string().nullable(),
    }),
  })
  .describe('Doctor response after blocking')

export const ADMIN_ROUTES = {
  getDoctorRequests: createRoute({
    path: '/admin/doctor-requests',
    method: 'get',
    tags: [TAGS.doctor],
    summary: 'Get all pending doctor requests (Admin only)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        search: z.string().optional().describe('Search by name, email, or professional email'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorRequestsListResponseSchema),
        'Doctor requests retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  approveDoctor: createRoute({
    path: '/admin/doctor-requests/approve',
    method: 'post',
    tags: [TAGS.doctor],
    summary: 'Approve a doctor request (Admin only)',
    request: {
      body: jsonContentRequired(approveDoctorBodySchema, 'Request body for approving a doctor'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorStatusResponseSchema),
        'Doctor approved successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(approveDoctorBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  rejectDoctor: createRoute({
    path: '/admin/doctor-requests/reject',
    method: 'post',
    tags: [TAGS.doctor],
    summary: 'Reject a doctor request (Admin only)',
    request: {
      body: jsonContentRequired(rejectDoctorBodySchema, 'Request body for rejecting a doctor'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorStatusResponseSchema),
        'Doctor rejected successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(rejectDoctorBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  getApprovedDoctors: createRoute({
    path: '/admin/doctors/approved',
    method: 'get',
    tags: [TAGS.doctor],
    summary: 'Get all approved doctors (Admin only)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        search: z.string().optional().describe('Search by name, email, or professional email'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(approvedDoctorsListResponseSchema),
        'Approved doctors retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  createDoctor: createRoute({
    path: '/admin/doctors',
    method: 'post',
    tags: [TAGS.doctor],
    summary: 'Create a new doctor (Admin only)',
    request: {
      body: jsonContentRequired(createDoctorBodySchema, 'Request body for creating a new doctor'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(createDoctorResponseSchema),
        'Doctor created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createDoctorBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.CONFLICT]: jsonContent(
        zodResponseSchema(),
        'Email or professional email already exists'
      ),
    },
  }),

  blockDoctor: createRoute({
    path: '/admin/doctors/{doctorId}/block',
    method: 'post',
    tags: [TAGS.doctor],
    summary: 'Block a doctor (Admin only)',
    request: {
      params: z.object({
        doctorId: z.string().describe('Doctor ID to block'),
      }),
      body: jsonContentRequired(blockDoctorBodySchema, 'Request body for blocking a doctor'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(blockDoctorResponseSchema),
        'Doctor blocked successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(blockDoctorBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  unblockDoctor: createRoute({
    path: '/admin/doctors/{doctorId}/unblock',
    method: 'post',
    tags: [TAGS.doctor],
    summary: 'Unblock a doctor (Admin only)',
    request: {
      params: z.object({
        doctorId: z.string().describe('Doctor ID to unblock'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(blockDoctorResponseSchema),
        'Doctor unblocked successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  getAllPatients: createRoute({
    path: '/admin/patients',
    method: 'get',
    tags: [TAGS.user],
    summary: 'Get all patients (Admin only)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        search: z
          .string()
          .optional()
          .describe('Search by name, email, employee code, or enterprise code'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            patients: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                email: z.string(),
                image: z.string().nullable(),
                phone: z.string().nullable(),
                role: z.string().nullable(),
                banned: z.boolean().nullable(),
                banReason: z.string().nullable(),
                banExpires: z.string().datetime().nullable(),
                onboardingStage: z.string().nullable(),
                enterpriseCode: z.string().nullable(),
                employeeCode: z.string().nullable(),
                isAnonymous: z.boolean().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                userInfo: z
                  .object({
                    id: z.string(),
                    gender: z.string().nullable(),
                    dateOfBirth: z.string().datetime().nullable(),
                    phone: z.string().nullable(),
                    address: z.string().nullable(),
                  })
                  .nullable(),
              })
            ),
            pagination: z.object({
              page: z.number().int(),
              limit: z.number().int(),
              total: z.number().int(),
              totalPages: z.number().int(),
            }),
          })
        ),
        'Patients retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  getPatientById: createRoute({
    path: '/admin/patients/{patientId}',
    method: 'get',
    tags: [TAGS.user],
    summary: 'Get patient by ID (Admin only)',
    request: {
      params: z.object({
        patientId: z.string().describe('Patient ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
            phone: z.string().nullable(),
            role: z.string().nullable(),
            banned: z.boolean().nullable(),
            banReason: z.string().nullable(),
            banExpires: z.string().datetime().nullable(),
            onboardingStage: z.string().nullable(),
            enterpriseCode: z.string().nullable(),
            employeeCode: z.string().nullable(),
            isAnonymous: z.boolean().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
            userInfo: z
              .object({
                id: z.string(),
                gender: z.string().nullable(),
                dateOfBirth: z.string().datetime().nullable(),
                phone: z.string().nullable(),
                address: z.string().nullable(),
              })
              .nullable(),
          })
        ),
        'Patient retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Patient not found'),
    },
  }),

  getAllUserQueries: createRoute({
    path: '/admin/user-queries',
    method: 'get',
    tags: [TAGS.userQuery],
    summary: 'Get all user queries (Admin only)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        search: z.string().optional().describe('Search term for organization name, organization email, name, email, number, or message'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            userQueries: z.array(
              z.object({
                id: z.string(),
                message: z.string(),
                organizationName: z.string(),
                organizationEmail: z.string(),
                name: z.string(),
                number: z.string(),
                email: z.string(),
                userId: z.string().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                user: z
                  .object({
                    id: z.string(),
                    name: z.string(),
                    email: z.string(),
                  })
                  .nullable()
                  .optional(),
              })
            ),
            pagination: z.object({
              page: z.number().int(),
              limit: z.number().int(),
              total: z.number().int(),
              totalPages: z.number().int(),
            }),
          })
        ),
        'User queries retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  getUserQueryById: createRoute({
    path: '/admin/user-queries/{id}',
    method: 'get',
    tags: [TAGS.userQuery],
    summary: 'Get user query by ID (Admin only)',
    request: {
      params: z.object({
        id: z.string().describe('User query ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            message: z.string(),
            organizationName: z.string(),
            organizationEmail: z.string(),
            name: z.string(),
            number: z.string(),
            email: z.string(),
            userId: z.string().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
            user: z
              .object({
                id: z.string(),
                name: z.string(),
                email: z.string(),
              })
              .nullable()
              .optional(),
          })
        ),
        'User query retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'User query not found'),
    },
  }),

  getAllAppointments: createRoute({
    path: '/admin/appointments',
    method: 'get',
    tags: [TAGS.appointment],
    summary: 'Get all appointments (Admin only)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        status: z.enum(['BOOKED', 'COMPLETED', 'NO_SHOW']).optional().describe('Filter by appointment status'),
        doctorId: z.string().optional().describe('Filter by doctor ID'),
        patientId: z.string().optional().describe('Filter by patient ID'),
        search: z.string().optional().describe('Search by issue, patient name, doctor name, or email'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            appointments: z.array(
              z.object({
                id: z.string(),
                doctorId: z.string(),
                patientId: z.string(),
                status: z.enum(['BOOKED', 'COMPLETED', 'NO_SHOW']),
                scheduledAt: z.string().datetime().nullable(),
                startedAt: z.string().datetime().nullable(),
                endedAt: z.string().datetime().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                chatroomExpiry: z.string().datetime().nullable(),
                age: z.number().int().nullable(),
                appointmentFor: z.string(),
                issue: z.string(),
                uploadId: z.string().nullable(),
                relationWithPatient: z.string().nullable(),
                patientName: z.string().nullable(),
                patientAge: z.number().int().nullable(),
                doctor: z.object({
                  id: z.string(),
                  name: z.string(),
                  email: z.string(),
                  image: z.string().nullable(),
                  phone: z.string().nullable(),
                  role: z.string().nullable(),
                  isAnonymous: z.boolean().nullable(),
                  employeeCode: z.string().nullable(),
                  enterpriseCode: z.string().nullable(),
                  banned: z.boolean().nullable(),
                  onboardingStage: z.string().nullable(),
                }),
                patient: z.object({
                  id: z.string(),
                  name: z.string().nullable(),
                  email: z.string().nullable(),
                  image: z.string().nullable(),
                  phone: z.string().nullable(),
                  role: z.string().nullable(),
                  isAnonymous: z.boolean().nullable(),
                  employeeCode: z.string().nullable(),
                  enterpriseCode: z.string().nullable(),
                  banned: z.boolean().nullable(),
                  onboardingStage: z.string().nullable(),
                }),
                appointmentNotes: z
                  .object({
                    id: z.string(),
                    appointmentId: z.string(),
                    doctorId: z.string(),
                    notes: z.string(),
                    createdAt: z.string().datetime(),
                    updatedAt: z.string().datetime(),
                  })
                  .nullable(),
                sessionReason: z
                  .object({
                    id: z.string(),
                    appointmentId: z.string(),
                    reason: z.string(),
                    createdAt: z.string().datetime(),
                    updatedAt: z.string().datetime(),
                  })
                  .nullable(),
              })
            ),
            pagination: z.object({
              page: z.number().int(),
              limit: z.number().int(),
              total: z.number().int(),
              totalPages: z.number().int(),
            }),
          })
        ),
        'Appointments retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  getAppointmentById: createRoute({
    path: '/admin/appointments/{id}',
    method: 'get',
    tags: [TAGS.appointment],
    summary: 'Get appointment by ID (Admin only)',
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            doctorId: z.string(),
            patientId: z.string(),
            status: z.enum(['BOOKED', 'COMPLETED', 'NO_SHOW']),
            scheduledAt: z.string().datetime().nullable(),
            startedAt: z.string().datetime().nullable(),
            endedAt: z.string().datetime().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
            chatroomExpiry: z.string().datetime().nullable(),
            age: z.number().int().nullable(),
            appointmentFor: z.string(),
            issue: z.string(),
            uploadId: z.string().nullable(),
            relationWithPatient: z.string().nullable(),
            patientName: z.string().nullable(),
            patientAge: z.number().int().nullable(),
            doctor: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              image: z.string().nullable(),
              phone: z.string().nullable(),
              role: z.string().nullable(),
              isAnonymous: z.boolean().nullable(),
              employeeCode: z.string().nullable(),
              enterpriseCode: z.string().nullable(),
              banned: z.boolean().nullable(),
              onboardingStage: z.string().nullable(),
              createdAt: z.string().datetime(),
            }),
            patient: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string().nullable(),
              image: z.string().nullable(),
              phone: z.string().nullable(),
              role: z.string().nullable(),
              isAnonymous: z.boolean().nullable(),
              employeeCode: z.string().nullable(),
              enterpriseCode: z.string().nullable(),
              banned: z.boolean().nullable(),
              onboardingStage: z.string().nullable(),
              createdAt: z.string().datetime(),
            }),
            appointmentNotes: z
              .object({
                id: z.string(),
                appointmentId: z.string(),
                doctorId: z.string(),
                notes: z.string(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
              })
              .nullable(),
            sessionReason: z
              .object({
                id: z.string(),
                appointmentId: z.string(),
                reason: z.string(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
              })
              .nullable(),
          })
        ),
        'Appointment retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
    },
  }),

  updateAdminProfile: createRoute({
    path: '/admin/profile',
    method: 'put',
    tags: [TAGS.user],
    summary: 'Update admin profile (Admin only)',
    request: {
      body: jsonContentRequired(
        z.object({
          name: z.string().min(1).max(100).optional().describe('Admin name'),
          image: z.string().nullable().optional().describe('Profile image URL or S3 key'),
          phone: z.string().max(50).nullable().optional().describe('Phone number'),
        }),
        'Request body for updating admin profile'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
            phone: z.string().nullable(),
            role: z.string().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
        'Admin profile updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(zodResponseSchema(), 'Unprocessable Entity'),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  getDashboardStats: createRoute({
    path: '/admin/dashboard/stats',
    method: 'get',
    tags: [TAGS.user],
    summary: 'Get dashboard statistics (Admin only)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            totalApprovedDoctors: z.number().int(),
            totalPatients: z.number().int(),
            totalUserQueries: z.number().int(),
            totalSessionsThisMonth: z.number().int(),
            completedSessionsThisMonth: z.number().int(),
          })
        ),
        'Dashboard statistics retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  getLastUserQueries: createRoute({
    path: '/admin/dashboard/last-user-queries',
    method: 'get',
    tags: [TAGS.userQuery],
    summary: 'Get last 5 user queries (Admin only)',
    request: {
      query: z.object({
        limit: z.string().optional().describe('Number of records to return (default: 5)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            userQueries: z.array(
              z.object({
                id: z.string(),
                message: z.string(),
                organizationName: z.string(),
                organizationEmail: z.string(),
                name: z.string(),
                number: z.string(),
                email: z.string(),
                userId: z.string().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                user: z
                  .object({
                    id: z.string(),
                    name: z.string(),
                    email: z.string(),
                  })
                  .nullable()
                  .optional(),
              })
            ),
          })
        ),
        'Last user queries retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  getLastAppointments: createRoute({
    path: '/admin/dashboard/last-appointments',
    method: 'get',
    tags: [TAGS.appointment],
    summary: 'Get last 5 appointments (Admin only)',
    request: {
      query: z.object({
        limit: z.string().optional().describe('Number of records to return (default: 5)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            appointments: z.array(
              z.object({
                id: z.string(),
                doctorId: z.string(),
                patientId: z.string(),
                status: z.enum(['BOOKED', 'COMPLETED', 'NO_SHOW']),
                scheduledAt: z.string().datetime().nullable(),
                startedAt: z.string().datetime().nullable(),
                endedAt: z.string().datetime().nullable(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                appointmentFor: z.string(),
                issue: z.string(),
                doctor: z.object({
                  id: z.string(),
                  name: z.string(),
                  email: z.string(),
                  image: z.string().nullable(),
                  role: z.string().nullable(),
                }),
                patient: z.object({
                  id: z.string(),
                  name: z.string().nullable(),
                  email: z.string().nullable(),
                  image: z.string().nullable(),
                  role: z.string().nullable(),
                }),
              })
            ),
          })
        ),
        'Last appointments retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),
}
