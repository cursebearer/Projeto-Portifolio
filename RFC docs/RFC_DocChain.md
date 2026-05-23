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

**Posicionamento do Produto:**
- O DocChain e um produto **SaaS open-source** de registro documental com blockchain, construido com a mesma arquitetura, qualidade e padroes de uma plataforma comercial real (autenticacao, criptografia em repouso, API REST documentada, frontend responsivo, integracao on-chain, infra containerizada)
- A opcao por permanecer na **rede de teste Sepolia** e estrategica, nao academica: mantem o produto **gratuito**, **auditavel** publicamente pela comunidade e coerente com a filosofia open-source — qualquer pessoa pode clonar o repositorio, rodar localmente e contribuir
- O projeto e tambem entregue como **Projeto Portifolio (TCC)** da Catolica SC, demonstrando competencia tecnica em desenvolvimento full-stack, seguranca da informacao e tecnologia blockchain
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

1. **Implementar um Smart Contract** em Solidity para registro imutavel de hashes de documentos na rede Sepolia (testnet Ethereum), garantindo rastreabilidade e auditabilidade on-chain. A permanencia na Sepolia e uma **opcao estrategica do produto** — mantem o uso gratuito, alinhado com a natureza open-source da plataforma. Migracao para mainnet (Ethereum, Polygon ou Arbitrum) fica disponivel como evolucao opcional caso usos especificos exijam permanencia comercial dos registros, mas nao e o objetivo desta versao
2. **Construir uma API REST** com NestJS que orquestre o fluxo completo: upload, hash SHA-256, criptografia AES-256-GCM, armazenamento seguro e registro em blockchain
3. **Desenvolver uma interface web** com Next.js 14 que abstraia a complexidade tecnica, oferecendo upload intuitivo, dashboard documental e verificacao de integridade com feedback visual
4. **Implementar verificacao publica** que permita terceiros (sem autenticacao) validarem a autenticidade de um documento comparando seu hash com o registro on-chain
5. **Documentar a arquitetura e decisoes tecnicas** de forma clara e completa, atendendo aos requisitos academicos e servindo como peca de portfolio profissional

---

### 1.6 Metricas de Sucesso (KPIs)

| Metrica | Meta | Como Medir |
|---|---|---|
| **Fluxo completo funcional** | Upload → hash → criptografia → blockchain → dashboard em um unico fluxo | Teste end-to-end via interface web |
| **Tempo de registro on-chain** | Confirmacao em menos de 30 segundos na Sepolia (testnet escolhida estrategicamente para manter o produto gratuito e open-source) | Medicao do tempo entre envio da transacao e confirmacao do bloco |
| **Verificacao de integridade** | 100% de acuracia — arquivo identico retorna "autentico", arquivo alterado retorna "falha" | Testes com arquivos originais e modificados (alteracao de 1 byte) |
| **Cobertura de testes do Smart Contract** | 100% das funcoes do contrato cobertas por testes automatizados | Relatorio do Hardhat test coverage |
| **API documentada** | Todos os endpoints documentados via Swagger (OpenAPI) | Acesso a /api/docs com documentacao completa |
| **Criptografia correta** | Arquivo descriptografado identico ao original (zero perda de dados) | Comparacao byte-a-byte entre original e descriptografado |
| **Uptime do prototipo** | Ambiente Docker funcional com um unico comando (`docker compose up`) | Teste de inicializacao dos servicos sem erros |

---

## 2. Engenharia de Requisitos

Esta secao define o que o sistema fara, evitando descricoes vagas e ambiguidades. Os requisitos foram derivados da analise do problema (Capitulo 1) e do publico-alvo identificado.

---

### 2.1 Personas

**Persona 1 — Mariana, a Advogada Autonoma**

- **Idade:** 34 anos
- **Profissao:** Advogada autonoma especializada em direito empresarial
- **Contexto:** Atende cerca de 20 clientes pessoa fisica e juridica; envia diariamente contratos, pareceres e procuracoes por email
- **Objetivos:**
  - Garantir que contratos enviados nao sejam alterados pelo cliente antes da assinatura
  - Ter prova juridica de integridade caso o cliente conteste o conteudo de um documento
  - Reduzir custos com certificacao digital ICP-Brasil
- **Principais dificuldades:**
  - Custo elevado de certificados digitais (R$ 300-500/ano)
  - Falta de mecanismo simples para terceiros validarem a autenticidade
  - Receio de disputas judiciais sem prova material da versao original
- **Cenario de uso DocChain:** Antes de enviar o contrato ao cliente, Mariana faz upload na plataforma. O hash fica registrado na blockchain. Caso surja disputa, ela comprova publicamente a integridade do documento original.

**Persona 2 — Ricardo, o Contador de PME**

- **Idade:** 45 anos
- **Profissao:** Contador, dono de escritorio com 8 colaboradores que atende ~150 PMEs
- **Contexto:** Lida diariamente com notas fiscais, balancos, declaracoes fiscais e documentos que precisam de rastreabilidade
- **Objetivos:**
  - Registrar de forma imutavel a versao final de documentos contabeis enviados a clientes
  - Auditar facilmente quais documentos foram enviados em determinada data
  - Oferecer um diferencial aos clientes (verificacao publica de autenticidade)
