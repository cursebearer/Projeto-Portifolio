**Engenharia de Software — Católica SC**

---

## Identificação

- **Titulo do Projeto:** DocChain — Plataforma de Registro Documental com Prova de Integridade em Blockchain
- **Linha de Projeto (Direction):** Web / Plataforma
- **Autor:** *Rafael Pavesi dos Passos*
- **Data da Proposta:** 12/04/2026
- **Versao:** 1.0

---

## 1. Visao do Produto e Impacto (O Problema)

> Este projeto resolve um problema real ou e apenas um exercicio tecnico?

O DocChain resolve um problema real e crescente: a necessidade de garantir autenticidade, integridade e rastreabilidade de documentos digitais em um mundo onde fraudes documentais, adulteracao de arquivos e falta de mecanismos de auditoria sao riscos concretos para empresas, instituicoes academicas e orgaos publicos.

---

### 1.1 Contexto e Problema

A gestao de documentos digitais e um dos pilares de qualquer organizacao moderna. Contratos, certificados, laudos, diplomas, notas fiscais e relatorios circulam diariamente em formato digital, porem sem garantias reais de que nao foram adulterados apos sua emissao.

**Quem sofre com esse problema:**
- Empresas que precisam comprovar a autenticidade de contratos e documentos regulatorios
- Instituicoes academicas que emitem diplomas e certificados suscetivos a falsificacao
- Departamentos juridicos que dependem da integridade de provas documentais
- Profissionais autonomos que enviam propostas, relatorios e laudos a clientes

**Contexto em que o problema ocorre:**
- Troca de documentos entre partes que nao se conhecem ou nao confiam mutuamente
- Auditorias internas ou externas que precisam verificar se um documento e original
- Disputas contratuais onde a autenticidade de um documento e questionada

**Como o problema e resolvido hoje:**
- Assinatura digital com certificado ICP-Brasil (custosa e burocratica)
- Cartorios de registro de documentos (presencial, lento, caro)
- Envio por email com "fe de recebimento" (sem garantia tecnica de integridade)
- Hash manual compartilhado por canais separados (processo fragil e nao padronizado)

**Limitacoes das solucoes atuais:**
- Custo elevado de certificados digitais e servicos cartoriais
- Dependencia de intermediarios centralizados (cartorios, certificadoras)
- Ausencia de verificacao publica e transparente — apenas quem possui o certificado pode validar
- Nenhuma das solucoes tradicionais combina criptografia + armazenamento seguro + registro imutavel em um unico fluxo

---

### 1.2 Origem da Demanda e Evidencias

**Demanda Academica e Profissional:**
- O projeto nasce como Projeto Portifolio da Catolica SC, com o objetivo de demonstrar competencia tecnica em desenvolvimento full-stack, seguranca da informacao e tecnologia blockchain que possivelmente pode ser tonar um produto "SaaS" futuramente 
- A escolha do tema foi motivada pela crescente adocao de blockchain para verificacao de credenciais por governos e universidades, e pelo cenario alarmante de fraudes documentais no Brasil e no mundo

**Evidencia de Interesse — Adocao Institucional de Blockchain para Documentos:**

A demanda por verificacao de documentos via blockchain ja e reconhecida por governos e instituicoes:

- **Ministerio da Educacao (Brasil)** — lancou o programa de Diploma Digital com blockchain para toda a rede de ensino publico federal, com previsao de beneficiar mais de 1,3 milhao de estudantes matriculados em cursos de graduacao (fonte: Cointelegraph Brasil)
- **UFPB (Universidade Federal da Paraiba)** — pioneira no Brasil em utilizar blockchain para registro de diplomas, criando uma rede de integridade com multiplas camadas de validacao para processos de emissao e anulacao de diplomas (fonte: Livecoins)
- **Universidade de Nicosia (Chipre)** — em 2014, tornou-se a primeira instituicao no mundo a registrar certificados de conclusao de curso em blockchain (fonte: Bloomberg Linea)
- **MIT (EUA)** — implementou o programa Digital Diplomas, permitindo que graduados recebam diplomas verificaveis em blockchain
- **Mercado global** — o mercado de verificacao de documentos cresceu de USD 4,24 bilhoes em 2024 para USD 5,05 bilhoes em 2025 (CAGR de 19,3%), com projecao de atingir USD 9,94 bilhoes ate 2029 (fonte: Research and Markets)
- **Regulamentacoes** como a LGPD e o Marco Civil da Internet exigem cada vez mais rastreabilidade e integridade de dados, criando demanda por ferramentas que comprovem a nao adulteracao de documentos

**Cenario de Fraude Documental — Por que isso importa:**

A fraude documental e um problema estrutural e bilionario que reforca a urgencia de mecanismos de verificacao de integridade:

