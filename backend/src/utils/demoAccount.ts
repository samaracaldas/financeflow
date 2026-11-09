import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User, { IUser } from '../models/User'
import Account from '../models/Account'
import Category from '../models/Category'
import Transaction from '../models/Transaction'

/**
 * Conta de demonstração para quem chega pelo portfolio.
 * Ninguém sabe a senha (é aleatória); só se entra pelo POST /api/auth/demo.
 * Os dados são de uma confeitaria fictícia e são recriados quando ficam velhos
 * (criados há mais de 7 dias, para as datas acompanharem o calendário)
 * ou quando algum visitante apaga quase tudo.
 */
export const DEMO_EMAIL = 'admin@demo.financesflow.app'
const DEMO_NAME = 'Admin'
const STALE_AFTER_DAYS = 7
const MIN_TRANSACTIONS = 40

const ACCOUNTS = [
  { key: 'pj', name: 'Conta PJ', type: 'bank', color: '#3a6db3', initialBalance: 8200 },
  { key: 'caixa', name: 'Caixa da loja', type: 'cash', color: '#1d7a46', initialBalance: 450 },
  { key: 'cartao', name: 'Cartão PJ', type: 'card', color: '#8a63a8', initialBalance: 0 },
] as const

const CATEGORIES = [
  { key: 'balcao', name: 'Vendas no balcão', type: 'income', color: '#1d7a46' },
  { key: 'encomendas', name: 'Encomendas', type: 'income', color: '#a88a3c' },
  { key: 'delivery', name: 'Delivery', type: 'income', color: '#c0463b' },
  { key: 'insumos', name: 'Insumos', type: 'expense', color: '#c4703a' },
  { key: 'aluguel', name: 'Aluguel', type: 'expense', color: '#8a63a8' },
  { key: 'folha', name: 'Folha', type: 'expense', color: '#3a6db3' },
  { key: 'energia', name: 'Energia e água', type: 'expense', color: '#e0a12c' },
  { key: 'embalagens', name: 'Embalagens', type: 'expense', color: '#8b939b' },
  { key: 'marketing', name: 'Marketing', type: 'expense', color: '#4f7194' },
] as const

type CatKey = (typeof CATEGORIES)[number]['key']
type AccKey = (typeof ACCOUNTS)[number]['key']

interface SeedTx {
  title: string
  amount: number
  cat: CatKey
  acc: AccKey
  date: Date
  description?: string
}

/** Gerador pseudoaleatório com semente fixa: os números ficam iguais a cada recriação. */
function random(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function buildTransactions(today: Date): SeedTx[] {
  const rnd = random(42)
  const txs: SeedTx[] = []
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  // 12 meses para trás, terminando hoje
  for (let back = 11; back >= 0; back--) {
    const y = today.getUTCFullYear()
    const m = today.getUTCMonth() - back
    const growth = 1 + (11 - back) * 0.025
    const day = (d: number) => new Date(Date.UTC(y, m, d))
    const push = (tx: SeedTx) => { if (tx.date.getTime() <= end) txs.push(tx) }

    for (let d = 1; d <= 28; d += 3) {
      push({
        title: 'Vendas do balcão',
        amount: Math.round((900 + rnd() * 700) * growth),
        cat: 'balcao',
        acc: d === 16 ? 'caixa' : 'pj',
        date: day(d),
        description: d === 16 ? 'Dinheiro do caixa' : 'Pix e maquininha',
      })
    }
    push({ title: 'Repasse do delivery', amount: Math.round((2100 + rnd() * 900) * growth), cat: 'delivery', acc: 'pj', date: day(5) })
    push({ title: 'Bolo de casamento (encomenda)', amount: Math.round(800 + rnd() * 1600), cat: 'encomendas', acc: 'pj', date: day(2), description: 'Sinal de 50% pago na reserva' })
    push({ title: 'Aluguel do ponto', amount: 3200, cat: 'aluguel', acc: 'pj', date: day(10) })
    push({ title: 'Salários', amount: 6400, cat: 'folha', acc: 'pj', date: day(28) })
    push({ title: 'Farinha, ovos e manteiga', amount: Math.round((2600 + rnd() * 900) * growth), cat: 'insumos', acc: 'pj', date: day(3) })
    push({ title: 'Chocolate e frutas', amount: Math.round(700 + rnd() * 500), cat: 'insumos', acc: 'cartao', date: day(7) })
    push({ title: 'Conta de luz', amount: Math.round(650 + rnd() * 300), cat: 'energia', acc: 'pj', date: day(12) })
    if (m % 2 === 0) push({ title: 'Caixas e fitas', amount: Math.round(300 + rnd() * 250), cat: 'embalagens', acc: 'cartao', date: day(6) })
    if (m % 3 === 0) push({ title: 'Anúncio no Instagram', amount: 250, cat: 'marketing', acc: 'cartao', date: day(8) })
  }
  return txs
}

async function seed(userId: mongoose.Types.ObjectId) {
  await Promise.all([
    Transaction.deleteMany({ user: userId }),
    Account.deleteMany({ user: userId }),
    Category.deleteMany({ user: userId }),
  ])

  const txs = buildTransactions(new Date())
  // O app não tem transferências: o saldo inicial do cartão cobre as faturas do ano
  // e deixa um disponível realista, em vez de um saldo negativo enorme.
  const cardSpend = txs.filter((t) => t.acc === 'cartao').reduce((s, t) => s + t.amount, 0)
  const accounts = await Account.insertMany(ACCOUNTS.map(({ key, ...a }) => ({
    ...a,
    initialBalance: key === 'cartao' ? cardSpend + 1850 : a.initialBalance,
    user: userId,
  })))
  const categories = await Category.insertMany(CATEGORIES.map(({ key: _key, ...c }) => ({ ...c, user: userId })))
  const accId = Object.fromEntries(ACCOUNTS.map((a, i) => [a.key, accounts[i]._id]))
  const cat = Object.fromEntries(CATEGORIES.map((c, i) => [c.key, { id: categories[i]._id, type: c.type }]))

  await Transaction.insertMany(
    txs.map((tx) => ({
      title: tx.title,
      amount: tx.amount,
      type: cat[tx.cat].type,
      category: cat[tx.cat].id,
      account: accId[tx.acc],
      description: tx.description,
      date: tx.date,
      user: userId,
    }))
  )
}

export async function getDemoUser(): Promise<IUser> {
  let user = await User.findOne({ email: DEMO_EMAIL })
  if (!user) {
    const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
    user = await User.create({ name: DEMO_NAME, email: DEMO_EMAIL, password })
  }

  const [count, oldest] = await Promise.all([
    Transaction.countDocuments({ user: user._id }),
    Transaction.findOne({ user: user._id }).sort({ createdAt: 1 }).select('createdAt'),
  ])
  const staleBefore = Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000
  const isStale = !oldest || oldest.createdAt.getTime() < staleBefore

  if (count < MIN_TRANSACTIONS || isStale) await seed(user._id as mongoose.Types.ObjectId)

  return user
}
