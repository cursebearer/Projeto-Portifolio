'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ArrowLeft, Download, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteDocumentDialog } from '@/components/document-detail/DeleteDocumentDialog';
import { DetailCard, MetadataCard, ProofCard } from '@/components/document-detail/InfoCards';
import { RetryCard } from '@/components/document-detail/RetryCard';
import { ShareDialog } from '@/components/document-detail/ShareDialog';
import { VerifyIntegrityCard } from '@/components/document-detail/VerifyIntegrityCard';
import { VersionsCard } from '@/components/document-detail/VersionsCard';
import { StatusBadge } from '@/components/documents/StatusBadge';
import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api';
import { downloadDocument, getDocument } from '@/lib/documents';
import { saveBlob } from '@/lib/download';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';
import type { DocumentDto } from '@/types/document';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'loaded'; document: DocumentDto }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar ao Dashboard
    </Link>
  );
}

function TimelineCard({ document }: { document: DocumentDto }) {
  const events = [
    { label: 'Upload realizado', when: formatDateTime(document.uploadedAt), ok: false },
    document.confirmedAt && {
      label: 'Confirmação on-chain',
      when: `${formatDateTime(document.confirmedAt)}${document.blockNumber ? ` · bloco #${document.blockNumber}` : ''}`,
      ok: true,
    },
  ].filter(Boolean) as Array<{ label: string; when: string; ok: boolean }>;

  return (
    <DetailCard title="Linha do Tempo">
      <ol className="space-y-3">
        {events.map((e) => (
          <li key={e.label} className="flex gap-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${e.ok ? 'bg-success' : 'bg-primary'}`} />
            <div className="text-sm">
              <p className="text-foreground">{e.label}</p>
              <p className="text-xs text-muted-foreground">{e.when}</p>
            </div>
          </li>
        ))}
      </ol>
    </DetailCard>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDocument(id)
      .then((document) => {
        if (!cancelled) setState({ kind: 'loaded', document });
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err instanceof AxiosError ? err.response?.status : undefined;
        setState(
          status === 404 || status === 400
            ? { kind: 'not-found' }
            : { kind: 'error', message: extractErrorMessage(err, 'Falha ao carregar documento.') },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const stale = state.kind === 'loaded' && state.document.id !== id;
  if (state.kind === 'loading' || stale) {
    return (
      <div className="mx-auto max-w-6xl">
        <BackLink />
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Carregando documento...
        </div>
      </div>
    );
  }

  if (state.kind !== 'loaded') {
    return (
      <div className="mx-auto max-w-6xl">
        <BackLink />
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileQuestion className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            {state.kind === 'not-found' ? 'Documento não encontrado.' : state.message}
          </p>
        </div>
      </div>
    );
  }

  const doc = state.document;
  const confirmed = doc.status === 'CONFIRMED';

  const onDownload = async () => {
    setDownloading(true);
    try {
      saveBlob(await downloadDocument(doc.id), doc.fileName);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Falha ao baixar documento.'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 break-all text-2xl font-bold text-foreground">{doc.fileName}</h1>
        <StatusBadge status={doc.status} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <MetadataCard document={doc} ownerName={user?.name ?? user?.email ?? 'Você'} />
          <ProofCard document={doc} />
          {doc.status === 'FAILED' && (
            <RetryCard document={doc} onRetried={(document) => setState({ kind: 'loaded', document })} />
          )}
          {confirmed && <VerifyIntegrityCard expectedHash={doc.hash} />}
        </div>

        <div className="space-y-5">
          <DetailCard title="Ações">
            <div className="space-y-2.5">
              <Button className="w-full justify-start" onClick={() => void onDownload()} disabled={!confirmed || downloading}>
                <Download className="h-4 w-4" />
                {downloading ? 'Baixando...' : 'Baixar original'}
              </Button>
              <ShareDialog documentId={doc.id} disabled={!confirmed} />
              <DeleteDocumentDialog
                documentId={doc.id}
                fileName={doc.fileName}
                onDeleted={() => router.replace('/dashboard')}
              />
            </div>
            {!confirmed && (
              <p className="mt-3 text-xs text-muted-foreground">
                Download e compartilhamento ficam disponíveis após a confirmação on-chain.
              </p>
            )}
          </DetailCard>
          <VersionsCard document={doc} />
          <TimelineCard document={doc} />
        </div>
      </div>
    </div>
  );
}