*No Brasil:*
- A sonegacao fiscal atinge cerca de **R$ 600 bilhoes por ano** (fonte: Sindifisco Nacional)
- A Receita Federal desarticulou um esquema de fraude fiscal de **R$ 26 bilhoes** envolvendo o grupo Refit em Sao Paulo (fonte: Agencia Brasil)
- No Ceara, a Sefaz identificou 68 empresas de fachada que emitiram **R$ 1,4 bilhao em notas fiscais falsas** (fonte: GC Mais)
- No Parana, foram identificadas **844 "empresas noteiras"** desde 2017, que emitiram notas de operacoes ficticias totalizando **R$ 4,8 bilhoes** (fonte: Diario dos Campos)
- A Policia Civil investigou um esquema que movimentou mais de **R$ 7,6 bilhoes em notas fiscais frias** utilizando empresas ficticias (fonte: Metropoles)

Esses numeros evidenciam a necessidade urgente de ferramentas que garantam a integridade e autenticidade de documentos de forma transparente e verificavel — exatamente o problema que o DocChain se propoe a resolver.

**Pesquisa com Usuarios e Dados de Mercado:**

Conversas informais com profissionais de TI, juridico e contabilidade de pequenas e medias empresas, combinadas com dados publicos de pesquisas, revelaram um cenario preocupante:

- **Maturidade digital baixa** — Segundo pesquisa da FGV, 66% das micro e pequenas empresas brasileiras estao nos niveis 1 e 2 de maturidade digital (18% no nivel "analogico" e 48% no nivel "emergente"). Isso significa que a maioria sequer possui processos digitais estruturados para gestao de documentos
- **Integracao de sistemas precaria** — Apenas 41% das empresas brasileiras possuem integracao entre gestao documental e outros sistemas. Empresas integradas reportam 47% mais eficiencia operacional, evidenciando o custo de nao adotar ferramentas adequadas
- **Compliance desconhecido** — Dados do Sebrae indicam que apenas 29% das PMEs sabem que programas de integridade podem atenuar penas em processos de corrupcao, mostrando baixo conhecimento sobre a importancia da rastreabilidade documental
- **Barreiras financeiras e de conhecimento** — 25% das PMEs apontam a falta de conhecimento sobre como conduzir a transformacao digital como principal obstaculo. Empresas menores enfrentam dificuldade para adquirir e integrar novas tecnologias por limitacao de recursos financeiros e humanos
- **Dependencia de certificacao cara** — A unica ferramenta amplamente reconhecida para verificacao de integridade documental no Brasil e o certificado ICP-Brasil, que exige custos anuais de R$ 150-500 por certificado — inviavel para a maioria das PMEs

*Principais dores identificadas nas conversas:*
- Ausencia de mecanismo automatizado de verificacao de integridade de documentos
- Custo proibitivo de certificacao digital para empresas de pequeno porte
- Falta de historico ou trilha de auditoria sobre documentos enviados e recebidos
- Dependencia total de terceiros centralizados (cartorios, certificadoras) para comprovar autenticidade
- Receio de disputas contratuais sem poder provar que um documento nao foi adulterado apos o envio

---

### 1.3 Analise de Solucoes Existentes (Benchmark)

| Solucao | Link | Publico-Alvo | Funcionalidades Principais | Limitacoes |
|---|---|---|---|---|
| **Blockcerts** | blockcerts.org | Universidades e emissores de credenciais | Emissao e verificacao de certificados em blockchain (Bitcoin/Ethereum) | Focado exclusivamente em credenciais academicas; nao suporta documentos genericos; sem criptografia de conteudo |
| **OriginalMy** | originalmy.com | Empresas e pessoas fisicas (Brasil) | Registro de autenticidade de documentos em blockchain; assinatura digital | Servico pago com planos mensais; codigo fechado; dependencia total do provedor |
| **OpenTimestamps** | opentimestamps.org | Desenvolvedores e entusiastas | Carimbo de tempo em blockchain Bitcoin (prova de existencia) | Apenas timestamp — nao armazena, nao criptografa, nao oferece interface amigavel |
| **Certisign** | certisign.com.br | Empresas com obrigatoriedade de certificado ICP-Brasil | Assinatura digital com validade juridica, certificados A1/A3 | Custo elevado (R$ 150-500/ano por certificado); burocratico; sem verificacao publica descentralizada |
| **DocuSign** | docusign.com | Empresas globais | Assinatura eletronica, workflow de documentos, auditoria | Centralizado; caro para PMEs; nao usa blockchain; confianca depositada no provedor |

**Comparacao:**

| Criterio | Blockcerts | OriginalMy | OpenTimestamps | Certisign | DocuSign | **DocChain** |
|---|---|---|---|---|---|---|
| Registro em blockchain | Sim | Sim | Sim | Nao | Nao | **Sim** |
| Criptografia do arquivo | Nao | Parcial | Nao | Nao | Nao | **Sim (AES-256-GCM)** |
| Verificacao publica | Sim | Parcial | Sim | Nao | Nao | **Sim** |
| Codigo aberto | Sim | Nao | Sim | Nao | Nao | **Sim** |
| Documentos genericos | Nao | Sim | Sim | Sim | Sim | **Sim** |
| Interface web amigavel | Limitada | Sim | Nao | Sim | Sim | **Sim** |
| Custo | Gratuito | Pago | Gratuito | Pago | Pago | **Gratuito (testnet)** |

