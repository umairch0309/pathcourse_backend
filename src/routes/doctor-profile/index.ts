import { createRouter } from '~/lib/create-app'
import { DOCTOR_PROFILE_ROUTES_HANDLER } from '~/routes/doctor-profile/doctor-profile.handlers'
import { DOCTOR_PROFILE_ROUTES } from '~/routes/doctor-profile/doctor-profile.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(DOCTOR_PROFILE_ROUTES).forEach(([key, route]) => {
  router.openapi(
    route,
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for route handler mapping
    DOCTOR_PROFILE_ROUTES_HANDLER[key as keyof typeof DOCTOR_PROFILE_ROUTES_HANDLER] as any
  )
})

export default router
