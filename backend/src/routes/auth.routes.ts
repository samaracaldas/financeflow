import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, demoLogin, logout, getMe } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

const message = { message: 'Muitas tentativas. Espere alguns minutos e tente de novo.' }

// Por e-mail: atrás do proxy da Vercel muitos usuários podem chegar com o mesmo IP,
// então limitar só por IP bloquearia todo mundo junto. Por e-mail protege cada conta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.body?.email ?? '').trim().toLowerCase() || req.ip || 'anon',
  message,
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message,
})

router.post('/register', registerLimiter, register)
router.post('/login', loginLimiter, login)
router.post('/demo', demoLogin)
router.post('/logout', logout)
router.get('/me', authMiddleware, getMe)

export default router