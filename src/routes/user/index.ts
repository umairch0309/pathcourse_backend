import { createRouter } from '~/lib/create-app'
import { USER_ROUTES_HANDLER } from '~/routes/user/user.handlers'
import { USER_ROUTES } from '~/routes/user/user.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(USER_ROUTES).forEach(([key, route]) => {
  // biome-ignore lint/suspicious/noExplicitAny: type assertion needed for dynamic route handler mapping
  router.openapi(route, USER_ROUTES_HANDLER[key as keyof typeof USER_ROUTES_HANDLER] as any)
})

export default router

