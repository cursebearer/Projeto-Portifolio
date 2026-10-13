import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <FileQuestion className="mb-4 h-14 w-14 text-muted-foreground opacity-50" />
      <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        O endereço acessado não existe ou foi removido.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">Ir para o Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/verify">Verificar um documento</Link>
        </Button>
      </div>
    </div>
  );
}
