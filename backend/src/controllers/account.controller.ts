import { Response } from 'express'
import { z } from 'zod'
import Account from '../models/Account'
import { AuthRequest } from '../middlewares/auth.middleware'

const accountSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
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

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const account = await Account.findOneAndDelete({ _id: req.params.id, user: req.userId })

  if (!account) {
    res.status(404).json({ message: 'Conta não encontrada' })
    return
  }

  res.status(200).json({ message: 'Conta deletada com sucesso' })
}