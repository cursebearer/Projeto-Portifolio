import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/verify" className="flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight text-primary">DocChain</span>
        </Link>
        <nav className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Criar conta</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-foreground">Verificação Pública de Documentos</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Confirme a autenticidade de qualquer documento registrado no DocChain consultando
            diretamente a blockchain Sepolia. Sem necessidade de cadastro.
          </p>
        </div>
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>

      <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        DocChain · Open Source · Rodando em Sepolia Testnet
      </footer>
    </div>
  );
}
