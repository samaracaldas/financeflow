import { Router } from 'express'
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
} from '../controllers/account.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.post('/', createAccount)
router.get('/', getAccounts)
router.put('/:id', updateAccount)
router.delete('/:id', deleteAccount)

export default router