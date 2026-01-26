import { createRouter } from '~/lib/create-app'
import { ROLE_ROUTES_HANDLER } from './role.handlers'
import { ROLE_ROUTES } from './role.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(ROLE_ROUTES).forEach(([key, route]) => {
  router.openapi(route, ROLE_ROUTES_HANDLER[key as keyof typeof ROLE_ROUTES_HANDLER])
})

export default router

