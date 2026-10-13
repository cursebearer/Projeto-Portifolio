'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    try {
      const user = await login({ email, password });
      toast.success(`Bem-vindo, ${user.name ?? user.email}`);
      router.replace('/dashboard');
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : null;
      if (status === 401) {
        toast.error('Credenciais inválidas.');
      } else if (status === 429) {
        toast.error('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        toast.error(extractErrorMessage(err, 'Falha ao entrar.'));
      }
    }
  };

  return (
    <AuthCard title="Entrar" subtitle="Registro documental com prova on-chain">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1.5 block text-[13px]">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <Label htmlFor="password" className="text-[13px]">
              Senha
            </Label>
            <span className="text-xs text-muted-foreground">Mínimo 8 caracteres</span>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="mt-3 w-full py-3 text-sm font-semibold"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Não tenho conta —{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Criar conta
        </Link>
      </div>
    </AuthCard>
  );
}
