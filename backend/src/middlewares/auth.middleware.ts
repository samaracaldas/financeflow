import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies.token

    if (!token) {
      res.status(401).json({ message: 'Não autorizado' })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string }
    req.userId = decoded.id

    next()
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' })
  }
}