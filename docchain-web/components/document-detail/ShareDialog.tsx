'use client';

import { useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { extractErrorMessage } from '@/lib/api';
import { shareDocument } from '@/lib/documents';

const MESSAGE_MAX = 500;

function shareErrorMessage(err: unknown): string {
  const status = err instanceof AxiosError ? err.response?.status : undefined;
  if (status === 429) return 'Limite de compartilhamentos atingido. Tente novamente mais tarde.';
  if (status === 503) return 'Falha ao enviar o email. Tente novamente em instantes.';
  return extractErrorMessage(err, 'Falha ao compartilhar documento.');
}

export function ShareDialog({ documentId, disabled }: { documentId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await shareDocument(documentId, { email, message: message.trim() || undefined });
      toast.success(`Documento enviado para ${email}`);
      setOpen(false);
      setEmail('');
      setMessage('');
    } catch (err) {
      toast.error(shareErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !sending && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start" disabled={disabled}>
          <Mail className="h-4 w-4" />
          Compartilhar por email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar documento</DialogTitle>
          <DialogDescription>
            O destinatário recebe o arquivo original e um comprovante em PDF com hash, transação e
            QR code para verificação independente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="share-email" className="mb-1.5 block text-[13px]">
              Email do destinatário
            </Label>
            <Input
              id="share-email"
              type="email"
              required
              placeholder="destinatario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <Label htmlFor="share-message" className="text-[13px]">
                Mensagem (opcional)
              </Label>
              <span className="text-xs text-muted-foreground">
                {message.length}/{MESSAGE_MAX}
              </span>
            </div>
            <Textarea
              id="share-message"
              maxLength={MESSAGE_MAX}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
