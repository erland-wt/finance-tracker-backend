import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../config/prisma'

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const jwtSecret = process.env.JWT_SECRET

      if (!token || !jwtSecret) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const decoded = jwt.verify(token, jwtSecret) as unknown as { userId: string }
      ;(req as any).user = decoded
      return next()
    }

    const rawRemember = (req as any).cookies?.remember_me as string | undefined
    if (rawRemember) {
      const hashed = crypto.createHash('sha256').update(rawRemember).digest('hex')
      const record = await prisma.rememberToken.findUnique({ where: { tokenHash: hashed } })

      if (record && record.expiresAt > new Date()) {
        ;(req as any).user = { userId: record.userId }
        return next()
      } else {
        if (record && record.expiresAt <= new Date()) {
          await prisma.rememberToken.delete({ where: { id: record.id } }).catch(() => {})
        }
        ;(req as any).cookies && (req as any).cookies.remember_me && (res.clearCookie('remember_me'))
        return res.status(401).json({ message: 'Invalid token' })
      }
    }

    return res.status(401).json({ message: 'Unauthorized' })
  } catch (error) {
    console.error(error)
    return res.status(401).json({ message: 'Invalid token' })
  }
}