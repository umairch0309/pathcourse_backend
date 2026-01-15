import { createRouter } from '~/lib/create-app'
import { APPOINTMENT_ROUTES_HANDLER } from './appointment.handlers'
import { APPOINTMENT_ROUTES } from './appointment.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(APPOINTMENT_ROUTES).forEach(([key, route]) => {
  router.openapi(route, APPOINTMENT_ROUTES_HANDLER[key as keyof typeof APPOINTMENT_ROUTES_HANDLER])
})

export default router

