'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <AlertTriangle className="mb-4 h-14 w-14 text-warning" />
      <h1 className="text-2xl font-bold text-foreground">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Ocorreu um erro inesperado ao carregar esta página.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>Tentar novamente</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Ir para o Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
