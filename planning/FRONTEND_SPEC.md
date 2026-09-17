# Especificação do Frontend — DocChain Web (Next.js 14)

## Estrutura de Rotas

```
/                     → redirect para /dashboard (se logado) ou /login
/login                → página de autenticação
/register             → página de cadastro
/dashboard            → listagem de documentos (protegida)
/upload               → upload de novo documento (protegida)
/documents/[id]       → detalhe e verificação de documento (protegida)
/verify               → verificação pública (sem autenticação)
```

---

## Layout e Navegação

### Layout protegido `app/(dashboard)/layout.tsx`
```
┌──────────────────────────────────────────────────────┐
│  Sidebar (desktop) / Navbar mobile                   │
│  ┌──────────┐  ┌─────────────────────────────────┐   │
│  │ DocChain │  │  Dashboard   Upload   Verificar  │   │
│  │   logo   │  │                      [email] ▼   │   │
│  └──────────┘  └─────────────────────────────────┘   │
│                                                      │
│  ┌─────────────┐  ┌───────────────────────────────┐  │
│  │  Sidebar    │  │  <children />                  │  │
│  │  Dashboard  │  │                               │  │
│  │  Upload     │  │                               │  │
│  │  Verificar  │  │                               │  │
│  │  ─────────  │  │                               │  │
│  │  Sair       │  │                               │  │
│  └─────────────┘  └───────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Estrutura de Navegação (RFC §4.1)

O DocChain organiza rotas em duas regiões claramente separadas — **pública** (sem autenticação) e **protegida** (requer cookie httpOnly válido) — com um ponto único de guarda (Next.js Middleware).

- **Bloco público:** `/login`, `/register`, `/verify` — navegação livre, sem cookie
- **Bloco protegido:** `/dashboard`, `/upload`, `/documents/[id]` — hierarquia hub-and-spoke (`/dashboard` como hub)
- **Guarda:** o middleware intercepta toda navegação em rota protegida; se o cookie `access_token` está ausente, redireciona para `/login` **antes** do render. A validação criptográfica do JWT é responsabilidade do backend — o middleware checa apenas a presença do cookie.

Diagrama visual: `RFC docs/artefatos_visuais/12. Estrutura de Navegação.png`

### Proteção de rotas — `middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register');
  const isPublicPage = request.nextUrl.pathname.startsWith('/verify');

  if (!token && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Páginas

### `/login` — Autenticação

```
┌────────────────────────────────────────┐
│             DocChain                   │
│  Registro de documentos com blockchain │
│                                        │
│  Email ________________________________│
│  Senha ________________________________│
│                                        │
│  [    Entrar    ]                      │
│                                        │
│  Não tem conta? Cadastre-se            │
└────────────────────────────────────────┘
```

**Comportamento:**
- Ao logar com sucesso: o backend responde com `Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=900`. O cookie é setado automaticamente pelo navegador — o frontend **nunca** toca o token em JavaScript.
- Após o login, chama `GET /auth/me` para hidratar o Zustand store com os dados do usuário (id, email, name).
- Redireciona para `/dashboard`
- Exibe toast de erro em credenciais inválidas

---

### `/dashboard` — Lista de Documentos

```
┌─────────────────────────────────────────────────────────────┐
│  Documentos                              [+ Novo Upload]    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Total    │  │Confirmado│  │ Pendente │                   │
│  │   42     │  │   40     │  │    2     │                   │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Nome          │ Hash       │ Status    │ Data  │ Ação │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ contrato.pdf  │ a3f5c8...  │ Conf.     │ 01/01 │  →  │  │
│  │ nota_fiscal.. │ b8d2e1...  │ Pend.     │ 01/01 │  →  │  │
│  │ relatorio.doc │ c9f3a2...  │ Conf.     │ 31/12 │  →  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ← Anterior   Página 1 de 5   Próxima →                    │
└─────────────────────────────────────────────────────────────┘
```

**Componentes usados:**
- `DocumentTable` — tabela principal
- `StatusBadge` — badge colorido por status
- `StatCard` — cards de métricas

---

### `/upload` — Upload de Documento

```
┌─────────────────────────────────────────────────────────────┐
│  Novo Documento                                             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │         Arraste o arquivo aqui ou clique              │  │
│  │           para selecionar                             │  │
│  │                                                       │  │
│  │     Formatos aceitos: PDF, XML, DOC, XLSX, etc.       │  │
│  │     Tamanho máximo: 50MB                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  — Arquivo selecionado: contrato.pdf (1.2 MB)              │
│                                                             │
│  [   Registrar na Blockchain   ]                            │
│                                                             │
│  Aviso: o processo pode levar 15-30 segundos enquanto      │
│    aguardamos confirmação na Sepolia.                       │
└─────────────────────────────────────────────────────────────┘
```

**Estados do Upload:**
```
idle        → arquivo não selecionado
selected    → arquivo no dropzone, botão habilitado
uploading   → enviando para API (spinner)
processing  → "Gerando hash e criptografando..."
confirming  → "Aguardando confirmação blockchain... (pode levar ~15s)"
success     → exibe hash + txHash + link Etherscan
error       → mensagem de erro + botão tentar novamente
```

**Componentes usados:**
- `UploadDropzone` — react-dropzone
- `UploadProgress` — barra/estados de progresso

---

### `/documents/[id]` — Detalhe do Documento

```
┌─────────────────────────────────────────────────────────────┐
│  ← Voltar              contrato.pdf               Conf.    │
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  Informações do Arquivo  │  │  Registro Blockchain     │ │
│  │                          │  │                          │ │
│  │  Nome: contrato.pdf      │  │  Rede: Sepolia           │ │
│  │  Tipo: application/pdf   │  │  TX: 0xabc...  ↗        │ │
│  │  Tamanho: 1.2 MB         │  │  Bloco: 5.847.291        │ │
│  │  Upload: 01/01 10:00     │  │  Wallet: 0xdef...        │ │
│  │  Confirmado: 01/01 10:00 │  │  Confirmado: 01/01 10:00 │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                             │
│  Hash SHA-256:                                              │
│  a3f5c8d2e1b09f4e3c7a6b5d4f2e1c8a9b3d5f7e2c4a6b8d0f1e3c5  │
│  [ Copiar ]                                                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Verificar Integridade                                      │
│                                                             │
│  Reenvie o arquivo original para confirmar autenticidade:  │
│  ┌─────────────────────────────────────┐                   │
│  │  Solte o arquivo aqui               │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  [  Verificar  ]    [  Download  ]    [  Excluir  ]        │
└─────────────────────────────────────────────────────────────┘
```

**Ação Excluir (RF22-24):**
- Botão "Excluir" abre `<AlertDialog>` (shadcn) com aviso explícito: "Documento removido do dashboard. Registro on-chain permanece imutável."
- Confirmação → `DELETE /documents/:id` → toast de sucesso → redirect para `/dashboard`
- Documento some das listagens privadas, mas `/verify/public/:hash` continua retornando `exists: true`

**Resultado de verificação (inline):**
```
DOCUMENTO AUTÊNTICO
   Hash corresponde ao registro original.
   Confirmado na blockchain Sepolia em 01/01/2024.

VERIFICAÇÃO FALHOU
   O hash do arquivo enviado não corresponde ao registro.
   O documento pode ter sido modificado após o registro.
```

---

### `/verify` — Verificação Pública

```
┌─────────────────────────────────────────────────────────────┐
│                 Verificar Documento                         │
│                                                             │
│  Verifique a autenticidade de qualquer documento            │
│  registrado no DocChain sem precisar de conta.             │
│                                                             │
│  Opção 1: Envie o arquivo                                  │
│  ┌─────────────────────────────────────┐                   │
│  │  Arraste ou clique para selecionar  │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Opção 2: Cole o hash SHA-256                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  a3f5c8d2e1b09f4...                                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [   Verificar na Blockchain   ]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Componentes Reutilizáveis

### `StatusBadge`
```typescript
// components/documents/StatusBadge.tsx
type Status = 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED';

const variants = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  CONFIRMED:  'bg-green-100 text-green-800',
  FAILED:     'bg-red-100 text-red-800',
};

