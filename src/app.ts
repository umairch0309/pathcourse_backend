import doctorRouter from '~/routes/doctor'
import doctorProfileRouter from '~/routes/doctor-profile'
import educationRouter from '~/routes/education'
import filesRouter from '~/routes/files'
import servicePricingRouter from '~/routes/service-pricing'
import router from '~/routes/test'
import userRouter from '~/routes/user'
import userQueryRouter from '~/routes/user-query'
import type { AppOpenAPI } from '~/types'

export function registerRoutes(app: AppOpenAPI) {
  return app
    .route('/test', router)
    .route('/api', userRouter)
    .route('/api', servicePricingRouter)
    .route('/api', userQueryRouter)
    .route('/api', filesRouter)
    .route('/api', doctorRouter)
    .route('/api', educationRouter)
    .route('/api', doctorProfileRouter) // chained router.
}
