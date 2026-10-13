'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentTable } from '@/components/documents/DocumentTable';
import { StatCard } from '@/components/documents/StatCard';
import { Pagination } from '@/components/documents/Pagination';
import {
  getDocumentStats,
  listDocuments,
  type DocumentStats,
} from '@/lib/documents';
import { extractErrorMessage } from '@/lib/api';
import type { DocumentDto, DocumentStatus } from '@/types/document';

const PAGE_SIZE = 10;
const STATUS_OPTIONS: Array<{ value: '' | DocumentStatus; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'FAILED', label: 'Falhou' },
];

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'' | DocumentStatus>('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [pageResult, statsResult] = await Promise.all([
          listDocuments({
            page,
            limit: PAGE_SIZE,
            status: statusFilter || undefined,
          }),
          getDocumentStats(),
        ]);
        if (cancelled) return;
        setDocuments(pageResult.items);
        setTotal(pageResult.total);
        setStats(statsResult);
      } catch (err) {
        if (!cancelled) toast.error(extractErrorMessage(err, 'Falha ao carregar documentos.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter]);

  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return documents;
    const needle = search.trim().toLowerCase();
    return documents.filter(
      (doc) =>
        doc.fileName.toLowerCase().includes(needle) ||
        doc.hash.toLowerCase().includes(needle),
    );
  }, [documents, search]);

  const paginationInfo =
    total === 0
      ? ''
      : `Exibindo ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total} documentos`;

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1.5 text-[26px] font-semibold tracking-tight text-foreground">
            Meus Documentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie e verifique documentos registrados na blockchain
          </p>
        </div>
        <Button asChild>
          <Link href="/upload" className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Upload
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total de Documentos"
          value={stats?.total ?? '—'}
        />
        <StatCard
          label="Confirmados on-chain"
          value={stats?.confirmed ?? '—'}
          tone="success"
        />
        <StatCard
          label="Em andamento"
          value={stats?.pending ?? '—'}
          tone="warning"
        />
        <StatCard
          label="Com falha"
          value={stats?.failed ?? '—'}
          tone="danger"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por nome ou hash..."
          className="sm:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setIsLoading(true);
            setPage(1);
            setStatusFilter(e.target.value as '' | DocumentStatus);
          }}
          aria-label="Filtrar por status"
          className="w-full rounded-md sm:max-w-[220px] border border-input bg-secondary px-3.5 py-2.5 text-sm text-foreground outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Carregando documentos...
        </div>
      ) : (
        <>
          {total === 0 && !statusFilter ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
              <p className="font-medium text-foreground">Você ainda não registrou nenhum documento</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Envie um arquivo para gerar a prova de integridade na blockchain.
              </p>
              <Button asChild className="mt-5">
                <Link href="/upload" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Registrar primeiro documento
                </Link>
              </Button>
            </div>
          ) : (
            <DocumentTable documents={filteredDocuments} />
          )}
          {total > PAGE_SIZE && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(next) => {
                setIsLoading(true);
                setPage(next);
              }}
              totalLabel={paginationInfo}
            />
          )}
        </>
      )}
    </div>
  );
}
