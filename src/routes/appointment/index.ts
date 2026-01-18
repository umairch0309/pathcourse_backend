import { createRouter } from '~/lib/create-app'
import { APPOINTMENT_ROUTES_HANDLER } from './appointment.handlers'
import { APPOINTMENT_ROUTES } from './appointment.routes'

const router = createRouter()

// Register routes in specific order to avoid conflicts
// More specific routes (with longer paths) must be registered first
// This ensures /appointments/doctor and /appointments/patient are matched before /appointments

// Register specific routes FIRST (before the general /appointments route)
// This ensures /appointments/doctor and /appointments/patient are matched before /appointments
router.openapi(
  APPOINTMENT_ROUTES.getDoctorAppointments,
  APPOINTMENT_ROUTES_HANDLER.getDoctorAppointments
)
router.openapi(
  APPOINTMENT_ROUTES.getPatientAppointments,
  APPOINTMENT_ROUTES_HANDLER.getPatientAppointments
)
router.openapi(APPOINTMENT_ROUTES.getByIdFull, APPOINTMENT_ROUTES_HANDLER.getByIdFull)

// Register other routes
router.openapi(APPOINTMENT_ROUTES.create, APPOINTMENT_ROUTES_HANDLER.create)
router.openapi(APPOINTMENT_ROUTES.getById, APPOINTMENT_ROUTES_HANDLER.getById)
router.openapi(APPOINTMENT_ROUTES.updateStartedAt, APPOINTMENT_ROUTES_HANDLER.updateStartedAt)
router.openapi(APPOINTMENT_ROUTES.markAsCompleted, APPOINTMENT_ROUTES_HANDLER.markAsCompleted)
router.openapi(APPOINTMENT_ROUTES.submitSessionReason, APPOINTMENT_ROUTES_HANDLER.submitSessionReason)
router.openapi(APPOINTMENT_ROUTES.updateStatus, APPOINTMENT_ROUTES_HANDLER.updateStatus)

// Register the general /appointments route LAST to avoid conflicts
router.openapi(APPOINTMENT_ROUTES.getAll, APPOINTMENT_ROUTES_HANDLER.getAll)

export default router
