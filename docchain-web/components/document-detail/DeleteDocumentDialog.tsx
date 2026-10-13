'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api';
import { deleteDocument } from '@/lib/documents';

interface DeleteDocumentDialogProps {
  documentId: string;
  fileName: string;
  onDeleted: () => void;
}

export function DeleteDocumentDialog({ documentId, fileName, onDeleted }: DeleteDocumentDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const onConfirm = async () => {
    setDeleting(true);
    try {
      await deleteDocument(documentId);
      toast.success('Documento excluído');
      onDeleted();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Falha ao excluir documento.'));
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Excluir documento
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {fileName}?</AlertDialogTitle>
          <AlertDialogDescription>
            O arquivo cifrado será apagado e o documento sai do seu dashboard. O registro na
            blockchain é imutável e permanece — a verificação pública continua encontrando este
            hash.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
