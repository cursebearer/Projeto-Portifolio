'use client';

import Link from 'next/link';
import { Copy, FileText, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/documents/StatusBadge';
import type { DocumentDto } from '@/types/document';

function truncateHash(hash: string): string {
  const clean = hash.startsWith('0x') ? hash : `0x${hash}`;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

function formatRelative(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'agora mesmo';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `há ${diffDays} dias`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `há ${diffWeeks} sem`;
  return new Date(date).toLocaleDateString('pt-BR');
}

async function copyToClipboard(text: string, label = 'Hash') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error('Não foi possível copiar');
  }
}

export function DocumentTable({ documents }: { documents: DocumentDto[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">
          Nenhum documento encontrado. Faça upload do primeiro pra começar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary hover:bg-secondary">
            <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Nome do arquivo
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Hash (SHA-256)
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Data
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} className="hover:bg-secondary/60">
              <TableCell>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center gap-3 hover:text-primary"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{doc.fileName}</span>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  {truncateHash(doc.hash)}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`0x${doc.hash}`)}
                    className="rounded p-1 text-muted-foreground/70 hover:bg-secondary hover:text-foreground"
                    title="Copiar hash"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={doc.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatRelative(doc.uploadedAt)}
              </TableCell>
              <TableCell>
                <Link
                  href={`/documents/${doc.id}`}
                  className="inline-flex rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="Ver detalhes"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
