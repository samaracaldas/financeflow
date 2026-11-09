import crypto from 'crypto'

/**
 * Conta de demonstração ("Entrar como admin") inteiramente em memória.
 * Não depende do MongoDB: o demo do portfolio funciona mesmo com o Atlas fora do ar.
 * Os dados são de uma confeitaria fictícia, compartilhados entre os visitantes,
 * e voltam ao original quando o servidor reinicia (o Render free dorme após inatividade),
 * a cada 7 dias ou quando alguém apaga quase tudo.
 */

export const DEMO_USER = { id: '64656d6f0000000000000001', name: 'Admin', email: 'admin@demo.financesflow.app' }

const RESET_AFTER_MS = 7 * 24 * 60 * 60 * 1000
const MIN_TRANSACTIONS = 40
export const MAX_TRANSACTIONS = 1000

export interface DemoAccount { _id: string; name: string; type: 'cash' | 'bank' | 'card' | 'other'; color: string; initialBalance: number; user: string; createdAt: string; updatedAt: string }
export interface DemoCategory { _id: string; name: string; type: 'income' | 'expense'; color: string; user: string; createdAt: string; updatedAt: string }
export interface DemoTransaction {
  _id: string; title: string; amount: number; type: 'income' | 'expense'
  category: string; account?: string; description?: string; date: string
  user: string; createdAt: string; updatedAt: string
}

interface State { seededAt: number; accounts: DemoAccount[]; categories: DemoCategory[]; transactions: DemoTransaction[] }

let state: State | null = null

export const newId = () => crypto.randomBytes(12).toString('hex')
const stamp = () => new Date().toISOString()

function random(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function seed(): State {
  const now = stamp()
  const mk = <T extends object>(data: T) => ({ _id: newId(), ...data, user: DEMO_USER.id, createdAt: now, updatedAt: now })

  const acc = {
    pj: mk({ name: 'Conta PJ', type: 'bank' as const, color: '#3a6db3', initialBalance: 8200 }),
    caixa: mk({ name: 'Caixa da loja', type: 'cash' as const, color: '#1d7a46', initialBalance: 450 }),
    cartao: mk({ name: 'Cartão PJ', type: 'card' as const, color: '#8a63a8', initialBalance: 0 }),
  }
  const cat = {
    balcao: mk({ name: 'Vendas no balcão', type: 'income' as const, color: '#1d7a46' }),
    encomendas: mk({ name: 'Encomendas', type: 'income' as const, color: '#a88a3c' }),
    delivery: mk({ name: 'Delivery', type: 'income' as const, color: '#c0463b' }),
    insumos: mk({ name: 'Insumos', type: 'expense' as const, color: '#c4703a' }),
    aluguel: mk({ name: 'Aluguel', type: 'expense' as const, color: '#8a63a8' }),
    folha: mk({ name: 'Folha', type: 'expense' as const, color: '#3a6db3' }),
    energia: mk({ name: 'Energia e água', type: 'expense' as const, color: '#e0a12c' }),
    embalagens: mk({ name: 'Embalagens', type: 'expense' as const, color: '#8b939b' }),
    marketing: mk({ name: 'Marketing', type: 'expense' as const, color: '#4f7194' }),
  }

  const rnd = random(42)
  const today = new Date()
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const txs: DemoTransaction[] = []

  for (let back = 11; back >= 0; back--) {
    const y = today.getUTCFullYear()
    const m = today.getUTCMonth() - back
    const growth = 1 + (11 - back) * 0.025
    const add = (d: number, title: string, amount: number, c: keyof typeof cat, a: keyof typeof acc, description?: string) => {
      const date = new Date(Date.UTC(y, m, d))
      if (date.getTime() > end) return
      txs.push(mk({ title, amount, type: cat[c].type, category: cat[c]._id, account: acc[a]._id, description, date: date.toISOString() }))
    }

    for (let d = 1; d <= 28; d += 3) {
      add(d, 'Vendas do balcão', Math.round((900 + rnd() * 700) * growth), 'balcao', d === 16 ? 'caixa' : 'pj', d === 16 ? 'Dinheiro do caixa' : 'Pix e maquininha')
    }
    add(2, 'Bolo de casamento (encomenda)', Math.round(800 + rnd() * 1600), 'encomendas', 'pj', 'Sinal de 50% pago na reserva')
    add(5, 'Repasse do delivery', Math.round((2100 + rnd() * 900) * growth), 'delivery', 'pj')
    add(3, 'Farinha, ovos e manteiga', Math.round((2600 + rnd() * 900) * growth), 'insumos', 'pj')
    add(7, 'Chocolate e frutas', Math.round(700 + rnd() * 500), 'insumos', 'cartao')
    add(10, 'Aluguel do ponto', 3200, 'aluguel', 'pj')
    add(12, 'Conta de luz', Math.round(650 + rnd() * 300), 'energia', 'pj')
    add(28, 'Salários', 6400, 'folha', 'pj')
    if (m % 2 === 0) add(6, 'Caixas e fitas', Math.round(300 + rnd() * 250), 'embalagens', 'cartao')
    if (m % 3 === 0) add(8, 'Anúncio no Instagram', 250, 'marketing', 'cartao')
  }

  // O app não tem transferências: o saldo inicial do cartão cobre as faturas do ano
  acc.cartao.initialBalance = txs.filter((t) => t.account === acc.cartao._id).reduce((s, t) => s + t.amount, 0) + 1850

  return { seededAt: Date.now(), accounts: Object.values(acc), categories: Object.values(cat), transactions: txs }
}

/** Devolve o estado atual, recriando os dados se estiverem velhos ou quase vazios. */
export function demoState(): State {
  if (!state || Date.now() - state.seededAt > RESET_AFTER_MS || state.transactions.length < MIN_TRANSACTIONS) {
    state = seed()
  }
  return state
}

export const touch = <T extends { updatedAt: string }>(doc: T) => { doc.updatedAt = stamp(); return doc }
export const now = stamp
