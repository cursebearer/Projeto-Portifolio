'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LayoutDashboard, LogOut, Menu, ShieldCheck, Upload, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Novo upload', icon: Upload },
  { href: '/verify', label: 'Verificar', icon: ShieldCheck },
];

function initials(name: string | null, email: string): string {
  const src = (name ?? email).trim();
  const parts = src.split(/\s+|@/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <ShieldCheck className="h-7 w-7 text-primary" />
      <span className="text-lg font-bold tracking-tight text-primary">DocChain</span>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === '/dashboard' && pathname.startsWith('/documents')) ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'mb-1 flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      void fetchMe();
    }
  }, [isHydrated, fetchMe]);

  const onLogout = async () => {
    try {
      await logout();
      toast.success('Sessão encerrada');
      router.replace('/login');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Falha ao encerrar sessão'));
    }
  };

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-border bg-card px-4 py-6 md:flex md:flex-col">
        <div className="mb-4 border-b border-border px-2 pb-6">
          <Logo />
        </div>
        <NavLinks pathname={pathname} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card px-4 py-6">
            <div className="mb-4 flex items-center justify-between border-b border-border px-2 pb-6">
              <Logo />
              <button
                type="button"
                aria-label="Fechar menu"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 md:justify-end md:px-8 md:py-3.5">
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              aria-label="Abrir menu"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Logo />
          </div>
          {user && (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium text-foreground">{user.name ?? user.email}</div>
                  {user.name && <div className="text-xs text-muted-foreground">{user.email}</div>}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials(user.name, user.email)}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sair"
                aria-label="Sair"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          )}
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
