'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, Tags,
  Menu, X, Wallet, LogOut, Landmark, User,
  FileBarChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { useUser } from '@/lib/hooks'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Contas', href: '/accounts', icon: Landmark },
  { label: 'Categorias', href: '/categories', icon: Tags },
  { label: 'Relatorios', href: '/reports', icon: FileBarChart },
]

interface SidebarContentProps {
  readonly pathname: string
  readonly onNavigate: (href: string) => void
  readonly onLogout: () => void
  readonly userName?: string
}

function SidebarContent({ pathname, onNavigate, onLogout, userName }: SidebarContentProps) {
  return (
    <>
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <button
                onClick={() => onNavigate(item.href)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-border">
        {userName && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-secondary">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground truncate flex-1">{userName}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">Gestão Financeira Simples</p>
      </div>
    </>
  )
}

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useUser()

  const handleNavigate = (href: string) => {
    router.push(href)
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    await api.post('/auth/logout')
    router.push('/login')
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">FinanceFlow</span>
        </div>
        <SidebarContent
          pathname={pathname}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userName={user?.name}
        />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                  <Wallet className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-foreground tracking-tight">FinanceFlow</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <SidebarContent
              pathname={pathname}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              userName={user?.name}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
              <Wallet className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight">FinanceFlow</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}