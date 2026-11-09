import { Response } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import Category from '../models/Category'
import Transaction from '../models/Transaction'
import { AuthRequest } from '../middlewares/auth.middleware'

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['income', 'expense']),
  color: z.string().min(1, 'Cor obrigatória'),
})

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  const categoryExists = await Category.findOne({ name: parsed.data.name, user: req.userId })
  if (categoryExists) {
    res.status(400).json({ message: 'Categoria já existe' })
    return
  }

  const category = await Category.create({ ...parsed.data, user: req.userId })
  res.status(201).json(category)
}

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  const categories = await Category.find({ user: req.userId }).sort({ name: 1 })
  res.status(200).json(categories)
}

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    parsed.data,
    { new: true }
  )

  if (!category) {
    res.status(404).json({ message: 'Categoria não encontrada' })
    return
  }

  res.status(200).json(category)
}

/**
 * Toda transação precisa de categoria. Se a categoria estiver em uso, é preciso
 * informar ?moveTo=<id> com outra categoria do mesmo tipo para receber as transações.
 */
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const category = await Category.findOne({ _id: req.params.id, user: req.userId })
  if (!category) {
    res.status(404).json({ message: 'Categoria não encontrada' })
    return
  }

  const inUse = await Transaction.countDocuments({ category: category._id, user: req.userId })
  const moveTo = typeof req.query.moveTo === 'string' ? req.query.moveTo : ''

  if (inUse > 0) {
    if (!moveTo) {
      res.status(409).json({ message: `Esta categoria tem ${inUse} ${inUse === 1 ? "transação" : "transações"}. Escolha para qual categoria ${inUse === 1 ? "movê-la" : "movê-las"}.`, count: inUse })
      return
    }
    const target = mongoose.isValidObjectId(moveTo)
      ? await Category.findOne({ _id: moveTo, user: req.userId })
      : null
    if (!target || String(target._id) === String(category._id)) {
      res.status(400).json({ message: 'Categoria de destino inválida' })
      return
    }
    if (target.type !== category.type) {
      res.status(400).json({ message: 'A categoria de destino precisa ser do mesmo tipo' })
      return
    }
    await Transaction.updateMany({ category: category._id, user: req.userId }, { category: target._id })
  }

  await category.deleteOne()
  res.status(200).json({ message: 'Categoria deletada com sucesso', moved: inUse })
}
