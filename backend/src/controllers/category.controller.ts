import { Response } from 'express'
import { z } from 'zod'
import Category from '../models/Category'
import { AuthRequest } from '../middlewares/auth.middleware'

const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
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

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.userId })

  if (!category) {
    res.status(404).json({ message: 'Categoria não encontrada' })
    return
  }

  res.status(200).json({ message: 'Categoria deletada com sucesso' })
}