import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

// UPDATE PROFILE
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({
        message: 'Name and email are required'
      })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        message: 'Email already in use by another account'
      })
    }

    let updateData: any = { name, email }

    if (req.file) {
      updateData.avatarURL = req.file.path
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarURL: true
      }
    })

    return res.status(200).json({
      message: 'Profile updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}