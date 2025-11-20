import userRouter from '~/routes/user'
import servicePricingRouter from '~/routes/service-pricing'
import userQueryRouter from '~/routes/user-query'
import router from '~/routes/test'
import type { AppOpenAPI } from '~/types'

export function registerRoutes(app: AppOpenAPI) {
  return app
    .route('/test', router)
    .route('/api', userRouter)
    .route('/api', servicePricingRouter)
    .route('/api', userQueryRouter) // chained router.
}
