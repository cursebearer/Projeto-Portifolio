'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle2, Loader2, Paperclip, XCircle } from 'lucide-react';
import { DetailCard } from '@/components/document-detail/InfoCards';
import { extractErrorMessage } from '@/lib/api';
import { verifyPrivate } from '@/lib/documents';
import { sameHash, sha256Hex } from '@/lib/hash';
import { cn } from '@/lib/utils';

type Result =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'authentic' }
  | { kind: 'mismatch'; computed: string }
  | { kind: 'not-on-chain' }
  | { kind: 'error'; message: string };

export function VerifyIntegrityCard({ expectedHash }: { expectedHash: string }) {
  const [result, setResult] = useState<Result>({ kind: 'idle' });

  const verify = async (file: File) => {
    setResult({ kind: 'checking' });
    try {
      const computed = await sha256Hex(file);
      if (!sameHash(computed, expectedHash)) {
        setResult({ kind: 'mismatch', computed });
        return;
      }
      const onChain = await verifyPrivate({ hash: computed });
      setResult(onChain.exists ? { kind: 'authentic' } : { kind: 'not-on-chain' });
    } catch (err) {
      setResult({ kind: 'error', message: extractErrorMessage(err, 'Falha ao verificar.') });
    }
  };

  const checking = result.kind === 'checking';
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    disabled: checking,
    onDropAccepted: (files) => void verify(files[0]),
  });

  return (
    <DetailCard title="Verificar Integridade">
      <p className="mb-3 text-[13px] text-muted-foreground">
        Reenvie o arquivo para confirmar que o hash bate com o registro on-chain. O hash é
        calculado no seu navegador — o arquivo não é enviado.
      </p>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary',
          isDragActive && 'border-primary bg-primary/5',
          checking && 'cursor-wait opacity-60',
        )}
      >
        <input {...getInputProps()} aria-label="Arquivo para verificar" />
        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {checking ? 'Verificando...' : 'Arraste o arquivo aqui para verificar'}
      </div>

      {result.kind === 'authentic' && (
        <div role="status" className="mt-4 flex items-start gap-3 rounded-lg border border-success/40 bg-success/10 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <div className="text-sm">
            <p className="font-semibold text-success">Documento autêntico</p>
            <p className="text-muted-foreground">Hash do arquivo coincide com o registrado on-chain.</p>
          </div>
        </div>
      )}

      {(result.kind === 'mismatch' || result.kind === 'not-on-chain' || result.kind === 'error') && (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <XCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-destructive">
              {result.kind === 'error' ? 'Não foi possível verificar' : 'Falha na verificação'}
            </p>
            {result.kind === 'mismatch' && (
              <>
                <p className="text-muted-foreground">O arquivo é diferente do registrado (hash não coincide).</p>
                <code className="mt-1 block break-all font-mono text-xs text-muted-foreground">0x{result.computed}</code>
              </>
            )}
            {result.kind === 'not-on-chain' && (
              <p className="text-muted-foreground">O hash coincide, mas não foi encontrado na blockchain.</p>
            )}
            {result.kind === 'error' && <p className="text-muted-foreground">{result.message}</p>}
          </div>
        </div>
      )}
    </DetailCard>
  );
}