- **Principais dificuldades:**
  - Volume alto de documentos torna inviavel certificar tudo via ICP-Brasil
  - Clientes ocasionalmente alegam ter recebido versao diferente do documento
  - Falta de trilha de auditoria automatizada
- **Cenario de uso DocChain:** Ricardo integra o DocChain ao fluxo do escritorio. Cada documento enviado e registrado on-chain. Em fiscalizacoes ou auditorias, basta apresentar o hash e o link da transacao.

**Persona 3 — Bianca, a Estudante de TI**

- **Idade:** 22 anos
- **Profissao:** Estudante de Engenharia de Software em fase final do curso
- **Contexto:** Estuda aplicacoes praticas de blockchain e busca referencias de projetos open-source para basear seu proprio TCC
- **Objetivos:**
  - Entender na pratica como integrar Smart Contracts a um backend tradicional
  - Estudar arquitetura modular com NestJS, Prisma e Next.js
  - Usar o codigo como base para seu proprio projeto de portfolio
- **Principais dificuldades:**
  - Escassez de projetos open-source que combinem Web3 com stack moderna de mercado
  - Tutoriais cobrem apenas partes isoladas (so contrato, so backend)
  - Dificuldade em encontrar exemplos didaticos mas tambem realisticos
- **Cenario de uso DocChain:** Bianca clona o repositorio, sobe o ambiente com `docker compose up`, le a documentacao tecnica e estuda como o sistema orquestra hash + criptografia + on-chain.

---

### 2.2 Casos de Uso Principais

O sistema possui tres atores principais e os seguintes casos de uso:

**Atores:**
- **Usuario Autenticado** — pessoa registrada na plataforma com acesso ao dashboard
- **Visitante (Verificador Publico)** — qualquer pessoa que queira validar a autenticidade de um documento sem ter conta
- **Sistema Blockchain (Sepolia)** — ator externo que recebe e registra hashes de forma imutavel

**Casos de Uso:**

| ID | Caso de Uso | Ator Principal | Descricao Resumida |
|---|---|---|---|
| UC01 | Criar Conta | Visitante | Cadastra-se com email, senha e nome para acessar a plataforma |
| UC02 | Realizar Login | Usuario | Autentica-se com email e senha, recebe JWT |
| UC03 | Fazer Upload de Documento | Usuario Autenticado | Envia arquivo que sera hasheado, criptografado e registrado on-chain |
| UC04 | Visualizar Dashboard | Usuario Autenticado | Consulta lista paginada de documentos com status e metadados |
| UC05 | Visualizar Detalhe do Documento | Usuario Autenticado | Consulta metadados completos, hash, txHash e link Etherscan |
| UC06 | Verificar Integridade (Privada) | Usuario Autenticado | Reenviia o arquivo para comparar hash com o registro original |
| UC07 | Baixar Documento Descriptografado | Usuario Autenticado | Recupera o arquivo original a partir do storage criptografado |
| UC08 | Verificar Documento Publicamente | Visitante | Sem autenticacao, consulta a blockchain via hash ou arquivo |
| UC09 | Registrar Hash on-chain | Sistema -> Blockchain | Envia transacao para o Smart Contract na Sepolia |
| UC10 | Confirmar Registro on-chain | Blockchain -> Sistema | Sistema aguarda confirmacao de bloco e atualiza status |

![Diagrama de Casos de Uso (UML) — atores, boundary DocChain e 10 casos de uso](<artefatos_visuais/1 - Diagrama de Casos de Uso (UML).png>)

---

### 2.3 Requisitos Funcionais (RF)

**Modulo de Autenticacao:**

- **RF01** — O sistema deve permitir que o Visitante crie uma conta informando email, senha e nome.
- **RF02** — O sistema deve permitir que o Usuario realize login com email e senha, recebendo um token JWT.
- **RF03** — O sistema deve invalidar tokens JWT apos 15 minutos, exigindo novo login para sessoes prolongadas.
- **RF04** — O sistema deve permitir que o Usuario realize logout, descartando o token no lado do cliente.

**Modulo de Upload e Registro:**

- **RF05** — O sistema deve permitir que o Usuario Autenticado faca upload de arquivos de qualquer tipo (PDF, DOCX, imagens, etc.) com tamanho maximo de 50 MB.
- **RF06** — O sistema deve calcular o hash SHA-256 do arquivo **original** (antes da criptografia) automaticamente apos o upload.
- **RF07** — O sistema deve criptografar o conteudo do arquivo utilizando AES-256-GCM antes de armazena-lo em disco.
- **RF08** — O sistema deve registrar o hash SHA-256 do documento no Smart Contract da rede Sepolia, junto com a referencia de storage.
- **RF09** — O sistema deve persistir os metadados do documento (id, nome, tipo, tamanho, hash, txHash, status, datas, IV, authTag) no banco PostgreSQL.
- **RF10** — O sistema deve impedir o registro duplicado de hashes ja existentes no contrato, retornando erro especifico.

**Modulo de Dashboard e Consulta:**

- **RF11** — O sistema deve apresentar ao Usuario Autenticado uma lista paginada (10 itens por pagina) dos seus documentos.
- **RF12** — O sistema deve exibir cards de estatisticas com total de documentos, confirmados e pendentes.
- **RF13** — O sistema deve permitir filtrar a lista por status (PENDING, PROCESSING, CONFIRMED, FAILED).
- **RF14** — O sistema deve permitir o Usuario Autenticado consultar o detalhe completo de cada documento.
- **RF15** — O sistema deve exibir link clicavel para a transacao no Etherscan Sepolia.