**Diferencial do Projeto:**

O DocChain se diferencia por combinar em uma unica plataforma open-source:
1. **Criptografia end-to-end** (AES-256-GCM) — o arquivo e armazenado criptografado, nao apenas registrado
2. **Registro on-chain transparente** — qualquer pessoa pode verificar a existencia de um documento na blockchain sem depender do provedor
3. **Verificacao publica sem autenticacao** — terceiros podem verificar a autenticidade de um documento sem precisar de conta na plataforma
4. **Stack moderna e auditavel** — codigo aberto, arquitetura modular, e tecnologias amplamente utilizadas no mercado

Nenhuma das solucoes existentes combina criptografia de conteudo + armazenamento seguro + registro imutavel + verificacao publica em uma plataforma open-source com interface amigavel.

---

### 1.4 Publico-Alvo

**Usuarios primarios:**
- **Profissionais autonomos** (advogados, contadores, consultores) que precisam registrar a autenticidade de documentos enviados a clientes, garantindo prova de integridade em caso de disputa
- **Pequenas e medias empresas** que nao possuem orcamento para solucoes corporativas de assinatura digital (Certisign, DocuSign), mas precisam de um mecanismo confiavel de verificacao

**Usuarios secundarios:**
- **Estudantes e pesquisadores** interessados em entender na pratica como blockchain pode ser aplicada a problemas reais de seguranca da informacao
- **Desenvolvedores** que buscam uma referencia open-source de integracao NestJS + Solidity + Next.js

**Perfil do usuario:**
- Conhecimento tecnico basico a intermediario (sabe usar navegador web, fazer upload de arquivos)
- Nao necessita conhecer blockchain — a complexidade tecnica e abstraida pela interface
- Acesso via navegador

**Contexto de uso:**
- Escritorio ou home office, durante o fluxo de trabalho com documentos
- Upload pontual de documentos importantes (contratos, laudos, certificados)
- Verificacao ocasional quando a autenticidade de um documento e questionada

---

### 1.5 Objetivos do Projeto

**Objetivo Geral:**

Desenvolver uma plataforma web funcional que permita o registro, armazenamento seguro e verificacao de autenticidade de documentos digitais, utilizando criptografia e blockchain como mecanismos de prova de integridade — demonstrando competencia tecnica em desenvolvimento full-stack e tecnologias emergentes.

**Objetivos Especificos:**

1. **Implementar um Smart Contract** em Solidity para registro imutavel de hashes de documentos na rede Sepolia (testnet Ethereum), garantindo rastreabilidade e auditabilidade on-chain. Para fins academicos, a Sepolia e utilizada por ser gratuita e acessivel para desenvolvimento e testes. Em um cenario futuro de produto SaaS, seria necessaria a migracao para uma mainnet (Ethereum, Polygon ou Arbitrum) para garantir a permanencia e imutabilidade real dos registros
2. **Construir uma API REST** com NestJS que orquestre o fluxo completo: upload, hash SHA-256, criptografia AES-256-GCM, armazenamento seguro e registro em blockchain
3. **Desenvolver uma interface web** com Next.js 14 que abstraia a complexidade tecnica, oferecendo upload intuitivo, dashboard documental e verificacao de integridade com feedback visual
4. **Implementar verificacao publica** que permita terceiros (sem autenticacao) validarem a autenticidade de um documento comparando seu hash com o registro on-chain
5. **Documentar a arquitetura e decisoes tecnicas** de forma clara e completa, atendendo aos requisitos academicos e servindo como peca de portfolio profissional

---

### 1.6 Metricas de Sucesso (KPIs)

| Metrica | Meta | Como Medir |
|---|---|---|
| **Fluxo completo funcional** | Upload → hash → criptografia → blockchain → dashboard em um unico fluxo | Teste end-to-end via interface web |
| **Tempo de registro on-chain** | Confirmacao em menos de 30 segundos na Sepolia (testnet utilizada para fins academicos; em um SaaS real, a migracao para mainnet garantiria persistencia permanente dos registros) | Medicao do tempo entre envio da transacao e confirmacao do bloco |
| **Verificacao de integridade** | 100% de acuracia — arquivo identico retorna "autentico", arquivo alterado retorna "falha" | Testes com arquivos originais e modificados (alteracao de 1 byte) |
| **Cobertura de testes do Smart Contract** | 100% das funcoes do contrato cobertas por testes automatizados | Relatorio do Hardhat test coverage |
| **API documentada** | Todos os endpoints documentados via Swagger (OpenAPI) | Acesso a /api/docs com documentacao completa |
| **Criptografia correta** | Arquivo descriptografado identico ao original (zero perda de dados) | Comparacao byte-a-byte entre original e descriptografado |
| **Uptime do prototipo** | Ambiente Docker funcional com um unico comando (`docker compose up`) | Teste de inicializacao dos servicos sem erros |
