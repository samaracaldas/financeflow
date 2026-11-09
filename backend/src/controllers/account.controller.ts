import { Response } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import Account from '../models/Account'
import Transaction from '../models/Transaction'
import { AuthRequest } from '../middlewares/auth.middleware'

export const accountSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['cash', 'bank', 'card', 'other']),
  color: z.string().min(1, 'Cor obrigatória'),
  initialBalance: z.number().default(0),
})

export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = accountSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  const accountExists = await Account.findOne({ name: parsed.data.name, user: req.userId })
  if (accountExists) {
    res.status(400).json({ message: 'Conta já existe' })
    return
  }

  const account = await Account.create({ ...parsed.data, user: req.userId })
  res.status(201).json(account)
}

export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  const accounts = await Account.find({ user: req.userId }).sort({ name: 1 })
  res.status(200).json(accounts)
}

export const updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = accountSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    parsed.data,
    { new: true }
  )

  if (!account) {
    res.status(404).json({ message: 'Conta não encontrada' })
    return
  }

  res.status(200).json(account)
}

/**
 * Conta é opcional na transação. Com ?moveTo=<id> as transações vão para outra conta;
 * sem ele, ficam sem conta (em vez de apontar para um registro apagado).
 */
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const account = await Account.findOne({ _id: req.params.id, user: req.userId })
  if (!account) {
    res.status(404).json({ message: 'Conta não encontrada' })
    return
  }

  const moveTo = typeof req.query.moveTo === 'string' ? req.query.moveTo : ''
  const filter = { account: account._id, user: req.userId }

  if (moveTo) {
    const target = mongoose.isValidObjectId(moveTo)
      ? await Account.findOne({ _id: moveTo, user: req.userId })
      : null
    if (!target || String(target._id) === String(account._id)) {
      res.status(400).json({ message: 'Conta de destino inválida' })
      return
    }
    await Transaction.updateMany(filter, { account: target._id })
  } else {
    await Transaction.updateMany(filter, { $unset: { account: 1 } })
  }

  await account.deleteOne()
  res.status(200).json({ message: 'Conta deletada com sucesso' })
}