**Modulo de Verificacao:**

- **RF16** — O sistema deve permitir que o Usuario Autenticado verifique a integridade de um documento, reenviando-o para comparacao de hash.
- **RF17** — O sistema deve permitir que o Visitante (sem autenticacao) verifique publicamente a autenticidade de um documento em `/verify`, informando o hash diretamente ou enviando o arquivo.
- **RF18** — O sistema deve retornar resultado claro (Autentico / Falha) com dados blockchain (data, bloco, endereco que registrou).

**Modulo de Download:**

- **RF19** — O sistema deve permitir que o Usuario Autenticado faca download do arquivo descriptografado original.
- **RF20** — O sistema deve negar acesso a documentos que nao pertencem ao usuario autenticado (retornar 403 ou 404).

**Utilitarios:**

- **RF21** — O sistema deve expor um endpoint GET /health para verificacao de saude (banco + conexao blockchain).
- **RF22** — O sistema deve documentar todos os endpoints publicos via Swagger (OpenAPI) em `/api/docs`.

---

### 2.4 Requisitos Nao Funcionais (RNF)

**Desempenho:**

- **RNF01** — O tempo de resposta da API para operacoes de leitura deve ser inferior a 300 ms (excluindo operacoes blockchain).
- **RNF02** — A confirmacao do registro on-chain deve ocorrer em menos de 30 segundos na rede Sepolia.
- **RNF03** — O sistema deve suportar pelo menos 20 uploads simultaneos sem degradacao perceptivel.

**Seguranca:**

- **RNF04** — Senhas devem ser armazenadas com bcrypt (cost factor >= 10).
- **RNF05** — Tokens JWT devem ser assinados com chave de no minimo 32 caracteres armazenada em variavel de ambiente.
- **RNF06** — Arquivos devem ser criptografados em repouso com AES-256-GCM utilizando IV aleatorio para cada operacao.
- **RNF07** — A chave de criptografia (ENCRYPTION_KEY) nunca deve ser hardcoded — sempre via variavel de ambiente.
- **RNF08** — A chave privada da carteira blockchain (PRIVATE_KEY) deve ser armazenada apenas em variavel de ambiente, nunca em codigo ou banco.
- **RNF09** — Acessos a documentos devem ser restritos ao usuario proprietario (isolamento por userId).

**Disponibilidade:**

- **RNF10** — O ambiente de desenvolvimento deve subir completamente com um unico comando (`docker compose up`).
- **RNF11** — Falhas na conexao com a blockchain devem ser tratadas com mensagens claras, sem comprometer o estado dos demais documentos.
- **RNF12** — O sistema deve realizar rollback do registro local em caso de falha definitiva na transacao blockchain.

**Escalabilidade:**

- **RNF13** — A camada de storage deve ser abstraida via interface (`IStorageService`) para permitir troca futura de Local por IPFS sem refactor.
- **RNF14** — A arquitetura deve permitir escalar horizontalmente o backend (stateless, JWT em vez de sessao em memoria).

**Usabilidade:**

- **RNF15** — A interface deve ser responsiva (mobile-first), funcionando em telas a partir de 360 px.
- **RNF16** — A complexidade tecnica de blockchain deve ser abstraida — o usuario nunca precisa entender carteiras, gas ou ABIs.
- **RNF17** — Feedback visual claro em todas as operacoes (spinners, toasts, badges de status).

**Manutenibilidade:**

- **RNF18** — O codigo deve seguir padroes ESLint + Prettier com TypeScript em modo strict.
- **RNF19** — O Smart Contract deve possuir 100% de cobertura de testes automatizados.
- **RNF20** — A API deve ter documentacao Swagger automatizada e atualizada a cada deploy.

---

### 2.5 Regras de Negocio

- **RN01** — Cada hash SHA-256 so pode ser registrado uma unica vez no Smart Contract. Tentativas de registro duplicado retornam erro `DocumentAlreadyRegistered`.
- **RN02** — O hash registrado on-chain corresponde ao arquivo **original** (antes da criptografia), de modo que a verificacao possa ser feita sem descriptografar.
- **RN03** — Documentos pertencem exclusivamente ao usuario que os registrou — nao ha compartilhamento na versao inicial.
- **RN04** — A verificacao publica (`/verify`) nao expoe metadados sensiveis (nome do arquivo, dono, etc.) — apenas confirma se o hash existe na blockchain e seus dados publicos (data, endereco que registrou).
- **RN05** — Apenas usuarios autenticados podem fazer upload e gerenciar documentos.
- **RN06** — O download do arquivo descriptografado e permitido apenas ao usuario proprietario.
- **RN07** — Documentos com status `FAILED` podem ser reenviados (tentativa de re-registro), desde que o hash nao tenha sido confirmado on-chain em transacao anterior.
- **RN08** — O tamanho maximo permitido por arquivo e de 50 MB.
- **RN09** — Apenas hashes SHA-256 validos (64 caracteres hexadecimais) sao aceitos no endpoint de verificacao publica.

---

### 2.6 Fora do Escopo

Para manter o escopo factivel e coerente com a proposta de **produto SaaS open-source rodando em testnet**, os seguintes itens **nao serao** implementados nesta primeira versao:

