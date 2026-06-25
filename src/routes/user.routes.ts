import { Router } from 'express'
import { updateProfile } from '../controllers/user.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { upload } from '../middlewares/upload.middleware'

const router = Router()

router.put('/profile', authenticate, upload.single('avatar'), updateProfile)

export default router