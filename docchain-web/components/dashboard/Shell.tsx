'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Novo upload', icon: Upload },
  { href: '/documents', label: 'Documentos', icon: FileText },
  { href: '/verify', label: 'Verificar', icon: ShieldCheck },
];

function initials(name: string | null, email: string): string {
  const src = (name ?? email).trim();
  const parts = src.split(/\s+|@/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

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
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-background">
      <aside className="flex flex-col border-r border-border bg-card px-4 py-6">
        <div className="mb-4 flex items-center gap-2.5 border-b border-border px-2 pb-6">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-primary tracking-tight">
            DocChain
          </span>
        </div>

        <nav className="flex-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-border bg-card px-8 py-3.5">
          {user && (
            <>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {user.name ?? user.email}
                  </div>
                  {user.name && (
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  )}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials(user.name, user.email)}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sair"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
