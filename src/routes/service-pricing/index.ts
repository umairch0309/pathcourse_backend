import { createRouter } from '~/lib/create-app'
import { SERVICE_PRICING_ROUTES_HANDLER } from '~/routes/service-pricing/service-pricing.handlers'
import { SERVICE_PRICING_ROUTES } from '~/routes/service-pricing/service-pricing.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(SERVICE_PRICING_ROUTES).forEach(([key, route]) => {
  router.openapi(route, SERVICE_PRICING_ROUTES_HANDLER[key as keyof typeof SERVICE_PRICING_ROUTES_HANDLER] as any)
})

export default router

