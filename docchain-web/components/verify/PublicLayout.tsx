import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
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
      <PublicFooter />
    </div>
  );
}
