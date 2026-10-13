'use client';

import { useDropzone, type FileRejection } from 'react-dropzone';
import { FileText, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';
import { MAX_UPLOAD_BYTES } from '@/lib/upload-steps';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  file: File | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
  onReject: (message: string) => void;
}

function rejectionMessage(rejection: FileRejection): string {
  const code = rejection.errors[0]?.code;
  if (code === 'file-too-large') return 'Arquivo acima de 50 MB.';
  if (code === 'too-many-files') return 'Envie um arquivo por vez.';
  return rejection.errors[0]?.message ?? 'Arquivo inválido.';
}

export function UploadDropzone({
  file,
  disabled,
  onSelect,
  onClear,
  onReject,
}: UploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxSize: MAX_UPLOAD_BYTES,
    disabled,
    onDropAccepted: (files) => onSelect(files[0]),
    onDropRejected: (rejections) => onReject(rejectionMessage(rejections[0])),
  });

  if (file) {
    return (
      <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatBytes(file.size)}
            {file.type ? ` · ${file.type}` : ''}
          </p>
        </div>
        {!disabled && (
          <Button variant="ghost" size="icon" onClick={onClear} aria-label="Remover arquivo">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer rounded-xl border-2 border-dashed border-border bg-card px-5 py-14 text-center transition-colors hover:border-primary',
        isDragActive && 'border-primary bg-primary/5',
      )}
    >
      <input {...getInputProps()} aria-label="Selecionar arquivo" />
      <UploadCloud className="mx-auto mb-4 h-12 w-12 text-primary" strokeWidth={1.5} />
      <p className="mb-1.5 text-base font-medium text-foreground">
        {isDragActive ? 'Solte o arquivo aqui' : 'Arraste seu arquivo aqui ou clique para selecionar'}
      </p>
      <p className="text-[13px] text-muted-foreground">PDF, DOCX, imagens — máximo 50 MB</p>
    </div>
  );
}
