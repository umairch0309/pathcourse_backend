import { createRouter } from '~/lib/create-app'
import { EDUCATION_ROUTES_HANDLER } from '~/routes/education/education.handlers'
import { EDUCATION_ROUTES } from '~/routes/education/education.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(EDUCATION_ROUTES).forEach(([key, route]) => {
  router.openapi(
    route,
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for route handler mapping
    EDUCATION_ROUTES_HANDLER[key as keyof typeof EDUCATION_ROUTES_HANDLER] as any
  )
})

export default router
