import { createRouter } from '~/lib/create-app'
import { PERMISSION_ROUTES_HANDLER } from './permission.handlers'
import { PERMISSION_ROUTES } from './permission.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(PERMISSION_ROUTES).forEach(([key, route]) => {
  router.openapi(route, PERMISSION_ROUTES_HANDLER[key as keyof typeof PERMISSION_ROUTES_HANDLER])
})

export default router
