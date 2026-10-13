'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AxiosError } from 'axios';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';
import { uploadDocument } from '@/lib/documents';
import { sameHash, sha256Hex } from '@/lib/hash';
import { MAX_UPLOAD_BYTES, uploadErrorMessage } from '@/lib/upload-steps';
import { cn } from '@/lib/utils';
import type { DocumentDto } from '@/types/document';

interface RetryCardProps {
  document: DocumentDto;
  onRetried: (document: DocumentDto) => void;
}

export function RetryCard({ document, onRetried }: RetryCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retry = async (file: File) => {
    setError(null);
    if (!sameHash(await sha256Hex(file), document.hash)) {
      setError('Este arquivo é diferente do original — a impressão digital não coincide.');
      return;
    }
    setBusy(true);
    try {
      const updated = await uploadDocument(file);
      toast.success('Documento registrado na blockchain');
      onRetried(updated);
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      setError(uploadErrorMessage(status, extractErrorMessage(err, 'Falha ao registrar novamente.')));
    } finally {
      setBusy(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxSize: MAX_UPLOAD_BYTES,
    disabled: busy,
    onDropAccepted: (files) => void retry(files[0]),
    onDropRejected: () => setError('Arquivo acima de 50 MB.'),
  });

  return (
    <section className="rounded-xl border border-warning/40 bg-card p-6">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
        <RotateCcw className="h-4 w-4 text-warning" />
        Tentar registrar novamente
      </h2>
      <p className="mb-3 text-[13px] text-muted-foreground">
        O registro na blockchain falhou e o arquivo cifrado foi descartado. Envie o mesmo arquivo
        para tentar de novo — conferimos a impressão digital antes de enviar.
      </p>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary',
          isDragActive && 'border-primary bg-primary/5',
          busy && 'cursor-wait opacity-60',
        )}
      >
        <input {...getInputProps()} aria-label="Arquivo para reenviar" />
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registrando na Sepolia — pode levar ~15 segundos...
          </>
        ) : (
          'Arraste o arquivo original aqui'
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