- Assinatura digital com certificado ICP-Brasil — DocChain trabalha apenas com hash + blockchain, sem integracao com cartorios ou certificadoras
- Multiusuario / Compartilhamento de documentos — cada usuario gerencia apenas seus proprios documentos
- Multiempresa / Multi-tenant — sem isolamento de organizacoes
- Integracao com sistemas externos (SAP, TOTVS, ERPs em geral)
- Storage remoto IPFS — fica como evolucao futura (a interface ja prepara o caminho)
- Migracao para Mainnet — **por opcao estrategica**, o DocChain opera apenas em testnet Sepolia, mantendo uso gratuito e a natureza open-source; mainnet fica como evolucao opcional
- Aplicativo mobile nativo — somente interface web responsiva
- Modelo de monetizacao (cobranca / billing / assinatura) — **por opcao estrategica**, o DocChain e open-source e gratuito; billing fica como caminho futuro caso a comunidade evolua o produto comercialmente
- Notificacoes por email ou push — sem servico de envio configurado
- Recuperacao de senha por email — fluxo simplificado, sem SMTP
- 2FA / MFA — autenticacao com email + senha + JWT apenas
- Auditoria avancada / Logs estruturados — apenas logging basico
- Painel administrativo — sem area admin para gestao de usuarios
- Relatorios e exportacoes — sem export PDF, CSV ou Excel

Esses itens compoem o **backlog de evolucao futura** — caso a comunidade open-source contribua ou surjam casos de uso especificos, podem ser explorados em iteracoes posteriores sem comprometer a arquitetura atual (que ja foi desenhada com extensibilidade em mente: `IStorageService` abstrato, backend stateless, modulos independentes).

---

## 3. Fluxos e Comportamento do Sistema

Esta secao demonstra como o sistema funciona em seus fluxos principais e tratamentos de erro.

---

### 3.1 Fluxo Principal — Registro de Documento

O fluxo principal do DocChain e o registro de um documento na blockchain, executado em 12 etapas:

1. **Login** — Usuario acessa `/login`, informa email e senha, recebe JWT armazenado em httpOnly cookie
2. **Acesso ao upload** — Usuario navega para `/upload`
3. **Selecao do arquivo** — Usuario arrasta arquivo na dropzone ou clica para selecionar (max. 50 MB)
4. **Confirmacao** — Usuario clica em "Registrar na Blockchain"
5. **Envio multipart** — Frontend envia POST /documents com arquivo + Authorization Bearer JWT
6. **Validacao backend** — JwtAuthGuard valida token; Multer carrega arquivo em buffer
7. **Criacao do registro** — DB persiste registro inicial com status `PENDING`
8. **Calculo do hash** — `CryptoService.hashFile(buffer)` gera SHA-256 do arquivo original
9. **Criptografia** — `CryptoService.encrypt(buffer)` gera ciphertext + IV + authTag (AES-256-GCM)
10. **Armazenamento** — `StorageService.save(ciphertext, hash)` grava em `/uploads/{hash}.enc`
11. **Registro on-chain** — `BlockchainService.registerDocument(hash, storageRef)` chama o contrato e aguarda 1 confirmacao
12. **Atualizacao final** — Status = `CONFIRMED`; persiste `txHash`, `blockNumber`, `encryptionIv`, `encryptionAuthTag`

Apos a confirmacao, o frontend atualiza a UI mostrando o hash truncado, link Etherscan e badge "Confirmado".

![Diagrama de Sequência — fluxo principal de upload e registro on-chain](<artefatos_visuais/2 -Diagrama de Sequência — Fluxo Principal.png>)

![Fluxograma — fluxo principal de upload e registro](<artefatos_visuais/3 - Fluxograma — Fluxo Principal.png>)

---

### 3.2 Fluxo Alternativo — Verificacao Publica

A verificacao publica permite a um terceiro validar a autenticidade de um documento sem possuir conta na plataforma:

1. Visitante acessa `/verify` (rota publica, sem autenticacao)
2. Escolhe um dos modos:
   - **Modo A:** Faz upload de arquivo → frontend calcula hash SHA-256 localmente (no navegador) ou envia ao backend
   - **Modo B:** Cola um hash SHA-256 (64 caracteres hex)
3. Clica em "Verificar"
4. Frontend chama GET /verify/public/{hash}
5. Backend consulta apenas o Smart Contract (`verifyDocument(hash)`) — sem acessar o banco
6. Retorna:
   - Se registrado: `{ exists: true, registeredAt, registeredBy, blockNumber }`
   - Se nao registrado: `{ exists: false }`
7. Frontend exibe resultado publico (sem expor metadados privados como nome do dono)

![Fluxograma — fluxo de verificação pública](<artefatos_visuais/4. Fluxograma — Verificação Pública.png>)

---

### 3.3 Fluxos Alternativos — Excecoes e Erros

