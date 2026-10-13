'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { GitBranch, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DetailCard } from '@/components/document-detail/InfoCards';
import { StatusBadge } from '@/components/documents/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { extractErrorMessage } from '@/lib/api';
import { createVersion, getVersions } from '@/lib/documents';
import { formatDateTime } from '@/lib/format';
import { uploadErrorMessage } from '@/lib/upload-steps';
import { cn } from '@/lib/utils';
import type { DocumentDto } from '@/types/document';

function orderedVersions(root: DocumentDto, versions: DocumentDto[]): DocumentDto[] {
  return [root, ...versions].sort(
    (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
  );
}

function NewVersionDialog({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!file) return;
    setSending(true);
    try {
      const created = await createVersion(documentId, file);
      toast.success('Nova versão registrada na blockchain');
      setOpen(false);
      router.push(`/documents/${created.id}`);
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      toast.error(uploadErrorMessage(status, extractErrorMessage(err, 'Falha ao registrar versão.')));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (sending) return;
        setOpen(next);
        if (!next) setFile(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="h-4 w-4" />
          Nova versão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar nova versão</DialogTitle>
          <DialogDescription>
            Use quando o documento mudou (ex.: foi assinado). A nova versão ganha registro on-chain
            próprio e fica ligada a esta.
          </DialogDescription>
        </DialogHeader>
        <UploadDropzone
          file={file}
          disabled={sending}
          onSelect={setFile}
          onClear={() => setFile(null)}
          onReject={(message) => toast.error(message)}
        />
        {sending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Registrando na Sepolia — pode levar ~15 segundos.
          </p>
        )}
        <Button onClick={() => void submit()} disabled={!file || sending}>
          {sending ? 'Registrando...' : 'Registrar versão'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function VersionsCard({ document }: { document: DocumentDto }) {
  const [versions, setVersions] = useState<DocumentDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVersions(document.id)
      .then((timeline) => {
        if (!cancelled) setVersions(orderedVersions(timeline.root, timeline.versions));
      })
      .catch((err) => {
        if (!cancelled) toast.error(extractErrorMessage(err, 'Falha ao carregar versões.'));
      });
    return () => {
      cancelled = true;
    };
  }, [document.id]);

  return (
    <DetailCard title="Versões">
      {versions === null ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <ol className="space-y-1">
          {versions.map((v, i) => {
            const current = v.id === document.id;
            return (
              <li key={v.id}>
                <Link
                  href={`/documents/${v.id}`}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary',
                    current && 'bg-secondary',
                  )}
                >
                  <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground">v{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate', current ? 'font-semibold text-primary' : 'text-foreground')}>
                      {v.fileName}
                    </span>
                    <span className="block text-xs text-muted-foreground">{formatDateTime(v.uploadedAt)}</span>
                  </span>
                  <StatusBadge status={v.status} />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-4">
        <NewVersionDialog documentId={document.id} />
      </div>
    </DetailCard>
  );
}
