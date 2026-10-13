import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight text-primary">DocChain</span>
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/verify">Verificar documento</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Entrar</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">Criar conta</Link>
        </Button>
      </nav>
    </header>
  );
}
