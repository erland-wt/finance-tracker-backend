import { Router } from 'express'
import { getPrediction } from '../controllers/prediction.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, getPrediction)

export default router