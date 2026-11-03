# Arquitetura

Modelo C4 em três níveis. As versões em imagem da RFC 1.2 estão em `RFC docs/artefatos_visuais/`; os diagramas abaixo refletem o estado atual do código, incluindo o monitoramento.

## Nível 1: Contexto

```mermaid
flowchart TB
    U(["Usuário<br/>registra e gerencia documentos"])
    V(["Verificador<br/>confirma autenticidade sem conta"])
    D["<b>DocChain</b><br/>Registro documental com prova<br/>de integridade em blockchain"]
    S["<b>Ethereum Sepolia</b><br/>Smart contract DocumentRegistry"]
    M["<b>Provedor de email</b><br/>SMTP (Resend)"]

    U -->|HTTPS| D
    V -->|HTTPS| D
    D -->|JSON-RPC| S
    D -->|SMTP| M
```

## Nível 2: Containers

```mermaid
flowchart TB
    U(["Usuário / Verificador"])

    subgraph DocChain
        W["<b>docchain-web</b><br/>Next.js 16 + React 19<br/>Telas, upload, verificação pública"]
        A["<b>docchain-api</b><br/>NestJS 11<br/>REST, auth por cookie, crypto, blockchain"]
        DB[("<b>PostgreSQL 16</b><br/>users, documents, audit_logs,<br/>verification_attempts, document_shares")]
        ST["<b>Storage</b><br/>Volume com arquivos<br/>AES-256-GCM (&lt;hash&gt;.enc)"]
        P["<b>Prometheus</b><br/>Coleta /metrics a cada 15 s<br/>Regras de alerta"]
        G["<b>Grafana</b><br/>Dashboard DocChain API"]
    end

    S["<b>Sepolia</b><br/>DocumentRegistry.sol"]
    M["<b>SMTP</b>"]

    U -->|HTTPS| W
    W -->|REST JSON + cookie HttpOnly| A
    A -->|TCP 5432 / Prisma| DB
    A -->|filesystem| ST
    A -->|ethers v6, retry + fallback RPC| S
    A -->|nodemailer| M
    P -->|scrape /metrics| A
    G -->|PromQL| P
```

## Nível 3: Componentes da API

```mermaid
flowchart LR
    subgraph Entrada
        MW[MetricsMiddleware]
        TG[ThrottlerGuard]
        JG[JwtAuthGuard]
        VP[ValidationPipe]
        EF[AllExceptionsFilter]
    end

    subgraph Módulos
        AUTH[AuthModule<br/>register, login, logout, conta, LGPD]
        DOCS[DocumentsModule<br/>upload, lista, detalhe, versões, download, delete]
        VER[VerificationModule<br/>verificação pública e privada]
        SH[SharingModule<br/>compartilhamento por email]
        PDF[PdfModule<br/>comprovante com QR code]
        HEALTH[HealthModule]
        MET[MetricsModule]
    end

    subgraph Infra
        CRY[CryptoService<br/>SHA-256, AES-256-GCM]
        STO[IStorageService<br/>LocalStorageService]
        BC[BlockchainService<br/>ethers v6]
        PR[PrismaService]
        AU[AuditLogService]
        MAIL[MailerService]
    end

    DOCS --> CRY
    DOCS --> STO
    DOCS --> BC
    DOCS --> PR
    DOCS --> AU
    VER --> BC
    VER --> CRY
    SH --> MAIL
    SH --> PDF
    AUTH --> PR
    AUTH --> AU
    HEALTH --> PR
    HEALTH --> BC
    MET --> PR
```

## Decisões

| Decisão | Motivo |
| --- | --- |
| Hash do arquivo original on-chain, arquivo cifrado fora da chain | Prova de integridade sem expor conteúdo e sem custo de armazenar dados na blockchain |
| Carteira do backend assina as transações | Usuário não precisa de carteira nem de ETH (RNF16) |
| Hash único global | Semântica de cartório: um arquivo tem um único registro de existência |
| JWT em cookie `HttpOnly` + `SameSite=Lax` | Token inacessível a JavaScript (mitiga XSS); API stateless |
| Storage atrás de `IStorageService` | Trocar disco local por IPFS ou S3 sem mudar o domínio |
| Retry com backoff e lista de RPCs de fallback | Instabilidade de RPC público não derruba o registro |
| Versões encadeadas por `previousDocumentId` no banco | O contrato continua simples e imutável |
| Soft-delete local, registro on-chain preservado | Blockchain é imutável; a exclusão vale para o dashboard e o arquivo cifrado |

## Modelo de dados

```mermaid
erDiagram
    users ||--o{ documents : registra
    users ||--o{ audit_logs : gera
    users ||--o{ verification_attempts : faz
    users ||--o{ document_shares : envia
    documents ||--o{ documents : "versão anterior"
    documents ||--o{ document_shares : compartilhado

    users {
        uuid id PK
        string email UK
        string password_hash
        string name
    }
    documents {
        uuid id PK
        uuid user_id FK
        string hash UK
        string file_name
        enum status
        string tx_hash
        int block_number
        string encryption_iv
        string encryption_auth_tag
        uuid previous_document_id FK
        datetime deleted_at
    }
    audit_logs {
        uuid id PK
        enum action
        uuid user_id FK
        json metadata
    }
    verification_attempts {
        uuid id PK
        string hash
        bool found
        enum source
    }
    document_shares {
        uuid id PK
        uuid document_id FK
        string shared_with_email
        string comprovante_hash
    }
```