| Codigo | Situacao | Causa | Tratamento |
|---|---|---|---|
| **E01** | Falha na transacao blockchain durante upload | Timeout, sem saldo de ETH, contrato pausado | Status do documento marcado como `FAILED`; arquivo criptografado mantido em disco; toast de erro com motivo; permite retry |
| **E02** | Hash duplicado | Usuario tenta registrar arquivo cujo hash ja existe no contrato | Contrato retorna `DocumentAlreadyRegistered`; backend responde 409 Conflict; frontend exibe mensagem clara |
| **E03** | Arquivo acima de 50 MB | Upload excede o limite | Backend responde 413 Payload Too Large antes de processar; frontend valida tamanho antes do envio |
| **E04** | Token JWT expirado | Sessao maior que 15 min | Backend responde 401; axios interceptor redireciona automaticamente para `/login` |
| **E05** | Tentativa de acessar documento de outro usuario | userId nao confere | Backend responde 404 (intencionalmente vago, para nao expor existencia); frontend exibe "Documento nao encontrado" |
| **E06** | Falha na descriptografia | Chave alterada ou arquivo corrompido | Backend responde 500 com mensagem generica; logs internos detalham o erro real |
| **E07** | Hash invalido na verificacao publica | Formato incorreto (nao tem 64 hex chars) | Backend responde 400 Bad Request com mensagem explicativa |

![Diagrama de Atividade — tratamento de erros E01 (falha blockchain) e E02 (hash duplicado)](<artefatos_visuais/5. Diagrama de Atividade — Erros E01 e E02.png>)

---

## 4. Mockups e Experiencia do Usuario (UX)

Esta secao apresenta a visualizacao do produto antes da implementacao, validando o fluxo de navegacao, a organizacao da interface e a clareza da experiencia.

---

### 4.1 Fluxo de Navegacao

O DocChain possui as seguintes rotas:

**Rotas Publicas (sem autenticacao):**
- `/login` — Tela de login
- `/register` — Tela de cadastro
- `/verify` — Verificacao publica

**Rotas Protegidas (dashboard):**
- `/dashboard` — Lista de documentos do usuario
- `/upload` — Upload de novo documento
- `/documents/[id]` — Detalhe + verificacao + download de um documento

**Estrutura de navegacao:**

```
[Entrada]
   |
   v
/login <----> /register
   |
   v
/dashboard <----> /upload
   |                |
   +---> /documents/[id]

[Acesso publico independente]
/verify
```

![Fluxo de Navegação entre telas](<artefatos_visuais/6. Fluxo de Navegação (entre telas).png>)

---

### 4.2 Wireframes e Mockups das Telas

A seguir, descricao das principais telas. Cada uma deve ser produzida no **Figma** (recomendado) com layout responsivo (desktop 1440 px e mobile 375 px).

**Tela 1: /login**
- **Funcionalidade:** Autenticar usuario existente
- **Componentes:** Logo, titulo "Entrar", campo email, campo senha, botao "Entrar", link "Criar conta"
- **Acoes:** Submeter formulario → POST /auth/login → recebe JWT → redireciona para `/dashboard`
- **Estados:** Loading no botao durante request; toast de erro em credenciais invalidas

![Mockup da tela /login](<artefatos_visuais/7 - login.png>)

**Tela 2: /register**
- **Funcionalidade:** Criar nova conta
- **Componentes:** Campos email, senha, nome, botao "Criar conta", link "Ja tenho conta"
- **Acoes:** POST /auth/register → auto-login → redireciona para `/dashboard`

![Mockup da tela /register](<artefatos_visuais/7 - cadastro.png>)

**Tela 3: /dashboard**
- **Funcionalidade:** Visao geral dos documentos do usuario
- **Componentes:**
  - Sidebar (desktop) ou Navbar (mobile) com itens: Dashboard, Upload, Sair
  - 3 cards de estatisticas: Total / Confirmados / Pendentes
  - Tabela paginada com colunas: Nome, Hash truncado, Status (badge colorido), Data, Acoes
  - Botao "Novo Upload" em destaque
  - **Empty state:** ilustracao + botao "Fazer primeiro upload"
- **Estados:** Skeleton durante load; mensagem de erro em caso de falha

![Mockup da tela /dashboard](<artefatos_visuais/7 - dashboard.png>)

**Tela 4: /upload**
- **Funcionalidade:** Subir e registrar um documento
- **Componentes:**
  - Dropzone grande (drag-and-drop ou click)
  - Preview do arquivo selecionado (nome, tamanho, tipo)
  - Botao "Registrar na Blockchain"
  - **Stepper visual** mostrando os estados: Aguardando → Calculando hash → Criptografando → Registrando on-chain → Confirmado
- **Estados:** idle → uploading → processing → confirming → success/error
- **Tela de sucesso:** card com hash completo (botao copiar), link Etherscan, botao "Ver no Dashboard"

![Mockup da tela /upload](<artefatos_visuais/7 - upload.png>)

**Tela 5: /documents/[id]**
- **Funcionalidade:** Detalhe completo do documento + verificacao + download
- **Componentes:**
  - Header: nome do arquivo + badge de status
  - Grid 2 colunas com metadados (tipo, tamanho, data, dono)
  - Bloco "Blockchain": hash completo, txHash, link Etherscan, bloco, wallet
  - Botao "Copiar Hash"
  - Secao "Verificar Integridade": dropzone inline
  - Resultado da verificacao: card verde (autentico) ou vermelho (falha)
  - Botao "Download Original"

![Mockup da tela /documents/[id]](<artefatos_visuais/7 - documento - id.png>)

**Tela 6: /verify (publica)**
- **Funcionalidade:** Validar autenticidade de qualquer documento sem login
- **Componentes:**
  - Layout limpo, sem sidebar
  - Toggle entre "Enviar arquivo" e "Colar hash"
  - Campo de input (arquivo ou hash)
  - Botao "Verificar"
  - Resultado: card verde (autentico, com dados blockchain) ou cinza (nao encontrado)
  - Link para `/register` convidando o visitante a se cadastrar

