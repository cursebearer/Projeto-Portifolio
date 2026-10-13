export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export type StepState = 'done' | 'active' | 'pending' | 'error';

export interface UploadStep {
  key: 'send' | 'hash' | 'encrypt' | 'register' | 'confirm';
  title: string;
}

export const UPLOAD_STEPS: UploadStep[] = [
  { key: 'send', title: 'Enviando arquivo' },
  { key: 'hash', title: 'Calculando hash SHA-256' },
  { key: 'encrypt', title: 'Criptografando (AES-256-GCM) e salvando' },
  { key: 'register', title: 'Registrando na blockchain Sepolia' },
  { key: 'confirm', title: 'Aguardando confirmação do bloco' },
];

// POST /documents só responde após confirmar on-chain; etapas do servidor avançam por tempo estimado.
const SERVER_STEP_THRESHOLDS_MS = [0, 800, 2000, 6000];

export type UploadPhase = 'uploading' | 'processing' | 'success' | 'error';

export function stepStates(
  phase: UploadPhase,
  processingElapsedMs: number,
  failedAt?: number,
): StepState[] {
  if (phase === 'success') return UPLOAD_STEPS.map(() => 'done');

  let activeIndex: number;
  if (phase === 'uploading') {
    activeIndex = 0;
  } else {
    let serverIndex = 0;
    SERVER_STEP_THRESHOLDS_MS.forEach((threshold, i) => {
      if (processingElapsedMs >= threshold) serverIndex = i;
    });
    activeIndex = 1 + serverIndex;
  }

  if (phase === 'error') activeIndex = failedAt ?? activeIndex;

  return UPLOAD_STEPS.map((_, i) => {
    if (i < activeIndex) return 'done';
    if (i > activeIndex) return 'pending';
    return phase === 'error' ? 'error' : 'active';
  });
}

export function uploadErrorMessage(status: number | undefined, fallback: string): string {
  switch (status) {
    case 409:
      return 'Este arquivo já foi registrado — o hash dele já existe na blockchain.';
    case 413:
      return 'Arquivo acima de 50 MB.';
    case 408:
      return 'A confirmação na Sepolia demorou demais. Tente novamente em instantes.';
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    default:
      return fallback;
  }
}
