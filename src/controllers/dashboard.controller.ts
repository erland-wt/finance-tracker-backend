import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId

    // total income
    const totalIncome = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'INCOME'
      },
      _sum: {
        amount: true
      }
    })

    // total expense
    const totalExpense = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE'
      },
      _sum: {
        amount: true
      }
    })

    const income = Number(totalIncome._sum.amount || 0)
    const expense = Number(totalExpense._sum.amount || 0)

    const balance = income - expense

        const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    })

    const monthlyMap: any = {}

    transactions.forEach((trx) => {
      const date = new Date(trx.date)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: key,
          income: 0,
          expense: 0
        }
      }

      if (trx.type === 'INCOME') {
        monthlyMap[key].income += Number(trx.amount)
      } else {
        monthlyMap[key].expense += Number(trx.amount)
      }
    })

    const cashflow = Object.values(monthlyMap)

        res.json({
      message: 'Dashboard data retrieved',
      data: {
        totalIncome: income,
        totalExpense: expense,
        balance,
        cashflow
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}