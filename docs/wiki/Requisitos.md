# Requisitos

Origem: RFC 1.2 (aprovada), seção 2. A coluna "Status" reflete o código atual.

## Requisitos funcionais

| ID | Requisito | Status | Onde |
| --- | --- | --- | --- |
| RF01 | Criar conta com email, senha e nome | Implementado | `POST /auth/register` |
| RF02 | Login com JWT entregue só em cookie `HttpOnly` | Implementado | `POST /auth/login` |
| RF03 | JWT expira em 15 minutos | Implementado | `JWT_EXPIRES_IN` |
| RF04 | Logout limpa o cookie | Implementado | `POST /auth/logout` |
| RF05 | Upload de qualquer tipo de arquivo até 50 MB | Implementado | `POST /documents` |
| RF06 | Hash SHA-256 do arquivo original | Implementado | `CryptoService.hashFile` |
| RF07 | Criptografia AES-256-GCM em repouso | Implementado | `CryptoService.encrypt` |
| RF08 | Registro do hash no contrato na Sepolia | Implementado | `BlockchainService.registerDocument` |
| RF09 | Metadados persistidos no PostgreSQL | Implementado | tabela `documents` |
| RF10 | Bloqueio de hash duplicado com erro específico | Implementado | 409 `DOCUMENT_ALREADY_REGISTERED` |
| RF11 | Lista paginada dos documentos do usuário | Implementado | `GET /documents`, `/dashboard` |
| RF12 | Cards de estatística (total, confirmados, pendentes) | Implementado | `/dashboard` |
| RF13 | Filtro por status | Implementado | `GET /documents?status=` |
| RF14 | Detalhe completo do documento | Implementado | `GET /documents/:id`, `/documents/[id]` |
| RF15 | Link para a transação no Etherscan | Implementado | tela de detalhe |
| RF16 | Verificação privada reenviando o arquivo | Implementado | `POST /documents/verify` |
| RF17 | Verificação pública sem login, por hash ou arquivo | Implementado | `GET /verify/public/:hash`, `/verify` |
| RF18 | Resultado claro (autêntico ou não) com dados on-chain | Implementado | `/verify/[hash]` |
| RF19 | Validação do formato do hash antes da chamada on-chain | Implementado | regex `^[a-fA-F0-9]{64}$` |
| RF20 | Download do arquivo descriptografado | Implementado | `GET /documents/:id/download` |
| RF21 | Isolamento por dono (404 para documento de outro usuário) | Implementado | filtros por `userId` |
| RF22 | Exclusão com soft-delete, remoção do `.enc` e auditoria | Implementado | `DELETE /documents/:id` |
| RF23 | Registro on-chain preservado após exclusão | Implementado | contrato sem função de delete |
| RF24 | Documentos excluídos ocultos das listagens | Implementado | `deletedAt: null` |
| RF25 | Health check de banco e blockchain | Implementado | `GET /health` |
| RF26 | Documentação OpenAPI | Implementado | `/api/docs` |

### Funcionalidades além da RFC 1.2

Itens que estavam fora do escopo original e foram entregues:

| Funcionalidade | Onde |
| --- | --- |
| Versionamento de documentos (cadeia de versões) | `POST/GET /documents/:id/versions`, contador no dashboard |
| Compartilhamento por email com comprovante | `POST /documents/:id/share` |
| Comprovante de verificação em PDF com QR code | tela de detalhe |
| Conta: editar perfil, exportar dados, excluir conta (LGPD) | `PATCH/GET/DELETE /auth/me`, `/conta` |
| Termos de uso e política de privacidade | `/termos`, `/privacidade` |
| Trilha de auditoria (upload, download, delete, login, share) | tabela `audit_logs` |
| Métricas Prometheus e dashboard Grafana | `GET /metrics`, `monitoring/` |
| Chaves de API para integração (até 5 por usuário, exibidas uma vez, guardadas como hash) | `POST/GET/DELETE /api-keys`, header `X-API-Key`, tela `/integracao` |

## Requisitos não funcionais

| ID | Requisito | Como é atendido |
| --- | --- | --- |
| RNF01 | Leitura abaixo de 300 ms (sem blockchain) | Medido pela métrica `docchain_http_request_duration_seconds` |
| RNF02 | Confirmação on-chain abaixo de 30 s | Sepolia confirma em ~12 s; retry com backoff e RPC de fallback |
| RNF03 | 20 uploads simultâneos | API stateless; throttling configurável |
| RNF04 | bcrypt com custo >= 10 | custo 12 |
| RNF05 | Chave JWT com no mínimo 32 caracteres | validado no boot (Joi) |
| RNF06 | AES-256-GCM com IV aleatório por arquivo | IV de 12 bytes por operação |
| RNF07 | `ENCRYPTION_KEY` só por variável de ambiente | validado no boot (Joi) |
| RNF08 | `PRIVATE_KEY` só por variável de ambiente | validado no boot (Joi) |
| RNF09 | Acesso restrito ao dono | todas as consultas filtram por `userId` |
| RNF10 | Ambiente sobe com um comando | `docker compose up --build` na raiz |
| RNF11 | Falha de blockchain com mensagem clara | `AllExceptionsFilter` e status `FAILED` |
| RNF12 | Rollback em falha definitiva | arquivo cifrado removido e documento marcado `FAILED` |
| RNF13 | Storage abstraído | interface `IStorageService` |
| RNF14 | Escala horizontal | JWT em cookie, sem sessão em memória |
| RNF15 | Responsivo a partir de 360 px | Tailwind mobile-first |
| RNF16 | Blockchain transparente ao usuário | carteira do backend assina; usuário não lida com gas |
| RNF17 | Feedback visual | toasts, badges de status, progresso em etapas |
| RNF18 | ESLint + Prettier + TypeScript strict | lint no CI |
| RNF19 | 100% de cobertura no contrato | solidity-coverage |
| RNF20 | Swagger atualizado | gerado a partir dos decorators |

## Regras de negócio

| ID | Regra |
| --- | --- |
| RN01 | Cada hash só pode ser registrado uma vez (global, entre todos os usuários) |
| RN02 | O hash on-chain é do arquivo original, antes da criptografia |
| RN03 | Documento pertence a quem registrou |
| RN04 | Verificação pública não expõe nome do arquivo nem dono |
| RN05 | Só usuário autenticado faz upload e gerencia documentos |
| RN06 | Download só pelo dono |
| RN07 | Documento `FAILED` do próprio usuário pode ser reenviado |
| RN08 | Limite de 50 MB por arquivo |
| RN09 | Verificação pública só aceita SHA-256 válido |
| RN10 | Só documento `CONFIRMED` pode ser compartilhado |
| RN11 | Nova versão só a partir de documento próprio e não excluído |
| RN12 | API key só envia e consulta documentos do próprio dono; demais rotas respondem 403 |
| RN13 | Máximo de 5 chaves de API ativas por usuário; chave revogada deixa de funcionar na hora |
