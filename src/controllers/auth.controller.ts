import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import crypto from 'crypto'

const REMEMBER_TOKEN_DAYS = 30
const REMEMBER_MAX_AGE = REMEMBER_TOKEN_DAYS * 24 * 60 * 60 * 1000

// REGISTER
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword }
        })

        return res.status(201).json({
            message: 'User created successfully',
            data: { id: user.id, name: user.name, email: user.email }
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

// LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, remember } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' })
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1d' })

        if (remember) {
            const raw = crypto.randomBytes(64).toString('hex')
            const hashed = crypto.createHash('sha256').update(raw).digest('hex')
            const expiresAt = new Date(Date.now() + REMEMBER_MAX_AGE)

            // store hashed token
            await prisma.rememberToken.create({
                data: {
                    userId: user.id,
                    tokenHash: hashed,
                    expiresAt
                }
            })

            // set cookie (HttpOnly, Secure in production)
            res.cookie('remember_me', raw, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: REMEMBER_MAX_AGE
            })
        }

        return res.status(200).json({
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

// LOGOUT
export const logout = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization
        let userId: string | null = null

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1]

            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
                    userId = decoded.userId
                } catch {
                    // ignore
                }
            }
        }

        if (!userId && (req as any).user && (req as any).user.userId) {
            userId = (req as any).user.userId
        }

        if (userId) {
            await prisma.rememberToken.deleteMany({ where: { userId } })
        } else {
            res.clearCookie('remember_me')
        }

        return res.status(200).json({ message: 'Logged out' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}