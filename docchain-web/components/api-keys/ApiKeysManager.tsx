'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Copy, KeyRound, Plus, Trash2, TriangleAlert } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractErrorMessage } from '@/lib/api';
import { MAX_API_KEYS, createApiKey, listApiKeys, revokeApiKey } from '@/lib/api-keys';
import { copyToClipboard } from '@/lib/clipboard';
import { formatDateTime } from '@/lib/format';
import type { ApiKeySummary, CreatedApiKey } from '@/types/api-key';

const NAME_MAX = 60;

function CreateKeyDialog({ disabled, onCreated }: { disabled: boolean; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);

  const close = () => {
    setOpen(false);
    setName('');
    setCreated(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setCreated(await createApiKey(name.trim()));
      onCreated();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Falha ao gerar a chave.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        if (next) setOpen(true);
        else close();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="h-4 w-4" />
          Gerar chave
        </Button>
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Copie sua chave agora</DialogTitle>
              <DialogDescription>
                Por segurança, esta é a única vez que a chave completa aparece. Guardamos apenas uma
                impressão digital dela; se perder, revogue e gere outra.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="mb-1 text-xs text-muted-foreground">{created.name}</p>
              <code data-testid="api-key-value" className="block break-all font-mono text-[13px] text-foreground">
                {created.key}
              </code>
            </div>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              Não coloque a chave em código de frontend nem em repositório público.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => void copyToClipboard(created.key, 'Chave')}>
                <Copy className="h-4 w-4" />
                Copiar chave
              </Button>
              <Button onClick={close}>Já copiei</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Gerar chave de API</DialogTitle>
              <DialogDescription>
                Dê um nome que identifique onde a chave será usada, por exemplo &quot;Sistema do
                escritório&quot;.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="api-key-name" className="mb-1.5 block text-[13px]">
                  Nome da chave
                </Label>
                <Input
                  id="api-key-name"
                  required
                  maxLength={NAME_MAX}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving || name.trim() === ''}>
                  {saving ? 'Gerando...' : 'Gerar'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RevokeKeyButton({ apiKey, onRevoked }: { apiKey: ApiKeySummary; onRevoked: () => void }) {
  const [revoking, setRevoking] = useState(false);

  const onConfirm = async () => {
    setRevoking(true);
    try {
      await revokeApiKey(apiKey.id);
      toast.success('Chave revogada');
      onRevoked();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Falha ao revogar a chave.'));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Revogar chave ${apiKey.name}`}
        >
          <Trash2 className="h-4 w-4" />
          Revogar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revogar a chave &quot;{apiKey.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Os sistemas que usam esta chave deixam de ter acesso imediatamente. Os documentos já
            enviados continuam na sua conta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revoking}>Cancelar</AlertDialogCancel>
          <Button
            onClick={() => void onConfirm()}
            disabled={revoking}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {revoking ? 'Revogando...' : 'Revogar chave'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeySummary[] | null>(null);
  // Incrementar recarrega a lista (após gerar ou revogar uma chave).
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await listApiKeys();
        if (!cancelled) setKeys(result);
      } catch (err) {
        if (cancelled) return;
        setKeys([]);
        toast.error(extractErrorMessage(err, 'Falha ao carregar as chaves.'));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const atLimit = (keys?.length ?? 0) >= MAX_API_KEYS;

  return (
    <DetailCard title="Suas chaves">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {keys === null ? 'Carregando...' : `${keys.length} de ${MAX_API_KEYS} chaves ativas.`}
        </p>
        <CreateKeyDialog disabled={keys === null || atLimit} onCreated={reload} />
      </div>

      {keys !== null && keys.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <KeyRound className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Você ainda não tem chaves de API.</p>
        </div>
      )}

      {keys !== null && keys.length > 0 && (
        <ul className="divide-y divide-border">
          {keys.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{k.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{k.prefix}••••••••</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Criada em {formatDateTime(k.createdAt)} ·{' '}
                  {k.lastUsedAt ? `último uso em ${formatDateTime(k.lastUsedAt)}` : 'nunca usada'}
                </p>
              </div>
              <RevokeKeyButton apiKey={k} onRevoked={reload} />
            </li>
          ))}
        </ul>
      )}

      {atLimit && (
        <p className="mt-3 text-xs text-muted-foreground">
          Limite atingido. Revogue uma chave para gerar outra.
        </p>
      )}
    </DetailCard>
  );
}