![Mockup da tela /verify (pública)](<artefatos_visuais/7 - verify doc.png>)

---

### 4.3 Fluxo de Interacao do Usuario

Demonstracao passo a passo do fluxo principal (cadastro + registro de documento + verificacao):

1. Usuario acessa o sistema em `/login`
2. Como nao tem conta, clica em "Criar conta" → `/register`
3. Preenche email, senha, nome e clica em "Criar conta"
4. E auto-logado e redirecionado para `/dashboard`, que mostra empty state
5. Clica em "Novo Upload" → navega para `/upload`
6. Arrasta um PDF para a dropzone (ou clica e seleciona)
7. Confere preview com nome e tamanho do arquivo
8. Clica em "Registrar na Blockchain"
9. Acompanha visualmente o stepper: hash → criptografia → on-chain
10. Apos ~20 segundos, ve a tela de sucesso com hash + link Etherscan
11. Clica em "Ver no Dashboard" e ve o documento listado com status "Confirmado"
12. Clica no documento → navega para `/documents/[id]`
13. Le os metadados, copia o hash, abre o link Etherscan em nova aba
14. Na secao "Verificar Integridade", faz upload do mesmo arquivo → recebe resultado **autentico**
15. (Teste negativo) Altera 1 byte do arquivo e tenta verificar → recebe resultado **falhou**

> **Nota:** a descricao sequencial dos 15 passos acima, combinada com os mockups das 6 telas (secao 4.2) e o diagrama de Fluxo de Navegacao (secao 3), cumpre o requisito de "sequencia de telas ou fluxo visual" do template de RFC da Catolica SC.

---

### 4.4 Feedback Inicial de Usuarios (Opcional)

Apos a producao dos mockups, sugere-se conduzir uma validacao rapida com **3 a 5 representantes do publico-alvo** (advogados, contadores, estudantes) atraves de:

- Apresentacao do prototipo navegavel do Figma
- Roteiro de 5 tarefas: criar conta, fazer upload, ver detalhe, verificar, baixar
- Anotacao de pontos de friccao em cada tarefa
- Coleta de sugestoes via formulario curto (Google Forms ou Typeform gratuito)

> **Nota:** sessao opcional segundo o template de RFC da Catolica SC. Pode ser executada apos a producao dos mockups (ja concluida) como reforco de validacao, sem impacto no fechamento do RFC.

---

## 5. Arquitetura do Sistema

Esta secao apresenta como o sistema sera construido, utilizando o modelo C4 para descrever a arquitetura em diferentes niveis de abstracao.

---

### 5.1 Diagrama C4

**Nivel 1 — Diagrama de Contexto**

Visao macro do DocChain como caixa preta dentro do seu ecossistema.

- **Atores:**
  - **Usuario** (autenticado) — registra e gerencia seus documentos
  - **Verificador Publico** (visitante) — consulta autenticidade sem autenticacao
- **Sistema Principal:** DocChain (plataforma web)
- **Sistemas Externos:**
  - **Sepolia Testnet (Ethereum)** — recebe transacoes do contrato DocumentRegistry e armazena hashes imutaveis
  - **Etherscan** — explorador publico de transacoes Ethereum, consultado via deep-link para visualizacao da tx
- **Fluxo de Valor:**
  - Usuario envia arquivo → DocChain processa → registra hash on-chain → retorna confirmacao
  - Verificador envia hash → DocChain consulta blockchain → retorna prova publica

![Diagrama C4 Nível 1 — Contexto do sistema DocChain](<artefatos_visuais/8 - C4 — Nível 1 (Contexto).png>)

**Nivel 2 — Diagrama de Containers**

Decomposicao do sistema em unidades de execucao independentes:

- **docchain-web** — Aplicacao **Next.js 14** com App Router, servida via Node.js. Entrega SSR/CSR para o navegador. Comunica-se via HTTPS/JSON com a API.
- **docchain-api** — Aplicacao **NestJS 11** expondo REST API. Orquestra fluxos de upload, criptografia, storage e blockchain.
- **docchain-db** — **PostgreSQL 16** armazenando users e documents (apenas metadados).
- **docchain-storage** — **Volume Docker** montado em `/uploads`, armazenando arquivos criptografados.
- **docchain-contracts** (externo) — Smart Contract **DocumentRegistry.sol** implantado na Sepolia. Acessado via Ethers.js + provider RPC (Infura/Alchemy).

**Protocolos de comunicacao:**

| Origem | Destino | Protocolo |
|---|---|---|
| Browser | docchain-web | HTTPS |
| docchain-web | docchain-api | HTTPS / JSON (REST) |
| docchain-api | docchain-db | TCP / PostgreSQL wire protocol (porta 5432) |
| docchain-api | docchain-storage | Filesystem local |
| docchain-api | Sepolia (via RPC) | HTTPS / JSON-RPC |

![Diagrama C4 Nível 2 — Containers do sistema DocChain](<artefatos_visuais/9. C4 — Nível 2 (Containers).png>)

**Nivel 3 — Diagrama de Componentes (foco no docchain-api)**

Estrutura interna do backend NestJS, organizado em modulos:

