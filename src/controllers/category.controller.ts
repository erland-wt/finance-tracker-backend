import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

// CREATE
export const createCategory = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
        return res.status(400).json({
            message: 'Request body is required'
        })
    }
    
    const { name, type } = req.body
    const userId = (req as any).user.userId

    if (!name || !type) {
      return res.status(400).json({
        message: 'Name and type are required'
      })
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        userId
      }
    })

    return res.status(201).json({
      message: 'Category created',
      data: category
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// GET
export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId

    const categories = await prisma.category.findMany({
      where: { userId }
    })

    res.json({
      message: 'Categories retrieved',
      data: categories
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// UPDATE
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = (req as any).user.userId
    const { name, type } = req.body || {}

    if (!id) {
      return res.status(400).json({
        message: 'Category id is required'
      })
    }

    if (!name && !type) {
      return res.status(400).json({
        message: 'At least one field must be provided'
      })
    }

    const result = await prisma.category.updateMany({
      where: { id, userId },
      data: { name, type }
    })

    if (result.count === 0) {
      return res.status(404).json({
        message: 'Category not found'
      })
    }

    const updatedCategory = await prisma.category.findFirst({
      where: { id, userId }
    })

    res.json({
      message: 'Category updated',
      data: updatedCategory
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// DELETE
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = (req as any).user.userId

    // cek apakah ada transaksi
    const existingTransactions = await prisma.transaction.findFirst({
      where: {
        categoryId: id,
        userId
      }
    })

    if (existingTransactions) {
      return res.status(400).json({
        message: 'Cannot delete category with existing transactions'
      })
    }

    const result = await prisma.category.deleteMany({
      where: {
        id,
        userId
      }
    })

    if (result.count === 0) {
      return res.status(404).json({
        message: 'Category not found'
      })
    }

    res.json({
      message: 'Category deleted'
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}