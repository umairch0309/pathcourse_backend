import { createRouter } from '~/lib/create-app'
import { ADMIN_ROUTES_HANDLER } from '~/routes/admin/admin.handlers'
import { ADMIN_ROUTES } from '~/routes/admin/admin.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(ADMIN_ROUTES).forEach(([key, route]) => {
  // biome-ignore lint/suspicious/noExplicitAny: type assertion needed for dynamic route handler mapping
  router.openapi(route, ADMIN_ROUTES_HANDLER[key as keyof typeof ADMIN_ROUTES_HANDLER] as any)
})

export default router
