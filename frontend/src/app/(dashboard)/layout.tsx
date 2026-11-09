'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand'
import api from '@/lib/api'
import { useUser } from '@/lib/hooks'

const NAV_ITEMS = [
  { label: 'Painel', href: '/dashboard' },
  { label: 'Transações', href: '/transactions' },
  { label: 'Contas', href: '/accounts' },
  { label: 'Categorias', href: '/categories' },
  { label: 'Relatórios', href: '/reports' },
]

function Nav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex-1 px-3 py-2">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center rounded-md px-3 text-[14px] text-muted-foreground outline-none transition-colors',
                  'hover:bg-accent/70 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  active && 'bg-accent font-semibold text-foreground'
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function UserBlock({ name, onLogout }: { name?: string; onLogout: () => void }) {
  const initials = name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex items-center gap-2.5 border-t px-4 py-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground">
        {initials || '·'}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name ?? ' '}</span>
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onLogout} aria-label="Sair" title="Sair">
        <LogOut />
      </Button>
    </div>
  )
}

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, unauthorized } = useUser()

  useEffect(() => {
    if (unauthorized) router.replace('/login')
  }, [unauthorized, router])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      router.push('/login')
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card md:flex">
        <div className="px-5 pb-4 pt-5">
          <Logo />
        </div>
        <Nav pathname={pathname} />
        <UserBlock name={user?.name} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 z-50 flex w-64 flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <X />
              </Button>
            </div>
            <Nav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <UserBlock name={user?.name} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-2 border-b bg-card px-3 py-2.5 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu />
          </Button>
          <Logo />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
