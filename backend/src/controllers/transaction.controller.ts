import { Response } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import Transaction from '../models/Transaction'
import Category from '../models/Category'
import Account from '../models/Account'
import { AuthRequest } from '../middlewares/auth.middleware'

export const transactionSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Categoria obrigatória'),
  account: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  date: z.string().min(1, 'Data obrigatória'),
})

/**
 * Garante que categoria e conta existem e pertencem ao usuário logado.
 * Sem isso, um ID de outro usuário seria aceito e o populate devolveria os dados dele.
 * Também confere se o tipo da categoria bate com o tipo da transação.
 */
async function checkReferences(
  userId: string | undefined,
  refs: { category?: string; account?: string; type?: 'income' | 'expense' }
): Promise<string | null> {
  const isId = (id: string) => mongoose.isValidObjectId(id)

  if (refs.category !== undefined) {
    if (!isId(refs.category)) return 'Categoria inválida'
    const category = await Category.findOne({ _id: refs.category, user: userId }).select('type')
    if (!category) return 'Categoria não encontrada'
    if (refs.type && category.type !== refs.type) return 'A categoria não é do mesmo tipo da transação'
  }

  if (refs.account) {
    if (!isId(refs.account)) return 'Conta inválida'
    const account = await Account.exists({ _id: refs.account, user: userId })
    if (!account) return 'Conta não encontrada'
  }

  return null
}

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = transactionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  const refError = await checkReferences(req.userId, parsed.data)
  if (refError) {
    res.status(400).json({ message: refError })
    return
  }

  const transaction = await Transaction.create({ ...parsed.data, account: parsed.data.account || undefined, user: req.userId })
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
    .populate('category', 'name color type')
    .populate('account', 'name color type')
    .sort({ date: -1 })

  res.status(200).json(transactions)
}

export const getTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.userId })
    .populate('category', 'name color type')
    .populate('account', 'name color type')

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

  const current = await Transaction.findOne({ _id: req.params.id, user: req.userId }).select('type category')
  if (!current) {
    res.status(404).json({ message: 'Transação não encontrada' })
    return
  }

  const refError = await checkReferences(req.userId, {
    category: parsed.data.category ?? (parsed.data.type ? String(current.category) : undefined),
    account: parsed.data.account,
    type: parsed.data.type ?? current.type,
  })
  if (refError) {
    res.status(400).json({ message: refError })
    return
  }

  const { account, ...rest } = parsed.data
  const update = account === '' ? { ...rest, $unset: { account: 1 } } : parsed.data
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    update,
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