'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DetailCard } from '@/components/document-detail/InfoCards';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteMe, exportMe, updateMe } from '@/lib/account';
import { extractErrorMessage } from '@/lib/api';
import { saveBlob } from '@/lib/download';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';
import type { AuthenticatedUser } from '@/types/user';

function ProfileForm({ user }: { user: AuthenticatedUser }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user.name ?? '');
  const [saving, setSaving] = useState(false);
  const unchanged = name.trim() === (user.name ?? '') || name.trim() === '';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setUser(await updateMe(name.trim()));
      toast.success('Nome atualizado');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Falha ao atualizar nome.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="conta-email" className="mb-1.5 block text-[13px]">
          E-mail
        </Label>
        <Input id="conta-email" value={user.email} disabled readOnly />
        <p className="mt-1 text-xs text-muted-foreground">O e-mail identifica a conta e não pode ser alterado.</p>
      </div>
      <div>
        <Label htmlFor="conta-nome" className="mb-1.5 block text-[13px]">
          Nome
        </Label>
        <Input id="conta-nome" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">Conta criada em {formatDateTime(user.createdAt)}</p>
      <Button type="submit" disabled={unchanged || saving}>
        {saving ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}

function DeleteAccountDialog() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await deleteMe(password);
      clearSession();
      toast.success('Conta excluída');
      router.replace('/');
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      toast.error(status === 403 ? 'Senha incorreta.' : extractErrorMessage(err, 'Falha ao excluir conta.'));
      setDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (deleting) return;
        setOpen(next);
        if (!next) setPassword('');
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Excluir minha conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={onSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Seus documentos e arquivos cifrados serão apagados e seus registros de atividade ficarão
              anônimos. As impressões digitais já gravadas na blockchain permanecem — mas deixam de
              estar ligadas a você. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="conta-senha" className="mb-1.5 block text-[13px]">
              Confirme sua senha
            </Label>
            <Input
              id="conta-senha"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="submit"
              disabled={!password || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir conta'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      saveBlob(await exportMe(), `docchain-meus-dados-${date}.json`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Falha ao exportar dados.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus dados e seus direitos pela LGPD.{' '}
          <Link href="/privacidade" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
        </p>
      </div>

      <DetailCard title="Perfil">
        {user ? <ProfileForm key={user.id} user={user} /> : <p className="text-sm text-muted-foreground">Carregando...</p>}
      </DetailCard>

      <DetailCard title="Exportar meus dados">
        <p className="mb-4 text-sm text-muted-foreground">
          Baixe um arquivo JSON com seus dados de cadastro, os metadados de todos os seus documentos
          (inclusive excluídos) e o histórico de compartilhamentos.
        </p>
        <Button variant="outline" onClick={() => void onExport()} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? 'Gerando...' : 'Exportar dados (JSON)'}
        </Button>
      </DetailCard>

      <section className="rounded-xl border border-destructive/40 bg-card p-6">
        <h2 className="mb-2 text-base font-semibold text-destructive">Excluir conta</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Remove sua conta, seus documentos e os arquivos armazenados.
        </p>
        <DeleteAccountDialog />
      </section>
    </div>
  );
}
