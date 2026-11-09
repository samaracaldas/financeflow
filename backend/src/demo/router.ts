import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { transactionSchema } from '../controllers/transaction.controller'
import { accountSchema } from '../controllers/account.controller'
import { categorySchema } from '../controllers/category.controller'
import {
  DEMO_USER, MAX_TRANSACTIONS, demoState, newId, now, touch,
  DemoAccount, DemoCategory, DemoTransaction,
} from './store'

/**
 * Atende /api/transactions, /api/categories e /api/accounts para a conta de demonstração,
 * com os mesmos formatos e validações da API real. Qualquer outro usuário segue para
 * as rotas normais (MongoDB) via next('router').
 */
const router = Router()

export const isDemoToken = (token?: string): boolean => {
  if (!token || !process.env.JWT_SECRET) return false
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET) as { id: string }
    return id === DEMO_USER.id
  } catch {
    return false
  }
}

router.use((req: Request, _res: Response, next: NextFunction) => {
  if (isDemoToken(req.cookies?.token)) next()
  else next('router')
})

const first = (issues: { message: string }[]) => issues[0]?.message ?? 'Dados inválidos'
const toISODate = (value: string) => new Date(value).toISOString()

const populate = (tx: DemoTransaction) => {
  const { categories, accounts } = demoState()
  const c = categories.find((x) => x._id === tx.category)
  const a = tx.account ? accounts.find((x) => x._id === tx.account) : undefined
  return {
    ...tx,
    category: c ? { _id: c._id, name: c.name, color: c.color, type: c.type } : null,
    account: a ? { _id: a._id, name: a.name, color: a.color, type: a.type } : null,
  }
}

/* ---------- transações ---------- */

router.get('/transactions', (req, res) => {
  const { type, category } = req.query
  const list = demoState().transactions
    .filter((t) => (!type || t.type === type) && (!category || t.category === category))
    .sort((a, b) => b.date.localeCompare(a.date))
  res.json(list.map(populate))
})

router.get('/transactions/:id', (req, res) => {
  const tx = demoState().transactions.find((t) => t._id === req.params.id)
  if (!tx) return void res.status(404).json({ message: 'Transação não encontrada' })
  res.json(populate(tx))
})

router.post('/transactions', (req, res) => {
  const parsed = transactionSchema.safeParse(req.body)
  if (!parsed.success) return void res.status(400).json({ message: first(parsed.error.issues) })
  const state = demoState()
  if (state.transactions.length >= MAX_TRANSACTIONS) {
    return void res.status(400).json({ message: 'A conta de demonstração chegou ao limite de transações.' })
  }
  const stamp = now()
  const tx: DemoTransaction = {
    _id: newId(),
    ...parsed.data,
    account: parsed.data.account || undefined,
    date: toISODate(parsed.data.date),
    user: DEMO_USER.id,
    createdAt: stamp,
    updatedAt: stamp,
  }
  state.transactions.push(tx)
  res.status(201).json(tx)
})

router.put('/transactions/:id', (req, res) => {
  const parsed = transactionSchema.partial().safeParse(req.body)
  if (!parsed.success) return void res.status(400).json({ message: first(parsed.error.issues) })
  const tx = demoState().transactions.find((t) => t._id === req.params.id)
  if (!tx) return void res.status(404).json({ message: 'Transação não encontrada' })
  const { date, account, ...rest } = parsed.data
  Object.assign(tx, rest)
  if (date) tx.date = toISODate(date)
  if (account !== undefined) tx.account = account || undefined
  res.json(touch(tx))
})

router.delete('/transactions/:id', (req, res) => {
  const state = demoState()
  const index = state.transactions.findIndex((t) => t._id === req.params.id)
  if (index === -1) return void res.status(404).json({ message: 'Transação não encontrada' })
  state.transactions.splice(index, 1)
  res.json({ message: 'Transação deletada com sucesso' })
})

/* ---------- contas e categorias (mesma forma) ---------- */

function crud<T extends DemoAccount | DemoCategory>(
  path: string,
  list: () => T[],
  schema: typeof accountSchema | typeof categorySchema,
  labels: { exists: string; notFound: string; deleted: string }
) {
  router.get(path, (_req, res) => {
    res.json([...list()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
  })

  router.post(path, (req, res) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return void res.status(400).json({ message: first(parsed.error.issues) })
    if (list().some((x) => x.name === parsed.data.name)) return void res.status(400).json({ message: labels.exists })
    const stamp = now()
    const doc = { _id: newId(), ...parsed.data, user: DEMO_USER.id, createdAt: stamp, updatedAt: stamp } as T
    list().push(doc)
    res.status(201).json(doc)
  })

  router.put(`${path}/:id`, (req, res) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return void res.status(400).json({ message: first(parsed.error.issues) })
    const doc = list().find((x) => x._id === req.params.id)
    if (!doc) return void res.status(404).json({ message: labels.notFound })
    Object.assign(doc, parsed.data)
    res.json(touch(doc))
  })

  router.delete(`${path}/:id`, (req, res) => {
    const items = list()
    const index = items.findIndex((x) => x._id === req.params.id)
    if (index === -1) return void res.status(404).json({ message: labels.notFound })
    items.splice(index, 1)
    res.json({ message: labels.deleted })
  })
}

crud('/accounts', () => demoState().accounts, accountSchema, {
  exists: 'Conta já existe', notFound: 'Conta não encontrada', deleted: 'Conta deletada com sucesso',
})
crud('/categories', () => demoState().categories, categorySchema, {
  exists: 'Categoria já existe', notFound: 'Categoria não encontrada', deleted: 'Categoria deletada com sucesso',
})

export default router