const labels = {
  PENDING:    'Pendente',
  PROCESSING: 'Processando',
  CONFIRMED:  'Confirmado',
  FAILED:     'Falhou',
};
```

### `VerificationResult`
```typescript
// components/documents/VerificationResult.tsx
// Exibe resultado de verificação com ícone grande + detalhes
// Props: { result: VerificationResultType }
```

### API Client (`lib/api.ts`)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // navegador anexa cookie httpOnly automaticamente
});

// Interceptor: redireciona para login em 401 (cookie ausente ou JWT expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

> O JWT vive apenas no cookie httpOnly. O JS do frontend **não lê nem escreve** o token — toda a autenticação é orquestrada pelo backend via `Set-Cookie`.

---

## Zustand Store (`store/auth.store.ts`)

O store guarda apenas **metadados do usuário** — o JWT vive no cookie httpOnly e é inacessível ao JS. Logout é orquestrado pelo backend (`POST /auth/logout` apaga o cookie via `Set-Cookie: Max-Age=0`).

```typescript
import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;   // chama GET /auth/me após login
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  hydrate: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  logout: async () => {
    await api.post('/auth/logout'); // backend apaga o cookie
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },
}));
```

---

## Tipos TypeScript (`types/document.ts`)

```typescript
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED';

export interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  hash: string;
  hashAlgorithm: string;
  storageType: 'LOCAL' | 'IPFS';
  storageRef?: string;
  txHash?: string;
  network?: string;
  walletAddress?: string;
  blockNumber?: number;
  status: DocumentStatus;
  uploadedAt: string;
  confirmedAt?: string;
}

export interface PaginatedDocuments {
  data: Document[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VerificationResult {
  verified: boolean;
  hashMatch: boolean;
  blockchainConfirmed: boolean;
  document?: Partial<Document>;
  blockchain?: {
    exists: boolean;
    registeredAt?: string;
    registeredBy?: string;
    storageRef?: string;
    txHash?: string;
  };
  recalculatedHash?: string;
  reason?: string;
}
```

---

## Utilitários (`lib/utils.ts`)

```typescript
// Truncar hash para exibição: "a3f5c8...d0f1e3"
export const truncateHash = (hash: string, chars = 8) =>
  `${hash.slice(0, chars)}...${hash.slice(-chars)}`;

// Formatar tamanho de arquivo
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Link para Etherscan
export const etherscanTxUrl = (txHash: string): string =>
  `${process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL}/tx/${txHash}`;

// Link para Etherscan por endereço
export const etherscanAddressUrl = (address: string): string =>
  `${process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL}/address/${address}`;
```
