import express from 'express'
import path from 'path'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { prisma } from './config/prisma'
import authRoutes from './routes/auth.routes'
import { authenticate } from './middlewares/auth.middleware'
import categoryRoutes from './routes/category.routes'
import transactionRoutes from './routes/transaction.routes'
import dashboardRoutes from './routes/dashboard.routes'
import predictionRoutes from './routes/prediction.routes'
import userRoutes from './routes/user.routes'

const app = express()

app.use(
  cors({
    origin: ['http://localhost:3000', 'https://finance-tracker-frontend-sable.vercel.app'],
    credentials: true
  })
)
app.use(express.json())
app.use(cookieParser())

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/categories', categoryRoutes)
app.use('/api/v1/transactions', transactionRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/prediction', predictionRoutes)
app.use('/api/v1/users', userRoutes)

app.get('/', (req, res) => {
  res.send('API is running...')
})

app.get('/test-db', async (req, res) => {
  try {
    const users = await prisma.user.findMany()
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Database error' })
  }
})

app.get('/protected', authenticate, (req, res) => {
  res.json({
    message: 'You are authorized',
    user: (req as any).user
  })
})

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.listen(5000, () => {
  console.log('Server berjalan di port 5000');
});

export default app