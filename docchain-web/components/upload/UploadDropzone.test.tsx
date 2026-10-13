import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UploadDropzone } from './UploadDropzone';
import { MAX_UPLOAD_BYTES } from '@/lib/upload-steps';

function bigFile(): File {
  const file = new File(['x'], 'grande.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES + 1 });
  return file;
}

describe('UploadDropzone', () => {
  it('rejeita arquivo acima de 50 MB', async () => {
    const onSelect = vi.fn();
    const onReject = vi.fn();
    render(<UploadDropzone file={null} onSelect={onSelect} onClear={vi.fn()} onReject={onReject} />);

    fireEvent.change(screen.getByLabelText('Selecionar arquivo'), {
      target: { files: [bigFile()] },
    });

    await waitFor(() => expect(onReject).toHaveBeenCalledWith('Arquivo acima de 50 MB.'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('esconde o botão de remover enquanto está ocupado', () => {
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    render(<UploadDropzone file={file} disabled onSelect={vi.fn()} onClear={vi.fn()} onReject={vi.fn()} />);

    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover arquivo' })).not.toBeInTheDocument();
  });
});
