'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { AxiosError } from 'axios';
import { CheckCircle2, Hash, Loader2, Paperclip, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractErrorMessage } from '@/lib/api';
import { verifyPublic } from '@/lib/documents';
import { formatDateTime, truncateHash, with0x } from '@/lib/format';
import { isValidSha256, sha256Hex } from '@/lib/hash';
import { cn } from '@/lib/utils';
import type { VerifyResult } from '@/types/document';

type Mode = 'file' | 'hash';

type Outcome =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'found'; hash: string; result: VerifyResult }
  | { kind: 'not-found'; hash: string }
  | { kind: 'error'; message: string };

function errorMessage(err: unknown): string {
  const status = err instanceof AxiosError ? err.response?.status : undefined;
  if (status === 429) return 'Muitas verificações em sequência. Aguarde um minuto e tente de novo.';
  if (status === 400) return 'Hash inválido: informe 64 caracteres hexadecimais.';
  return extractErrorMessage(err, 'Falha ao consultar a blockchain.');
}

async function resolveOutcome(hash: string): Promise<Outcome> {
  try {
    const result = await verifyPublic(hash);
    return result.exists ? { kind: 'found', hash, result } : { kind: 'not-found', hash };
  } catch (err) {
    return { kind: 'error', message: errorMessage(err) };
  }
}

function ResultGrid({ hash, result }: { hash: string; result: VerifyResult }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
      <div>
        <p className="text-xs text-muted-foreground">Registrado em</p>
        <p className="mt-0.5 text-sm text-foreground">
          {formatDateTime(new Date(result.timestamp * 1000).toISOString())}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Rede</p>
        <p className="mt-0.5 text-sm text-foreground">Sepolia</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Wallet (servidor)</p>
        <code className="mt-0.5 block font-mono text-sm text-foreground">{truncateHash(result.registeredBy)}</code>
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs text-muted-foreground">Hash</p>
        <code className="mt-0.5 block break-all font-mono text-[13px] text-foreground">{with0x(hash)}</code>
      </div>
    </div>
  );
}

export function PublicVerify({ initialHash = '' }: { initialHash?: string }) {
  const [mode, setMode] = useState<Mode>(initialHash ? 'hash' : 'file');
  const [hashInput, setHashInput] = useState(initialHash);
  const [outcome, setOutcome] = useState<Outcome>(
    isValidSha256(initialHash) ? { kind: 'checking' } : { kind: 'idle' },
  );

  const check = async (hash: string) => {
    setOutcome({ kind: 'checking' });
    setOutcome(await resolveOutcome(hash));
  };

  useEffect(() => {
    if (!isValidSha256(initialHash)) return;
    let cancelled = false;
    void resolveOutcome(initialHash.trim()).then((o) => {
      if (!cancelled) setOutcome(o);
    });
    return () => {
      cancelled = true;
    };
  }, [initialHash]);

  const checking = outcome.kind === 'checking';
  const hashValid = isValidSha256(hashInput);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    disabled: checking,
    onDropAccepted: async (files) => {
      setOutcome({ kind: 'checking' });
      setOutcome(await resolveOutcome(await sha256Hex(files[0])));
    },
  });

  const onSubmitHash = (e: FormEvent) => {
    e.preventDefault();
    if (hashValid) void check(hashInput.trim());
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setOutcome({ kind: 'idle' });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-7">
      <div role="tablist" className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
        {(
          [
            { value: 'file', label: 'Enviar arquivo', icon: Paperclip },
            { value: 'hash', label: 'Colar hash SHA-256', icon: Hash },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => switchMode(tab.value)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              mode === tab.value ? 'bg-card text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <div
          {...getRootProps()}
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed border-border px-4 py-10 text-center transition-colors hover:border-primary',
            isDragActive && 'border-primary bg-primary/5',
            checking && 'cursor-wait opacity-60',
          )}
        >
          <input {...getInputProps()} aria-label="Arquivo para verificar" />
          <Paperclip className="mx-auto mb-3 h-8 w-8 text-primary" />
          <p className="text-sm font-medium text-foreground">Arraste o documento aqui ou clique para selecionar</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A impressão digital (SHA-256) é calculada no seu navegador — o arquivo não é enviado.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmitHash}>
          <Label htmlFor="hash" className="mb-1.5 block text-[13px]">
            Hash SHA-256
          </Label>
          <Input
            id="hash"
            className="font-mono text-[13px]"
            placeholder="0x..."
            autoComplete="off"
            spellCheck={false}
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
          />
          {hashInput.trim() !== '' && (
            <p className={cn('mt-1.5 text-xs', hashValid ? 'text-success' : 'text-destructive')}>
              {hashValid ? 'Formato válido (64 caracteres hexadecimais)' : 'Formato inválido: são 64 caracteres hexadecimais'}
            </p>
          )}
          <Button type="submit" className="mt-4 w-full py-5" disabled={!hashValid || checking}>
            Verificar autenticidade
          </Button>
        </form>
      )}

      {checking && (
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Consultando a blockchain...
        </p>
      )}

      {outcome.kind === 'found' && (
        <div role="status" className="mt-6 rounded-xl border border-success/40 bg-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <p className="mt-2 text-lg font-semibold text-success">Documento Autêntico</p>
          <p className="text-sm text-muted-foreground">Este hash está registrado na blockchain Sepolia.</p>
          <ResultGrid hash={outcome.hash} result={outcome.result} />
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            Quer registrar seus próprios documentos?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Criar conta gratuita
            </Link>
          </p>
        </div>
      )}

      {(outcome.kind === 'not-found' || outcome.kind === 'error') && (
        <div role="alert" className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-2 text-lg font-semibold text-destructive">
            {outcome.kind === 'not-found' ? 'Documento não encontrado' : 'Não foi possível verificar'}
          </p>
          <p className="text-sm text-muted-foreground">
            {outcome.kind === 'not-found'
              ? 'Nenhum registro na blockchain para este hash. O documento pode ter sido alterado ou nunca foi registrado.'
              : outcome.message}
          </p>
          {outcome.kind === 'not-found' && (
            <code className="mt-3 block break-all font-mono text-xs text-muted-foreground">{with0x(outcome.hash)}</code>
          )}
        </div>
      )}
    </div>
  );
}
