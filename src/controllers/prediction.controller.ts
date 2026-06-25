import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

export const getPrediction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // Ambil semua transaksi 3 bulan terakhir
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: threeMonthsAgo }
      }
    })

    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach((trx) => {
      if (trx.type === 'INCOME') totalIncome += Number(trx.amount)
      if (trx.type === 'EXPENSE') totalExpense += Number(trx.amount)
    })

    const avgIncome = totalIncome / 3
    const avgExpense = totalExpense / 3

    let healthStatus = 'Aman'
    let insightMessage = 'Keuanganmu dalam kondisi baik. Pemasukan lebih besar dari pengeluaran, pertahankan!'
    let colorCode = 'green'

    if (avgIncome > 0) {
      const ratio = avgExpense / avgIncome
      if (ratio >= 0.8) {
        healthStatus = 'Bahaya'
        insightMessage = 'Awas! Rata-rata pengeluaranmu mencapai lebih dari 80% pemasukan. Kamu harus mulai berhemat dan memotong pengeluaran yang tidak perlu.'
        colorCode = 'red'
      } else if (ratio >= 0.6) {
        healthStatus = 'Waspada'
        insightMessage = 'Pengeluaranmu lumayan besar (lebih dari 60% pemasukan). Hati-hati agar tidak melebihi batas aman bulan ini.'
        colorCode = 'yellow'
      }
    } else if (avgExpense > 0) {
      healthStatus = 'Kritis'
      insightMessage = 'Tidak ada pemasukan yang tercatat dalam 3 bulan terakhir, namun pengeluaran terus berjalan. Segera evaluasi keuanganmu!'
      colorCode = 'red'
    } else {
      healthStatus = 'Belum Ada Data'
      insightMessage = 'Belum ada data transaksi yang cukup untuk dianalisis dalam 3 bulan terakhir.'
      colorCode = 'gray'
    }

    res.json({
      message: 'Prediction generated',
      data: {
        averageIncome: avgIncome,
        averageExpense: avgExpense,
        healthStatus,
        insightMessage,
        colorCode
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}