- **AuthModule**
  - `AuthController` (POST /auth/register, POST /auth/login)
  - `AuthService` (bcrypt para hash de senha; JwtService para emitir tokens)
  - `JwtStrategy` + `JwtAuthGuard` (Passport)
- **DocumentsModule**
  - `DocumentsController` (rotas POST/GET/DELETE de /documents e /verify)
  - `DocumentsService` (orquestra o fluxo hash → crypto → storage → blockchain)
- **CryptoService** (provider interno)
  - `hashFile(buffer)` → SHA-256
  - `encrypt(buffer)` / `decrypt(ciphertext, iv, authTag)` → AES-256-GCM
- **StorageModule**
  - `IStorageService` (interface)
  - `LocalStorageService` (implementacao filesystem em `/uploads`)
- **BlockchainModule**
  - `BlockchainService` (Ethers.js: `registerDocument`, `verifyDocument`, `isRegistered`)
- **PrismaModule (global)**
  - `PrismaService` (singleton do cliente Prisma)
- **Infraestrutura transversal**
  - `GlobalExceptionFilter` (filtro global de erros)
  - `ThrottlerGuard` (rate limiting)
  - `SwaggerModule` (documentacao OpenAPI)

![Diagrama C4 Nível 3 — Componentes internos do container docchain-api](<artefatos_visuais/10. C4 — Nível 3 (Componentes do docchain-api).png>)

---

### 5.2 Modelo de Dados

O DocChain utiliza **PostgreSQL** com **quatro entidades** (gerenciadas via Prisma ORM): duas entidades de domínio (`User`, `Document`) e duas entidades operacionais para compliance e analytics (`AuditLog`, `VerificationAttempt`).

**Entidade User:**

| Atributo | Tipo | Restricoes |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| passwordHash | VARCHAR(60) | NOT NULL |
| name | VARCHAR(120) | NOT NULL |
| createdAt | TIMESTAMP | NOT NULL, default now() |
| updatedAt | TIMESTAMP | NOT NULL, auto-updated |

**Entidade Document:**

| Atributo | Tipo | Restricoes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User.id, NOT NULL, INDEX |
| fileName | VARCHAR(255) | NOT NULL |
| mimeType | VARCHAR(100) | NOT NULL |
| size | INTEGER | NOT NULL |
| hash | VARCHAR(64) | UNIQUE, NOT NULL, INDEX |
| storageRef | VARCHAR(255) | NOT NULL |
| storageType | ENUM (LOCAL, IPFS) | default LOCAL |
| encryptionIv | VARCHAR(32) | NOT NULL |
| encryptionAuthTag | VARCHAR(32) | NOT NULL |
| status | ENUM (PENDING, PROCESSING, CONFIRMED, FAILED) | default PENDING, INDEX |
| network | VARCHAR(20) | default 'sepolia' |
| txHash | VARCHAR(66) | NULLABLE |
| blockNumber | BIGINT | NULLABLE |
| walletAddress | VARCHAR(42) | NULLABLE |
| confirmedAt | TIMESTAMP | NULLABLE |
| failureReason | TEXT | NULLABLE |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

**Entidade AuditLog:**

Trilha de auditoria das ações sensíveis dos usuários — atende requisitos de **compliance LGPD** (rastreabilidade) e permite investigação de incidentes de segurança.

| Atributo | Tipo | Restricoes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User.id, NULLABLE (NULL para acoes publicas), INDEX |
| action | ENUM (LOGIN, LOGOUT, REGISTER, UPLOAD, DOWNLOAD, DELETE, VERIFY_PUBLIC, VERIFY_PRIVATE) | NOT NULL, INDEX |
| resourceType | VARCHAR(50) | NULLABLE — "document", "user" etc. |
| resourceId | UUID | NULLABLE — ID do recurso afetado |
| ipAddress | VARCHAR(45) | NULLABLE — IPv4 ou IPv6 |
| userAgent | VARCHAR(500) | NULLABLE |
| metadata | JSONB | NULLABLE — dados especificos da acao (ex: { fileName, hash }) |
| createdAt | TIMESTAMP | NOT NULL, default now(), INDEX |

**Entidade VerificationAttempt:**

Log de toda tentativa de verificacao (publica via `/verify` ou privada via dashboard). Usado para **analytics de uso** do produto, **anti-abuso** (rate limiting baseado em IP) e demonstracao de aderencia real do mercado.

| Atributo | Tipo | Restricoes |
|---|---|---|
| id | UUID | PK |
| hash | VARCHAR(64) | NOT NULL — SHA-256 consultado, INDEX |
| found | BOOLEAN | NOT NULL — true se hash existe on-chain |
| documentId | UUID | FK → Document.id, NULLABLE, INDEX |
| userId | UUID | FK → User.id, NULLABLE (NULL para verificacao publica) |
| source | ENUM (PUBLIC, PRIVATE) | NOT NULL, default PUBLIC |
| ipAddress | VARCHAR(45) | NULLABLE |
| userAgent | VARCHAR(500) | NULLABLE |
| createdAt | TIMESTAMP | NOT NULL, default now(), INDEX |

**Relacionamentos:**
- Um **User** possui **muitos Documents** (1:N)
- Um **Document** pertence a exatamente um **User**
- Um **User** gera **muitos AuditLogs** (1:N, cascade SET NULL no delete do user)
- Um **User** gera **muitas VerificationAttempts privadas** (1:N, cascade SET NULL)
- Um **Document** pode ter **muitas VerificationAttempts** associadas (1:N, cascade SET NULL)

