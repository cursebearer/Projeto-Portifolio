'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { UploadResult } from '@/components/upload/UploadResult';
import { extractErrorMessage } from '@/lib/api';
import { uploadDocument } from '@/lib/documents';
import { stepStates, uploadErrorMessage, type UploadPhase } from '@/lib/upload-steps';
import type { DocumentDto } from '@/types/document';

type Phase = 'idle' | UploadPhase;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [sendProgress, setSendProgress] = useState(0);
  const [processingStartedAt, setProcessingStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [failedAt, setFailedAt] = useState<number | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentDto | null>(null);

  useEffect(() => {
    if (phase !== 'processing') return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [phase]);

  const isBusy = phase === 'uploading' || phase === 'processing';
  const processingElapsed = phase === 'processing' ? Math.max(0, now - processingStartedAt) : 0;

  const reset = () => {
    setFile(null);
    setPhase('idle');
    setSendProgress(0);
    setFailedAt(undefined);
    setErrorMessage(null);
    setResult(null);
  };

  const submit = async () => {
    if (!file) return;
    setPhase('uploading');
    setSendProgress(0);
    setErrorMessage(null);
    let reachedServer = false;

    try {
      const doc = await uploadDocument(file, (fraction) => {
        setSendProgress(fraction);
        if (fraction >= 1 && !reachedServer) {
          reachedServer = true;
          const t = Date.now();
          setProcessingStartedAt(t);
          setNow(t);
          setPhase('processing');
        }
      });
      setResult(doc);
      setPhase('success');
      toast.success('Documento registrado na blockchain');
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      const message = uploadErrorMessage(status, extractErrorMessage(err, 'Falha ao registrar documento.'));
      const states = stepStates(reachedServer ? 'processing' : 'uploading', Date.now() - processingStartedAt);
      setFailedAt(states.indexOf('active'));
      setErrorMessage(message);
      setPhase('error');
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-[720px]">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Novo Documento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload, hash SHA-256, criptografia AES-256-GCM e registro on-chain
        </p>
      </div>

      {phase === 'success' && result ? (
        <UploadResult document={result} onReset={reset} />
      ) : (
        <div className="space-y-5">
          <UploadDropzone
            file={file}
            disabled={isBusy}
            onSelect={(f) => {
              setFile(f);
              setPhase('idle');
              setErrorMessage(null);
            }}
            onClear={reset}
            onReject={(message) => toast.error(message)}
          />

          {phase === 'idle' && (
            <Button
              className="w-full py-6 text-[15px]"
              disabled={!file}
              onClick={() => void submit()}
            >
              Registrar na Blockchain
            </Button>
          )}

          {phase !== 'idle' && (
            <UploadProgress
              states={stepStates(phase, processingElapsed, failedAt)}
              sendProgress={sendProgress}
            />
          )}

          {phase === 'error' && (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
              <Button variant="outline" onClick={() => void submit()}>
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
