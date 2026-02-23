import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import User from '../models/User'
import generateToken from '../utils/generateToken'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
    })

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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

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

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token')
  res.status(200).json({ message: 'Logout realizado com sucesso' })
}