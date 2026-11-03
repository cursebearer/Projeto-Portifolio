# Casos de Uso

## Atores

| Ator | Descrição |
| --- | --- |
| Visitante | Pessoa sem conta. Cria conta ou verifica documentos publicamente. |
| Usuário | Pessoa autenticada. Registra, consulta, baixa, versiona, compartilha e exclui documentos. |
| Blockchain (Sepolia) | Sistema externo onde o hash é registrado e consultado. |

## Casos de uso

| ID | Caso de uso | Ator | Descrição |
| --- | --- | --- | --- |
| UC01 | Criar conta | Visitante | Cadastro com email, senha e nome |
| UC02 | Fazer login | Usuário | Autenticação; recebe cookie `HttpOnly` com JWT |
| UC03 | Registrar documento | Usuário | Upload, hash, criptografia e registro on-chain |
| UC04 | Visualizar dashboard | Usuário | Lista paginada, filtros e estatísticas |
| UC05 | Ver detalhe do documento | Usuário | Metadados, hash, tx, link Etherscan, versões |
| UC06 | Verificar integridade (privada) | Usuário | Reenvia o arquivo e compara com o registro |
| UC07 | Baixar documento | Usuário | Recebe o arquivo original descriptografado |
| UC08 | Verificar publicamente | Visitante | Consulta por hash ou arquivo, sem login |
| UC09 | Registrar hash on-chain | Sistema | Envia `registerDocument` ao contrato |
| UC10 | Confirmar registro | Blockchain | Sistema aguarda o bloco e marca `CONFIRMED` |
| UC11 | Excluir documento | Usuário | Soft-delete; o registro on-chain permanece |
| UC12 | Criar nova versão | Usuário | Envia arquivo novo ligado ao documento anterior |
| UC13 | Compartilhar por email | Usuário | Envia link de verificação e comprovante ao destinatário |
| UC14 | Gerenciar conta (LGPD) | Usuário | Editar perfil, exportar dados, excluir conta |

```mermaid
flowchart LR
    V([Visitante])
    U([Usuário])
    B([Sepolia])

    subgraph DocChain
        UC01[UC01 Criar conta]
        UC02[UC02 Login]
        UC03[UC03 Registrar documento]
        UC04[UC04 Dashboard]
        UC05[UC05 Detalhe]
        UC06[UC06 Verificação privada]
        UC07[UC07 Download]
        UC08[UC08 Verificação pública]
        UC09[UC09 Registrar hash]
        UC10[UC10 Confirmar registro]
        UC11[UC11 Excluir]
        UC12[UC12 Nova versão]
        UC13[UC13 Compartilhar]
        UC14[UC14 Conta / LGPD]
    end

    V --- UC01
    V --- UC08
    U --- UC02
    U --- UC03
    U --- UC04
    U --- UC05
    U --- UC06
    U --- UC07
    U --- UC11
    U --- UC12
    U --- UC13
    U --- UC14
    UC03 -. include .-> UC09
    UC12 -. include .-> UC09
    UC09 --- B
    B --- UC10
    UC08 --- B
```

## Fluxo principal: registro de documento (UC03)

```mermaid
sequenceDiagram
    actor U as Usuário
    participant W as Web
    participant A as API
    participant D as PostgreSQL
    participant S as Storage
    participant C as Contrato (Sepolia)

    U->>W: Seleciona arquivo
    W->>A: POST /documents (multipart, cookie)
    A->>A: SHA-256 do arquivo original
    A->>D: Hash já existe?
    alt Hash já registrado
        A-->>W: 409 DOCUMENT_ALREADY_REGISTERED + verifyUrl
    else Novo
        A->>D: Cria documento PROCESSING
        A->>A: AES-256-GCM (IV aleatório)
        A->>S: Grava <hash>.enc
        A->>C: registerDocument(hash, storageRef)
        C-->>A: txHash, blockNumber
        A->>D: Atualiza para CONFIRMED
        A-->>W: 201 documento
    end
    Note over A,C: Em falha: remove o .enc, marca FAILED e retorna erro
```

## Fluxo alternativo: verificação pública (UC08)

```mermaid
sequenceDiagram
    actor V as Visitante
    participant W as Web
    participant A as API
    participant C as Contrato (Sepolia)

    V->>W: Envia arquivo ou cola hash em /verify
    W->>W: Calcula SHA-256 no navegador (arquivo não sai da máquina)
    W->>A: GET /verify/public/:hash
    A->>A: Valida formato do hash
    A->>C: verifyDocument(hash)
    C-->>A: exists, timestamp, registeredBy
    A-->>W: Resultado
    W-->>V: Autêntico ou não encontrado
```

## Exceções

| Código | Situação | Comportamento |
| --- | --- | --- |
| E01 | Hash já registrado | 409 com data do registro e link para verificação |
| E02 | Falha na blockchain | Retry com backoff e RPC de fallback; se persistir, `FAILED` e rollback do arquivo |
| E03 | Arquivo acima de 50 MB | 413, recusado antes do processamento |
| E04 | Hash com formato inválido | 400, sem chamada on-chain |
| E05 | Documento de outro usuário | 404 |
