import { createRouter } from '~/lib/create-app'
import { FILES_ROUTES_HANDLER } from '~/routes/files/files-handlers'
import { FILES_ROUTES } from '~/routes/files/files-routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(FILES_ROUTES).forEach(([key, route]) => {
  // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for route handler mapping
  router.openapi(route, FILES_ROUTES_HANDLER[key as keyof typeof FILES_ROUTES_HANDLER] as any)
})

export default router
