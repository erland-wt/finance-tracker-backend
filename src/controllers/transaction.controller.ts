import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

// CREATE
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, categoryId, date, note } = req.body
    const userId = (req as any).user.userId
    const numericAmount = Number(amount)

    if (amount === undefined || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Amount must be a number greater than 0'
      })
    }

    if (!amount || !categoryId || !date) {
      return res.status(400).json({
        message: 'Required fields missing'
      })
    }

    // cek category milik user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId
      }
    })

    if (!category) {
      return res.status(404).json({
        message: 'Category not found'
      })
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: numericAmount,
        type: category.type,
        categoryId,
        userId,
        date: date ? new Date(date) : new Date(),
        note
      }
    })

    res.status(201).json({
      message: 'Transaction created',
      data: transaction
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// GET
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const { month, year } = req.query

    let filter: any = { userId }

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1)
      const end = new Date(Number(year), Number(month), 0)

      filter.date = {
        gte: start,
        lte: end
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: filter,
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    res.json({
      message: 'Transactions retrieved',
      data: transactions
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// UPDATE
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = (req as any).user.userId
    const { amount, categoryId, date, note } = req.body || {}

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existing) {
      return res.status(404).json({
        message: 'Transaction not found'
      })
    }

    const data: any = {}

    if (amount !== undefined) {
      const numericAmount = Number(amount)

      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          message: 'Amount must be greater than 0'
        })
      }

      data.amount = numericAmount
    }

    if (categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId
        }
      })

      if (!category) {
        return res.status(404).json({
          message: 'Category not found'
        })
      }

      data.categoryId = categoryId
      data.type = category.type
    }
    if (date !== undefined) data.date = new Date(date)
    if (note !== undefined) data.note = note

    const updated = await prisma.transaction.update({
      where: { id },
      data
    })

    res.json({
      message: 'Transaction updated',
      data: updated
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// DELETE
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = (req as any).user.userId

    const result = await prisma.transaction.deleteMany({
      where: {
        id,
        userId
      }
    })

    if (result.count === 0) {
      return res.status(404).json({
        message: 'Transaction not found'
      })
    }

    res.json({
      message: 'Transaction deleted'
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}