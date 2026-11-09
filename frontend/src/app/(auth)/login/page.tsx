'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorNote } from '@/components/brand'
import api, { getErrorMessage } from '@/lib/api'

const SLOW_REQUEST_MS = 4000

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<'form' | 'demo' | null>(null)
  const [isSlow, setIsSlow] = useState(false)
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Acorda a API (Render free) assim que a tela abre, antes de a pessoa terminar de digitar.
  useEffect(() => {
    api.get('/health', { timeout: 90_000 }).catch(() => {})
  }, [])

  const authenticate = async (kind: 'form' | 'demo', request: () => Promise<unknown>, fallback: string) => {
    setError('')
    setLoading(kind)
    slowTimer.current = setTimeout(() => setIsSlow(true), SLOW_REQUEST_MS)
    try {
      await request()
      router.push('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, fallback))
      setLoading(null)
    } finally {
      if (slowTimer.current) clearTimeout(slowTimer.current)
      setIsSlow(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (name.trim().length < 2) return setError('Informe seu nome, com pelo menos 2 letras.')
      if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.')
      return authenticate('form', () => api.post('/auth/register', { name: name.trim(), email, password }), 'Não foi possível criar a conta.')
    }
    return authenticate('form', () => api.post('/auth/login', { email, password }), 'Não foi possível entrar. Confira o e-mail e a senha.')
  }

  const handleDemo = () =>
    authenticate('demo', () => api.post('/auth/demo'), 'Não foi possível abrir a conta de demonstração.')

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setPassword('')
  }

  const isLogin = mode === 'login'

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1">
      {/* Faixa com a gravura da nota de 50 */}
      <aside className="guilloche guilloche-soft flex flex-col justify-between gap-10 bg-note-50 px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-12">
        <span className="flex items-center gap-2.5">
          <span aria-hidden className="size-7 rounded-full border-[1.5px] border-white/80" />
          <span className="text-[17px] font-semibold tracking-tight">FinancesFlow</span>
        </span>
        <div className="hidden max-w-md flex-col gap-4 lg:flex">
          <p className="text-[40px] font-semibold leading-[1.05] tracking-tight">
            Quanto entrou, quanto saiu e onde está o dinheiro do seu negócio.
          </p>
          <p className="text-base leading-relaxed text-white/85">
            Registre vendas e despesas, separe por conta e categoria, e feche o mês com o saldo certo.
          </p>
        </div>
        <p className="hidden text-xs text-white/70 lg:block">Feito para pequenos negócios.</p>
      </aside>

      <main className="flex justify-center px-6 py-10 sm:px-10 lg:items-center">
        <div className="flex w-full max-w-sm flex-col gap-7">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
              {isLogin ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? 'Use o e-mail e a senha da sua conta.' : 'Leva menos de um minuto. Você pode trocar a senha depois.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="h-11 bg-card" required />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@seunegocio.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11 bg-card"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isLogin ? '' : 'Mínimo de 6 caracteres'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="h-11 bg-card pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            <Button type="submit" className="mt-1 h-11 text-[15px]" disabled={loading !== null}>
              {loading === 'form' && <Loader2 className="animate-spin" />}
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>

            {isSlow && (
              <p className="text-center text-xs text-muted-foreground" aria-live="polite">
                O servidor estava parado e está ligando. Isso pode levar até um minuto.
              </p>
            )}
          </form>

          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="font-medium text-foreground underline decoration-note-50 decoration-2 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </p>

          {isLogin && (
            <div className="flex flex-col gap-3 border-t pt-6">
              <Button type="button" variant="outline" className="h-11 bg-card text-[15px]" onClick={handleDemo} disabled={loading !== null}>
                {loading === 'demo' ? <Loader2 className="animate-spin" /> : <UserRound />}
                Entrar como admin
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Conta de demonstração com um ano de dados de uma confeitaria fictícia. Não precisa de cadastro, e os dados voltam ao original de tempos em tempos.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
