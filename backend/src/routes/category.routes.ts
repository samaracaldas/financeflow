import { Router } from 'express'
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.post('/', createCategory)
router.get('/', getCategories)
router.put('/:id', updateCategory)
router.delete('/:id', deleteCategory)

export default router