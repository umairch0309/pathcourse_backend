import { createRouter } from '~/lib/create-app'
import { DOCTOR_PROFILE_COMPLETE_ROUTES_HANDLER } from '~/routes/doctor-profile-complete/doctor-profile-complete.handlers'
import { DOCTOR_PROFILE_COMPLETE_ROUTES } from '~/routes/doctor-profile-complete/doctor-profile-complete.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(DOCTOR_PROFILE_COMPLETE_ROUTES).forEach(([key, route]) => {
  router.openapi(route, DOCTOR_PROFILE_COMPLETE_ROUTES_HANDLER[key as keyof typeof DOCTOR_PROFILE_COMPLETE_ROUTES_HANDLER])
})

export default router

