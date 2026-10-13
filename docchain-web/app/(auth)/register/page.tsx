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

type PasswordStrength = 'weak' | 'medium' | 'strong';

function scorePassword(password: string): PasswordStrength | null {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: 'Senha fraca',
  medium: 'Senha média',
  strong: 'Senha forte',
};

const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  weak: 'bg-destructive',
  medium: 'bg-warning',
  strong: 'bg-success',
};

export default function RegisterPage() {
  const router = useRouter();
  const registerAction = useAuthStore((s) => s.register);
  const loginAction = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const strength = scorePassword(password);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      toast.error('As senhas não conferem.');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Aceite os Termos de Uso pra continuar.');
      return;
    }

    try {
      await registerAction({ email, password, name: name || undefined });
      toast.success('Conta criada. Fazendo login...');
      await loginAction({ email, password });
      router.replace('/dashboard');
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : null;
      if (status === 409) {
        toast.error('Já existe uma conta com este e-mail.');
      } else if (status === 429) {
        toast.error('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        toast.error(extractErrorMessage(err, 'Falha ao criar conta.'));
      }
    }
  };

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Comece a registrar seus documentos em minutos"
      width="w-[460px]"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="mb-1.5 block text-[13px]">
            Nome completo
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="João Silva"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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
          <Label htmlFor="password" className="mb-1.5 block text-[13px]">
            Senha
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {strength && (
            <>
              <div className="mt-2 flex gap-1">
                {['weak', 'medium', 'strong'].map((s, i) => {
                  const active =
                    (strength === 'weak' && i === 0) ||
                    (strength === 'medium' && i <= 1) ||
                    (strength === 'strong' && i <= 2);
                  return (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded ${active ? STRENGTH_COLOR[strength] : 'bg-secondary'}`}
                    />
                  );
                })}
              </div>
              <div
                className={`mt-1.5 text-xs font-medium ${
                  strength === 'weak'
                    ? 'text-destructive'
                    : strength === 'medium'
                      ? 'text-warning'
                      : 'text-success'
                }`}
              >
                {STRENGTH_LABEL[strength]}
              </div>
            </>
          )}
        </div>

        <div>
          <Label htmlFor="password-confirm" className="mb-1.5 block text-[13px]">
            Confirmar senha
          </Label>
          <Input
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5 accent-primary"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <span>
            Li e aceito os{' '}
            <Link href="#" className="text-primary hover:underline">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link href="#" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 text-sm font-semibold"
        >
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        Já tenho conta —{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </div>
    </AuthCard>
  );
}
