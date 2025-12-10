import { createRouter } from '~/lib/create-app'
import { DOCTOR_ROUTES_HANDLER } from '~/routes/doctor/doctor.handlers'
import { DOCTOR_ROUTES } from '~/routes/doctor/doctor.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(DOCTOR_ROUTES).forEach(([key, route]) => {
  // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for route handler mapping
  router.openapi(route, DOCTOR_ROUTES_HANDLER[key as keyof typeof DOCTOR_ROUTES_HANDLER] as any)
})

export default router
