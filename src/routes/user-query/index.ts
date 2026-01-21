import { createRouter } from '~/lib/create-app'
import { USER_QUERY_ROUTES_HANDLER } from '~/routes/user-query/user-query.handlers'
import { USER_QUERY_ROUTES } from '~/routes/user-query/user-query.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(USER_QUERY_ROUTES).forEach(([key, route]) => {
  // biome-ignore lint/suspicious/noExplicitAny: type assertion needed for dynamic route handler mapping
  router.openapi(route, USER_QUERY_ROUTES_HANDLER[key as keyof typeof USER_QUERY_ROUTES_HANDLER] as any)
})

export default router

