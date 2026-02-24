'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Informe seu nome.')
          return
        }
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.')
          return
        }
        await api.post('/auth/register', { name, email, password })
      } else {
        await api.post('/auth/login', { email, password })
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data: { message: string } } }
        setError(axiosError.response.data.message)
      } else {
        setError('Erro ao autenticar')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-foreground/15">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-primary-foreground tracking-tight">
            FinanceFlow
          </span>
        </div>

        <div className="flex flex-col gap-6 max-w-md">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight text-balance">
            Gestão financeira simples para seu negócio
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Controle entradas e saídas, categorize transações e acompanhe o fluxo de caixa da sua empresa em um só lugar.
          </p>

          <div className="flex flex-col gap-4 pt-4">
            {[
              'Registre receitas e despesas rapidamente',
              'Categorize e organize suas transações',
              'Visualize gráficos e resumos financeiros',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-foreground/15">
                  <span className="text-sm font-semibold text-primary-foreground">{i + 1}</span>
                </div>
                <span className="text-primary-foreground/90 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-foreground/50 text-xs">
          FinanceFlow &mdash; Feito para pequenos negócios
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm flex flex-col gap-8">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">FinanceFlow</span>
          </div>

          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Entre com suas credenciais para acessar o painel.'
                : 'Preencha os dados abaixo para começar.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {mode === 'register' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="h-11"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="h-11 font-medium" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-muted-foreground">
              {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </span>
            <button
              type="button"
              onClick={switchMode}
              className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              {mode === 'login' ? 'Criar conta' : 'Fazer login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}