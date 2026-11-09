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

/** Mesmas regras da API real: categoria e conta precisam existir e o tipo precisa bater. */
function checkReferences(refs: { category?: string; account?: string; type?: 'income' | 'expense' }): string | null {
  const { categories, accounts } = demoState()
  if (refs.category !== undefined) {
    const c = categories.find((x) => x._id === refs.category)
    if (!c) return 'Categoria não encontrada'
    if (refs.type && c.type !== refs.type) return 'A categoria não é do mesmo tipo da transação'
  }
  if (refs.account && !accounts.some((x) => x._id === refs.account)) return 'Conta não encontrada'
  return null
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
  const refError = checkReferences(parsed.data)
  if (refError) return void res.status(400).json({ message: refError })
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
  const refError = checkReferences({
    category: parsed.data.category ?? (parsed.data.type ? tx.category : undefined),
    account: parsed.data.account,
    type: parsed.data.type ?? tx.type,
  })
  if (refError) return void res.status(400).json({ message: refError })
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
  labels: { exists: string; notFound: string; deleted: string },
  /** Move ou solta as transações antes de apagar; devolve uma mensagem de erro para recusar. */
  beforeDelete: (doc: T, moveTo: string) => { status: number; body: object } | null
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
    const refusal = beforeDelete(items[index], typeof req.query.moveTo === 'string' ? req.query.moveTo : '')
    if (refusal) return void res.status(refusal.status).json(refusal.body)
    items.splice(index, 1)
    res.json({ message: labels.deleted })
  })
}

crud('/accounts', () => demoState().accounts, accountSchema, {
  exists: 'Conta já existe', notFound: 'Conta não encontrada', deleted: 'Conta deletada com sucesso',
}, (account, moveTo) => {
  const { accounts, transactions } = demoState()
  if (moveTo && (moveTo === account._id || !accounts.some((a) => a._id === moveTo))) {
    return { status: 400, body: { message: 'Conta de destino inválida' } }
  }
  transactions.filter((t) => t.account === account._id).forEach((t) => { t.account = moveTo || undefined })
  return null
})
crud('/categories', () => demoState().categories, categorySchema, {
  exists: 'Categoria já existe', notFound: 'Categoria não encontrada', deleted: 'Categoria deletada com sucesso',
}, (category, moveTo) => {
  const { categories, transactions } = demoState()
  const inUse = transactions.filter((t) => t.category === category._id)
  if (inUse.length === 0) return null
  if (!moveTo) {
    return { status: 409, body: { message: `Esta categoria tem ${inUse.length} ${inUse.length === 1 ? "transação" : "transações"}. Escolha para qual categoria ${inUse.length === 1 ? "movê-la" : "movê-las"}.`, count: inUse.length } }
  }
  const target = categories.find((c) => c._id === moveTo)
  if (!target || target._id === category._id) return { status: 400, body: { message: 'Categoria de destino inválida' } }
  if (target.type !== category.type) return { status: 400, body: { message: 'A categoria de destino precisa ser do mesmo tipo' } }
  inUse.forEach((t) => { t.category = target._id })
  return null
})

export default router
