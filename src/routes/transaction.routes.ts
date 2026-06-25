import { Router } from 'express'
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} from '../controllers/transaction.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', authenticate, createTransaction)
router.get('/', authenticate, getTransactions)
router.put('/:id', authenticate, updateTransaction)
router.delete('/:id', authenticate, deleteTransaction)

export default router