import { CookieOptions, Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import User from '../models/User'
import generateToken from '../utils/generateToken'
import { getDemoUser } from '../utils/demoAccount'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

const MOCK_USER = { id: '000000000000000000000001', name: 'Dev User', email: 'dev@mock.com' }
const MOCK_PASSWORD = 'mock123'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Em produção o frontend chama a API pelo proxy do próprio Next.js (/api -> Render),
 * então o cookie é first-party e SameSite=Lax funciona em todos os navegadores.
 * COOKIE_SAMESITE=none só é necessário se o front chamar a API em outro domínio
 * direto (cookie de terceiro, bloqueado por Safari, Firefox e aba anônima do Chrome).
 */
const cookieOptions = (): CookieOptions => {
  const sameSite = (process.env.COOKIE_SAMESITE as CookieOptions['sameSite']) ?? 'lax'
  return {
    httpOnly: true,
    secure: isProduction || sameSite === 'none',
    sameSite,
    path: '/',
  }
}

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 })
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.issues[0].message })
      return
    }

    const { name, email, password } = parsed.data

    const userExists = await User.findOne({ email })
    if (userExists) {
      res.status(400).json({ message: 'Email já cadastrado' })
      return
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({ name, email, password: hashedPassword })

    const token = generateToken(user._id.toString())

    setAuthCookie(res, token)

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  if (process.env.MOCK_AUTH === 'true' && req.body.email === MOCK_USER.email && req.body.password === MOCK_PASSWORD) {
    const token = generateToken(MOCK_USER.id)
    setAuthCookie(res, token)
    res.status(200).json({ user: MOCK_USER })
    return
  }

  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.issues[0].message })
      return
    }

    const { email, password } = parsed.data

    const user = await User.findOne({ email })
    if (!user) {
      res.status(400).json({ message: 'Credenciais inválidas' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(400).json({ message: 'Credenciais inválidas' })
      return
    }

    const token = generateToken(user._id.toString())

    setAuthCookie(res, token)

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' })
  }
}

/** Entra na conta de demonstração (dados de exemplo). Desligue com DEMO_LOGIN=false. */
export const demoLogin = async (_req: Request, res: Response): Promise<void> => {
  if (process.env.DEMO_LOGIN === 'false') {
    res.status(404).json({ message: 'Conta de demonstração desativada' })
    return
  }
  try {
    const user = await getDemoUser()
    setAuthCookie(res, generateToken(String(user._id)))
    res.status(200).json({ user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    console.error('[demo] Falha ao preparar a conta de demonstração:', error)
    res.status(500).json({ message: 'Não foi possível abrir a conta de demonstração agora.' })
  }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', cookieOptions())
  res.status(200).json({ message: 'Logout realizado com sucesso' })
}

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (process.env.MOCK_AUTH === 'true' && req.userId === MOCK_USER.id) {
    res.status(200).json(MOCK_USER)
    return
  }

  const user = await User.findById(req.userId).select('-password')
  if (!user) {
    res.status(404).json({ message: 'Usuário não encontrado' })
    return
  }
  res.status(200).json({ id: user._id, name: user.name, email: user.email })
}