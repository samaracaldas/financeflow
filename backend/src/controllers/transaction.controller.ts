import { Response } from 'express'
import { z } from 'zod'
import Transaction from '../models/Transaction'
import { AuthRequest } from '../middlewares/auth.middleware'

const transactionSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Categoria obrigatória'),
  account: z.string().min(1, 'Conta obrigatória'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data obrigatória'),
})

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = transactionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  const transaction = await Transaction.create({ ...parsed.data, user: req.userId })
  res.status(201).json(transaction)
}

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, category, startDate, endDate } = req.query

  const filters: Record<string, unknown> = { user: req.userId }

  if (type) filters.type = type
  if (category) filters.category = category
  if (startDate || endDate) {
    filters.date = {
      ...(startDate && { $gte: new Date(startDate as string) }),
      ...(endDate && { $lte: new Date(endDate as string) }),
    }
  }

  const transactions = await Transaction.find(filters)
    .populate('category', 'name')
    .populate('account', 'name')
    .sort({ date: -1 })

  res.status(200).json(transactions)
}

export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.userId })
    .populate('category', 'name')
    .populate('account', 'name')

  if (!transaction) {
    res.status(404).json({ message: 'Transação não encontrada' })
    return
  }

  res.status(200).json(transaction)
}

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = transactionSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    parsed.data,
    { new: true }
  )

  if (!transaction) {
    res.status(404).json({ message: 'Transação não encontrada' })
    return
  }

  res.status(200).json(transaction)
}

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId })

  if (!transaction) {
    res.status(404).json({ message: 'Transação não encontrada' })
    return
  }

  res.status(200).json({ message: 'Transação deletada com sucesso' })
}