![Diagrama Entidade-Relacionamento — modelo de dados do DocChain (4 tabelas)](<artefatos_visuais/11. DER (Diagrama Entidade-Relacionamento).png>)

---

### 5.3 Principais Componentes

**Backend (docchain-api):**

- **AuthModule** — Cadastro, login e gestao de tokens JWT
- **DocumentsModule** — Endpoints REST para upload, listagem, detalhe, verificacao e download
- **CryptoService** — Hash SHA-256 e criptografia/descriptografia AES-256-GCM
- **StorageModule** — Camada de persistencia de arquivos com interface abstrata (futura troca por IPFS sem refactor)
- **BlockchainModule** — Integracao com Smart Contract via Ethers.js (`registerDocument`, `verifyDocument`, `isRegistered`)
- **PrismaModule** — Acesso a banco PostgreSQL com cliente tipado

**Smart Contract (docchain-contracts):**

- **DocumentRegistry.sol** — Contrato com mapping `bytes32 -> DocumentRecord`, funcoes `registerDocument`, `verifyDocument`, `isRegistered`, evento `DocumentRegistered`

**Frontend (docchain-web):**

- **App Router (Next.js 14)** — Rotas estaticas (`/login`, `/register`, `/verify`) e dinamicas (`/documents/[id]`)
- **Middleware de Autenticacao** — Protege rotas privadas verificando cookie JWT
- **Zustand Store** — Estado global de autenticacao
- **API Client (axios)** — Comunicacao com backend com interceptors automaticos para Bearer token e tratamento de 401
- **Componentes UI** — DocumentTable, UploadDropzone, VerifyDropzone, StatusBadge, VerificationResult

**Infraestrutura:**

- **Docker Compose** — Orquestra PostgreSQL, API e Web em um unico comando
- **Volumes persistentes** — `pgdata` (banco) e `uploads` (arquivos criptografados)

---

### 5.4 Stack Tecnologica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Smart Contracts | Solidity 0.8.24 + Hardhat 2.28 | Linguagem padrao de Ethereum; Hardhat oferece ambiente de teste, deploy e console interativo |
| Blockchain | Ethereum Sepolia Testnet | Testnet gratuita, ampla documentacao, suporte a Ethers.js e Etherscan |
| Lib Blockchain | Ethers.js v6 | API moderna, melhor TypeScript, BigInt nativo, bundle menor que web3.js |
| Backend | NestJS 11 + TypeScript | Arquitetura modular, DI nativa, integracao com Passport/JWT/Swagger/Throttler |
| ORM | Prisma 7 | Schema declarativo como documentacao viva, migrations automaticas, cliente totalmente tipado |
| Banco | PostgreSQL 16 | Relacional robusto, suporte a UUID, indices avancados, padrao da industria |
| Autenticacao | bcrypt + JWT (Passport) | bcrypt para hashing de senha; JWT stateless para escalabilidade horizontal |
| Upload | Multer (memoryStorage) | Padrao do NestJS; processamento em memoria sem persistencia temporaria |
| Criptografia | Node.js crypto (SHA-256 + AES-256-GCM) | Nativo, sem dependencia externa, padrao da industria |
| Validacao | class-validator + Joi | class-validator para DTOs; Joi para validar env vars |
| Documentacao API | Swagger / OpenAPI | Documentacao automatica a partir de decorators NestJS |
| Frontend | Next.js 14 (App Router) + TypeScript | Server Components, SSR/CSR hibrido, melhor DX |
| Estilizacao | Tailwind CSS + shadcn/ui | Utility-first; shadcn fornece componentes acessiveis customizaveis |
| Estado global | Zustand 4 | Boilerplate minimo, hook-based, ideal para auth state |
| HTTP Client | axios | Interceptors faceis para injetar Authorization Bearer e tratar 401 |
| Upload UI | react-dropzone | Drag-and-drop com validacao de tipo e tamanho |
| Notificacoes | sonner | Toasts modernos e acessiveis |
| Infraestrutura | Docker + Docker Compose | Ambiente reproduzivel; "docker compose up" sobe tudo |
| Versionamento | Git + GitHub | Versionamento distribuido; GitHub para colaboracao e CI futuro |

**Justificativas-chave:**

- **NestJS x Express puro:** NestJS impoe estrutura modular (modules, controllers, services, providers) e ja integra IoC, Swagger, Throttler e Passport — economiza tempo e mantem o codigo organizado em um projeto academico.
- **Prisma x TypeORM:** Prisma tem melhor migration story, schema unico como fonte de verdade e cliente totalmente tipado, reduzindo bugs em tempo de execucao.
- **Sepolia x Mainnet:** Sepolia e gratuita e tem a mesma arquitetura tecnica do mainnet — ideal para TCC. Migracao futura para mainnet ou L2 (Polygon, Arbitrum) e direta.
- **AES-256-GCM x AES-CBC:** GCM e autenticado (authTag detecta adulteracao em repouso), consolidado como padrao moderno.
- **Hash do arquivo original x Hash do criptografado:** Hashear o arquivo original permite verificacao publica sem necessidade de descriptografar — essencial para o caso de uso `/verify` e para a propriedade de "prova publica".

---
