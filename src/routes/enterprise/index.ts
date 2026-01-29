import { createRouter } from '~/lib/create-app'
import { ENTERPRISE_ROUTES_HANDLER } from '~/routes/enterprise/enterprise.handlers'
import { ENTERPRISE_ROUTES } from '~/routes/enterprise/enterprise.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(ENTERPRISE_ROUTES).forEach(([key, route]) => {
  // biome-ignore lint/suspicious/noExplicitAny: type assertion needed for dynamic route handler mapping
  router.openapi(route, ENTERPRISE_ROUTES_HANDLER[key as keyof typeof ENTERPRISE_ROUTES_HANDLER])
})

export default router
