import { createRouter } from '~/lib/create-app'
import { AUTH_ROUTES_HANDLER } from '~/routes/auth/auth.handlers'
import { AUTH_ROUTES } from '~/routes/auth/auth.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(AUTH_ROUTES).forEach(([key, route]) => {
  router.openapi(route, AUTH_ROUTES_HANDLER[key as keyof typeof AUTH_ROUTES_HANDLER])
})

export default router
