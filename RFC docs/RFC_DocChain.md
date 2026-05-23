**Engenharia de Software — Católica SC**

---

## Identificação

- **Título do Projeto:** DocChain — Plataforma de Registro Documental com Prova de Integridade em Blockchain
- **Linha de Projeto (Direction):** Web / Plataforma
- **Autor:** *Rafael Pavesi dos Passos*
- **Data da Proposta:** 12/04/2026
- **Versão:** 1.0

---

## 1. Visão do Produto e Impacto (O Problema)

> Este projeto resolve um problema real ou e apenas um exercício técnico?

O DocChain resolve um problema real e crescente: a necessidade de garantir autenticidade, integridade e rastreabilidade de documentos digitais em um mundo onde fraudes documentais, adulteração de arquivos e falta de mecanismos de auditoria são riscos concretos para empresas, instituições acadêmicas e órgãos públicos.

---

### 1.1 Contexto e Problema

A gestão de documentos digitais é um dos pilares de qualquer organização moderna. Contratos, certificados, laudos, diplomas, notas fiscais e relatórios circulam diariamente em formato digital, porém sem garantias reais de que não foram adulterados após sua emissão.

**Quem sofre com esse problema:**
- Empresas que precisam comprovar a autenticidade de contratos e documentos regulatórios
- Instituições acadêmicas que emitem diplomas e certificados suscetíveis a falsificação
- Departamentos jurídicos que dependem da integridade de provas documentais
- Profissionais autônomos que enviam propostas, relatórios e laudos a clientes

**Contexto em que o problema ocorre:**
- Troca de documentos entre partes que não se conhecem ou não confiam mutuamente
- Auditorias internas ou externas que precisam verificar se um documento e original
- Disputas contratuais onde a autenticidade de um documento e questionada

**Como o problema e resolvido hoje:**
- Assinatura digital com certificado ICP-Brasil (custosa e burocratica)
- Cartórios de registro de documentos (presencial, lento, caro)
- Envio por email com "fé de recebimento" (sem garantia técnica de integridade)
- Hash manual compartilhado por canais separados (processo frágil e não padronizado)

**Limitações das soluções atuais:**
- Custo elevado de certificados digitais e serviços cartoriais
- Dependência de intermediários centralizados (cartórios, certificadoras)
- Ausência de verificação pública e transparente — apenas quem possui o certificado pode validar
- Nenhuma das soluções tradicionais combina criptografia + armazenamento seguro + registro imutável em um único fluxo

---

### 1.2 Origem da Demanda e Evidências

**Posicionamento do Produto:**
- O DocChain é um produto **SaaS open-source** de registro documental com blockchain, construído com a mesma arquitetura, qualidade e padrões de uma plataforma comercial real (autenticação, criptografia em repouso, API REST documentada, frontend responsivo, integração on-chain, infra containerizada)
- A opção por permanecer na **rede de teste Sepolia** e estratégica, não acadêmica: mantém o produto **gratuito**, **auditável** publicamente pela comunidade e coerente com a filosofia open-source — qualquer pessoa pode clonar o repositório, rodar localmente e contribuir
- O projeto e tambem entregue como **Projeto Portfólio (TCC)** da Católica SC, demonstrando competência técnica em desenvolvimento full-stack, segurança da informação e tecnologia blockchain
- A escolha do tema foi motivada pela crescente adoção de blockchain para verificação de credenciais por governos e universidades, e pelo cenário alarmante de fraudes documentais no Brasil e no mundo

**Evidência de Interesse — Adoção Institucional de Blockchain para Documentos:**

A demanda por verificação de documentos via blockchain já e reconhecida por governos e instituições:

- **Ministério da Educação (Brasil)** — lancou o programa de Diploma Digital com blockchain para toda a rede de ensino público federal, com previsão de beneficiar mais de 1,3 milhão de estudantes matriculados em cursos de graduação (fonte: Cointelegraph Brasil)
- **UFPB (Universidade Federal da Paraíba)** — pioneira no Brasil em utilizar blockchain para registro de diplomas, criando uma rede de integridade com multiplas camadas de validação para processos de emissão e anulação de diplomas (fonte: Livecoins)
- **Universidade de Nicosia (Chipre)** — em 2014, tornou-se a primeira instituição no mundo a registrar certificados de conclusão de curso em blockchain (fonte: Bloomberg Linea)
- **MIT (EUA)** — implementou o programa Digital Diplomas, permitindo que graduados recebam diplomas verificáveis em blockchain
- **Mercado global** — o mercado de verificação de documentos cresceu de USD 4,24 bilhões em 2024 para USD 5,05 bilhões em 2025 (CAGR de 19,3%), com projeção de atingir USD 9,94 bilhões até 2029 (fonte: Research and Markets)
- **Regulamentações** como a LGPD e o Marco Civil da Internet exigem cada vez mais rastreabilidade e integridade de dados, criando demanda por ferramentas que comprovem a não adulteração de documentos

**Cenário de Fraude Documental — Por que isso importa:**

A fraude documental é um problema estrutural e bilionário que reforça a urgência de mecanismos de verificação de integridade:

*No Brasil:*
- A sonegação fiscal atinge cerca de **R$ 600 bilhões por ano** (fonte: Sindifisco Nacional)
- A Receita Federal desarticulou um esquema de fraude fiscal de **R$ 26 bilhões** envolvendo o grupo Refit em São Paulo (fonte: Agência Brasil)
- No Ceará, a Sefaz identificou 68 empresas de fachada que emitiram **R$ 1,4 bilhão em notas fiscais falsas** (fonte: GC Mais)
- No Paraná, foram identificadas **844 "empresas noteiras"** desde 2017, que emitiram notas de operações ficticias totalizando **R$ 4,8 bilhões** (fonte: Diário dos Campos)
- A Polícia Civil investigou um esquema que movimentou mais de **R$ 7,6 bilhões em notas fiscais frias** utilizando empresas ficticias (fonte: Metrópoles)

Esses números evidenciam a necessidade urgente de ferramentas que garantam a integridade e autenticidade de documentos de forma transparente e verificável — exatamente o problema que o DocChain se propoe a resolver.

**Pesquisa com Usuários e Dados de Mercado:**

Conversas informais com profissionais de TI, jurídico e contabilidade de pequenas e médias empresas, combinadas com dados públicos de pesquisas, revelaram um cenário preocupante:

- **Maturidade digital baixa** — Segundo pesquisa da FGV, 66% das micro e pequenas empresas brasileiras estão nos níveis 1 e 2 de maturidade digital (18% no nível "analogico" e 48% no nível "emergente"). Isso significa que a maioria sequer possui processos digitais estruturados para gestão de documentos
- **Integração de sistemas precaria** — Apenas 41% das empresas brasileiras possuem integração entre gestão documental e outros sistemas. Empresas integradas reportam 47% mais eficiência operacional, evidenciando o custo de não adotar ferramentas adequadas
- **Compliance desconhecido** — Dados do Sebrae indicam que apenas 29% das PMEs sabem que programas de integridade podem atenuar penas em processos de corrupção, mostrando baixo conhecimento sobre a importância da rastreabilidade documental
- **Barreiras financeiras e de conhecimento** — 25% das PMEs apontam a falta de conhecimento sobre como conduzir a transformação digital como principal obstáculo. Empresas menores enfrentam dificuldade para adquirir e integrar novas tecnologias por limitação de recursos financeiros e humanos
- **Dependência de certificação cara** — A única ferramenta amplamente reconhecida para verificação de integridade documental no Brasil é o certificado ICP-Brasil, que exige custos anuais de R$ 150-500 por certificado — inviável para a maioria das PMEs

*Principais dores identificadas nas conversas:*
- Ausência de mecanismo automatizado de verificação de integridade de documentos
- Custo proibitivo de certificação digital para empresas de pequeno porte
- Falta de histórico ou trilha de auditoria sobre documentos enviados e recebidos
- Dependência total de terceiros centralizados (cartórios, certificadoras) para comprovar autenticidade
- Receio de disputas contratuais sem poder provar que um documento não foi adulterado após o envio

---

### 1.3 Análise de Soluções Existentes (Benchmark)

| Solução | Link | Público-Alvo | Funcionalidades Principais | Limitações |
|---|---|---|---|---|
| **Blockcerts** | blockcerts.org | Universidades e emissores de credenciais | Emissão e verificação de certificados em blockchain (Bitcoin/Ethereum) | Focado exclusivamente em credenciais acadêmicas; não suporta documentos genéricos; sem criptografia de conteúdo |
| **OriginalMy** | originalmy.com | Empresas e pessoas fisicas (Brasil) | Registro de autenticidade de documentos em blockchain; assinatura digital | Serviço pago com planos mensais; código fechado; dependência total do provedor |
| **OpenTimestamps** | opentimestamps.org | Desenvolvedores e entusiastas | Carimbo de tempo em blockchain Bitcoin (prova de existência) | Apenas timestamp — não armazena, não criptografa, não oferece interface amigável |
| **Certisign** | certisign.com.br | Empresas com obrigatoriedade de certificado ICP-Brasil | Assinatura digital com validade jurídica, certificados A1/A3 | Custo elevado (R$ 150-500/ano por certificado); burocratico; sem verificação pública descentralizada |
| **DocuSign** | docusign.com | Empresas globais | Assinatura eletrônica, workflow de documentos, auditoria | Centralizado; caro para PMEs; não usa blockchain; confiança depositada no provedor |

**Comparação:**

| Criterio | Blockcerts | OriginalMy | OpenTimestamps | Certisign | DocuSign | **DocChain** |
|---|---|---|---|---|---|---|
| Registro em blockchain | Sim | Sim | Sim | Não | Não | **Sim** |
| Criptografia do arquivo | Não | Parcial | Não | Não | Não | **Sim (AES-256-GCM)** |
| Verificação pública | Sim | Parcial | Sim | Não | Não | **Sim** |
| Código aberto | Sim | Não | Sim | Não | Não | **Sim** |
| Documentos genéricos | Não | Sim | Sim | Sim | Sim | **Sim** |
| Interface web amigável | Limitada | Sim | Não | Sim | Sim | **Sim** |
| Custo | Gratuito | Pago | Gratuito | Pago | Pago | **Gratuito (testnet)** |

**Diferencial do Projeto:**

O DocChain se diferencia por combinar em uma única plataforma open-source:
1. **Criptografia end-to-end** (AES-256-GCM) — o arquivo e armazenado criptografado, não apenas registrado
2. **Registro on-chain transparente** — qualquer pessoa pode verificar a existência de um documento na blockchain sem depender do provedor
3. **Verificação pública sem autenticação** — terceiros podem verificar a autenticidade de um documento sem precisar de conta na plataforma
4. **Stack moderna e auditável** — código aberto, arquitetura modular, e tecnologias amplamente utilizadas no mercado

Nenhuma das soluções existentes combina criptografia de conteúdo + armazenamento seguro + registro imutável + verificação pública em uma plataforma open-source com interface amigável.

---

### 1.4 Público-Alvo

**Usuários primarios:**
- **Profissionais autônomos** (advogados, contadores, consultores) que precisam registrar a autenticidade de documentos enviados a clientes, garantindo prova de integridade em caso de disputa
- **Pequenas e médias empresas** que não possuem orçamento para soluções corporativas de assinatura digital (Certisign, DocuSign), mas precisam de um mecanismo confiável de verificação

**Usuários secundarios:**
- **Estudantes e pesquisadores** interessados em entender na prática como blockchain pode ser aplicada a problemas reais de segurança da informação
- **Desenvolvedores** que buscam uma referência open-source de integração NestJS + Solidity + Next.js

**Perfil do usuário:**
- Conhecimento técnico básico a intermediário (sabe usar navegador web, fazer upload de arquivos)
- Não necessita conhecer blockchain — a complexidade técnica e abstraida pela interface
- Acesso via navegador

**Contexto de uso:**
- Escritório ou home office, durante o fluxo de trabalho com documentos
- Upload pontual de documentos importantes (contratos, laudos, certificados)
- Verificação ocasional quando a autenticidade de um documento e questionada

---

### 1.5 Objetivos do Projeto

**Objetivo Geral:**

Desenvolver uma plataforma web funcional que permita o registro, armazenamento seguro e verificação de autenticidade de documentos digitais, utilizando criptografia e blockchain como mecanismos de prova de integridade — demonstrando competência técnica em desenvolvimento full-stack e tecnologias emergentes.

**Objetivos Específicos:**

1. **Implementar um Smart Contract** em Solidity para registro imutável de hashes de documentos na rede Sepolia (testnet Ethereum), garantindo rastreabilidade e auditabilidade on-chain. A permanência na Sepolia é uma **opção estratégica do produto** — mantém o uso gratuito, alinhado com a natureza open-source da plataforma. Migração para mainnet (Ethereum, Polygon ou Arbitrum) fica disponível como evolução opcional caso usos específicos exijam permanência comercial dos registros, mas não é o objetivo desta versão
2. **Construir uma API REST** com NestJS que orquestre o fluxo completo: upload, hash SHA-256, criptografia AES-256-GCM, armazenamento seguro e registro em blockchain
3. **Desenvolver uma interface web** com Next.js 14 que abstraia a complexidade técnica, oferecendo upload intuitivo, dashboard documental e verificação de integridade com feedback visual
4. **Implementar verificação pública** que permita terceiros (sem autenticação) validarem a autenticidade de um documento comparando seu hash com o registro on-chain
5. **Documentar a arquitetura e decisões técnicas** de forma clara e completa, atendendo aos requisitos acadêmicos e servindo como peca de portfolio profissional

---

### 1.6 Métricas de Sucesso (KPIs)

| Métrica | Meta | Como Medir |
|---|---|---|
| **Fluxo completo funcional** | Upload → hash → criptografia → blockchain → dashboard em um único fluxo | Teste end-to-end via interface web |
| **Tempo de registro on-chain** | Confirmação em menos de 30 segundos na Sepolia (testnet escolhida estrategicamente para manter o produto gratuito e open-source) | Medição do tempo entre envio da transação e confirmação do bloco |
| **Verificação de integridade** | 100% de acuracia — arquivo idêntico retorna "autentico", arquivo alterado retorna "falha" | Testes com arquivos originais e modificados (alteração de 1 byte) |
| **Cobertura de testes do Smart Contract** | 100% das funções do contrato cobertas por testes automatizados | Relatório do Hardhat test coverage |
| **API documentada** | Todos os endpoints documentados via Swagger (OpenAPI) | Acesso a /api/docs com documentação completa |
| **Criptografia correta** | Arquivo descriptografado idêntico ao original (zero perda de dados) | Comparação byte-a-byte entre original e descriptografado |
| **Uptime do protótipo** | Ambiente Docker funcional com um único comando (`docker compose up`) | Teste de inicialização dos serviços sem erros |

---

## 2. Engenharia de Requisitos

Esta seção define o que o sistema fara, evitando descrições vagas e ambiguidades. Os requisitos foram derivados da análise do problema (Capítulo 1) e do público-alvo identificado.

---

### 2.1 Personas

**Persona 1 — Mariana, a Advogada Autônoma**

- **Idade:** 34 anos
- **Profissao:** Advogada autônoma especializada em direito empresarial
- **Contexto:** Atende cerca de 20 clientes pessoa fisica e jurídica; envia diariamente contratos, pareceres e procurações por email
- **Objetivos:**
  - Garantir que contratos enviados não sejam alterados pelo cliente antes da assinatura
  - Ter prova jurídica de integridade caso o cliente conteste o conteúdo de um documento
  - Reduzir custos com certificação digital ICP-Brasil
- **Principais dificuldades:**
  - Custo elevado de certificados digitais (R$ 300-500/ano)
  - Falta de mecanismo simples para terceiros validarem a autenticidade
  - Receio de disputas judiciais sem prova material da versão original
- **Cenário de uso DocChain:** Antes de enviar o contrato ao cliente, Mariana faz upload na plataforma. O hash fica registrado na blockchain. Caso surja disputa, ela comprova publicamente a integridade do documento original.

**Persona 2 — Ricardo, o Contador de PME**

- **Idade:** 45 anos
- **Profissao:** Contador, dono de escritório com 8 colaboradores que atende ~150 PMEs
- **Contexto:** Lida diariamente com notas fiscais, balancos, declarações fiscais e documentos que precisam de rastreabilidade
- **Objetivos:**
  - Registrar de forma imutável a versão final de documentos contabeis enviados a clientes
  - Auditar facilmente quais documentos foram enviados em determinada data
  - Oferecer um diferencial aos clientes (verificação pública de autenticidade)
- **Principais dificuldades:**
  - Volume alto de documentos torna inviável certificar tudo via ICP-Brasil
  - Clientes ocasionalmente alegam ter recebido versão diferente do documento
  - Falta de trilha de auditoria automatizada
- **Cenário de uso DocChain:** Ricardo integra o DocChain ao fluxo do escritório. Cada documento enviado e registrado on-chain. Em fiscalizações ou auditorias, basta apresentar o hash e o link da transação.

**Persona 3 — Bianca, a Estudante de TI**

- **Idade:** 22 anos
- **Profissao:** Estudante de Engenharia de Software em fase final do curso
- **Contexto:** Estuda aplicações práticas de blockchain e busca referências de projetos open-source para basear seu próprio TCC
- **Objetivos:**
  - Entender na prática como integrar Smart Contracts a um backend tradicional
  - Estudar arquitetura modular com NestJS, Prisma e Next.js
  - Usar o código como base para seu próprio projeto de portfolio
- **Principais dificuldades:**
  - Escassez de projetos open-source que combinem Web3 com stack moderna de mercado
  - Tutoriais cobrem apenas partes isoladas (só contrato, só backend)
  - Dificuldade em encontrar exemplos didaticos mas tambem realisticos
- **Cenário de uso DocChain:** Bianca clona o repositório, sobe o ambiente com `docker compose up`, le a documentação técnica e estuda como o sistema orquestra hash + criptografia + on-chain.

---

### 2.2 Casos de Uso Principais

O sistema possui três atores principais e os seguintes casos de uso:

**Atores:**
- **Usuário Autenticado** — pessoa registrada na plataforma com acesso ao dashboard
- **Visitante (Verificador Público)** — qualquer pessoa que queira validar a autenticidade de um documento sem ter conta
- **Sistema Blockchain (Sepolia)** — ator externo que recebe e registra hashes de forma imutável

**Casos de Uso:**

| ID | Caso de Uso | Ator Principal | Descrição Resumida |
|---|---|---|---|
| UC01 | Criar Conta | Visitante | Cadastra-se com email, senha e nome para acessar a plataforma |
| UC02 | Realizar Login | Usuário | Autentica-se com email e senha, recebe JWT |
| UC03 | Fazer Upload de Documento | Usuário Autenticado | Envia arquivo que sera hasheado, criptografado e registrado on-chain |
| UC04 | Visualizar Dashboard | Usuário Autenticado | Consulta lista paginada de documentos com status e metadados |
| UC05 | Visualizar Detalhe do Documento | Usuário Autenticado | Consulta metadados completos, hash, txHash e link Etherscan |
| UC06 | Verificar Integridade (Privada) | Usuário Autenticado | Reenviia o arquivo para comparar hash com o registro original |
| UC07 | Baixar Documento Descriptografado | Usuário Autenticado | Recupera o arquivo original a partir do storage criptografado |
| UC08 | Verificar Documento Publicamente | Visitante | Sem autenticação, consulta a blockchain via hash ou arquivo |
| UC09 | Registrar Hash on-chain | Sistema -> Blockchain | Envia transação para o Smart Contract na Sepolia |
| UC10 | Confirmar Registro on-chain | Blockchain -> Sistema | Sistema aguarda confirmação de bloco e atualiza status |

![Diagrama de Casos de Uso (UML) — atores, boundary DocChain e 10 casos de uso](<artefatos_visuais/1 - Diagrama de Casos de Uso (UML).png>)

---

### 2.3 Requisitos Funcionais (RF)

**Módulo de Autenticação:**

- **RF01** — O sistema deve permitir que o Visitante crie uma conta informando email, senha e nome.
- **RF02** — O sistema deve permitir que o Usuário realize login com email e senha, recebendo um token JWT.
- **RF03** — O sistema deve invalidar tokens JWT após 15 minutos, exigindo novo login para sessões prolongadas.
- **RF04** — O sistema deve permitir que o Usuário realize logout, descartando o token no lado do cliente.

**Módulo de Upload e Registro:**

- **RF05** — O sistema deve permitir que o Usuário Autenticado faça upload de arquivos de qualquer tipo (PDF, DOCX, imagens, etc.) com tamanho máximo de 50 MB.
- **RF06** — O sistema deve calcular o hash SHA-256 do arquivo **original** (antes da criptografia) automaticamente após o upload.
- **RF07** — O sistema deve criptografar o conteúdo do arquivo utilizando AES-256-GCM antes de armazena-lo em disco.
- **RF08** — O sistema deve registrar o hash SHA-256 do documento no Smart Contract da rede Sepolia, junto com a referência de storage.
- **RF09** — O sistema deve persistir os metadados do documento (id, nome, tipo, tamanho, hash, txHash, status, datas, IV, authTag) no banco PostgreSQL.
- **RF10** — O sistema deve impedir o registro duplicado de hashes já existentes no contrato, retornando erro específico.

**Módulo de Dashboard e Consulta:**

- **RF11** — O sistema deve apresentar ao Usuário Autenticado uma lista paginada (10 itens por pagina) dos seus documentos.
- **RF12** — O sistema deve exibir cards de estatísticas com total de documentos, confirmados e pendentes.
- **RF13** — O sistema deve permitir filtrar a lista por status (PENDING, PROCESSING, CONFIRMED, FAILED).
- **RF14** — O sistema deve permitir o Usuário Autenticado consultar o detalhe completo de cada documento.
- **RF15** — O sistema deve exibir link clicável para a transação no Etherscan Sepolia.

**Módulo de Verificação:**

- **RF16** — O sistema deve permitir que o Usuário Autenticado verifique a integridade de um documento, reenviando-o para comparação de hash.
- **RF17** — O sistema deve permitir que o Visitante (sem autenticação) verifique publicamente a autenticidade de um documento em `/verify`, informando o hash diretamente ou enviando o arquivo.
- **RF18** — O sistema deve retornar resultado claro (Autentico / Falha) com dados blockchain (data, bloco, endereco que registrou).

**Módulo de Download:**

- **RF19** — O sistema deve permitir que o Usuário Autenticado faça download do arquivo descriptografado original.
- **RF20** — O sistema deve negar acesso a documentos que não pertencem ao usuário autenticado (retornar 403 ou 404).

**Utilitarios:**

- **RF21** — O sistema deve expor um endpoint GET /health para verificação de saude (banco + conexão blockchain).
- **RF22** — O sistema deve documentar todos os endpoints públicos via Swagger (OpenAPI) em `/api/docs`.

---

### 2.4 Requisitos Não Funcionais (RNF)

**Desempenho:**

- **RNF01** — O tempo de resposta da API para operações de leitura deve ser inferior a 300 ms (excluindo operações blockchain).
- **RNF02** — A confirmação do registro on-chain deve ocorrer em menos de 30 segundos na rede Sepolia.
- **RNF03** — O sistema deve suportar pelo menos 20 uploads simultaneos sem degradação perceptível.

**Seguranca:**

- **RNF04** — Senhas devem ser armazenadas com bcrypt (cost factor >= 10).
- **RNF05** — Tokens JWT devem ser assinados com chave de no mínimo 32 caracteres armazenada em variável de ambiente.
- **RNF06** — Arquivos devem ser criptografados em repouso com AES-256-GCM utilizando IV aleatório para cada operação.
- **RNF07** — A chave de criptografia (ENCRYPTION_KEY) nunca deve ser hardcoded — sempre via variável de ambiente.
- **RNF08** — A chave privada da carteira blockchain (PRIVATE_KEY) deve ser armazenada apenas em variável de ambiente, nunca em código ou banco.
- **RNF09** — Acessos a documentos devem ser restritos ao usuário proprietário (isolamento por userId).

**Disponibilidade:**

- **RNF10** — O ambiente de desenvolvimento deve subir completamente com um único comando (`docker compose up`).
- **RNF11** — Falhas na conexão com a blockchain devem ser tratadas com mensagens claras, sem comprometer o estado dos demais documentos.
- **RNF12** — O sistema deve realizar rollback do registro local em caso de falha definitiva na transação blockchain.

**Escalabilidade:**

- **RNF13** — A camada de storage deve ser abstraida via interface (`IStorageService`) para permitir troca futura de Local por IPFS sem refactor.
- **RNF14** — A arquitetura deve permitir escalar horizontalmente o backend (stateless, JWT em vez de sessão em memória).

**Usabilidade:**

- **RNF15** — A interface deve ser responsiva (mobile-first), funcionando em telas a partir de 360 px.
- **RNF16** — A complexidade técnica de blockchain deve ser abstraida — o usuário nunca precisa entender carteiras, gas ou ABIs.
- **RNF17** — Feedback visual claro em todas as operações (spinners, toasts, badges de status).

**Manutenibilidade:**

- **RNF18** — O código deve seguir padrões ESLint + Prettier com TypeScript em modo strict.
- **RNF19** — O Smart Contract deve possuir 100% de cobertura de testes automatizados.
- **RNF20** — A API deve ter documentação Swagger automatizada e atualizada a cada deploy.

---

### 2.5 Regras de Negócio

- **RN01** — Cada hash SHA-256 só pode ser registrado uma única vez no Smart Contract. Tentativas de registro duplicado retornam erro `DocumentAlreadyRegistered`.
- **RN02** — O hash registrado on-chain corresponde ao arquivo **original** (antes da criptografia), de modo que a verificação possa ser feita sem descriptografar.
- **RN03** — Documentos pertencem exclusivamente ao usuário que os registrou — não há compartilhamento na versão inicial.
- **RN04** — A verificação pública (`/verify`) não expoe metadados sensíveis (nome do arquivo, dono, etc.) — apenas confirma se o hash existe na blockchain e seus dados públicos (data, endereco que registrou).
- **RN05** — Apenas usuários autenticados podem fazer upload e gerenciar documentos.
- **RN06** — O download do arquivo descriptografado e permitido apenas ao usuário proprietário.
- **RN07** — Documentos com status `FAILED` podem ser reenviados (tentativa de re-registro), desde que o hash não tenha sido confirmado on-chain em transação anterior.
- **RN08** — O tamanho máximo permitido por arquivo e de 50 MB.
- **RN09** — Apenas hashes SHA-256 validos (64 caracteres hexadecimais) são aceitos no endpoint de verificação pública.

---

### 2.6 Fora do Escopo

Para manter o escopo factível e coerente com a proposta de **produto SaaS open-source rodando em testnet**, os seguintes itens **não serao** implementados nesta primeira versão:

- Assinatura digital com certificado ICP-Brasil — DocChain trabalha apenas com hash + blockchain, sem integração com cartórios ou certificadoras
- Multiusuario / Compartilhamento de documentos — cada usuário gerencia apenas seus próprios documentos
- Multiempresa / Multi-tenant — sem isolamento de organizações
- Integração com sistemas externos (SAP, TOTVS, ERPs em geral)
- Storage remoto IPFS — fica como evolução futura (a interface já prepara o caminho)
- Migração para Mainnet — **por opção estratégica**, o DocChain opera apenas em testnet Sepolia, mantendo uso gratuito e a natureza open-source; mainnet fica como evolução opcional
- Aplicativo mobile nativo — somente interface web responsiva
- Modelo de monetização (cobranca / billing / assinatura) — **por opção estratégica**, o DocChain e open-source e gratuito; billing fica como caminho futuro caso a comunidade evolua o produto comercialmente
- Notificações por email ou push — sem serviço de envio configurado
- Recuperação de senha por email — fluxo simplificado, sem SMTP
- 2FA / MFA — autenticação com email + senha + JWT apenas
- Auditoria avançada / Logs estruturados — apenas logging básico
- Painel administrativo — sem area admin para gestão de usuários
- Relatórios e exportações — sem export PDF, CSV ou Excel

Esses itens compoem o **backlog de evolução futura** — caso a comunidade open-source contribua ou surjam casos de uso específicos, podem ser explorados em iterações posteriores sem comprometer a arquitetura atual (que já foi desenhada com extensibilidade em mente: `IStorageService` abstrato, backend stateless, módulos independentes).

---

## 3. Fluxos e Comportamento do Sistema

Esta seção demonstra como o sistema funciona em seus fluxos principais e tratamentos de erro.

---

### 3.1 Fluxo Principal — Registro de Documento

O fluxo principal do DocChain é o registro de um documento na blockchain, executado em 12 etapas:

1. **Login** — Usuário acessa `/login`, informa email e senha, recebe JWT armazenado em httpOnly cookie
2. **Acesso ao upload** — Usuário navega para `/upload`
3. **Seleção do arquivo** — Usuário arrasta arquivo na dropzone ou clica para selecionar (max. 50 MB)
4. **Confirmação** — Usuário clica em "Registrar na Blockchain"
5. **Envio multipart** — Frontend envia POST /documents com arquivo + Authorization Bearer JWT
6. **Validação backend** — JwtAuthGuard valida token; Multer carrega arquivo em buffer
7. **Criação do registro** — DB persiste registro inicial com status `PENDING`
8. **Calculo do hash** — `CryptoService.hashFile(buffer)` gera SHA-256 do arquivo original
9. **Criptografia** — `CryptoService.encrypt(buffer)` gera ciphertext + IV + authTag (AES-256-GCM)
10. **Armazenamento** — `StorageService.save(ciphertext, hash)` grava em `/uploads/{hash}.enc`
11. **Registro on-chain** — `BlockchainService.registerDocument(hash, storageRef)` chama o contrato e aguarda 1 confirmação
12. **Atualização final** — Status = `CONFIRMED`; persiste `txHash`, `blockNumber`, `encryptionIv`, `encryptionAuthTag`

Após a confirmação, o frontend atualiza a UI mostrando o hash truncado, link Etherscan e badge "Confirmado".

![Diagrama de Sequência — fluxo principal de upload e registro on-chain](<artefatos_visuais/2 -Diagrama de Sequência — Fluxo Principal.png>)

![Fluxograma — fluxo principal de upload e registro](<artefatos_visuais/3 - Fluxograma — Fluxo Principal.png>)

---

### 3.2 Fluxo Alternativo — Verificação Pública

A verificação pública permite a um terceiro validar a autenticidade de um documento sem possuir conta na plataforma:

1. Visitante acessa `/verify` (rota pública, sem autenticação)
2. Escolhe um dos modos:
   - **Modo A:** Faz upload de arquivo → frontend calcula hash SHA-256 localmente (no navegador) ou envia ao backend
   - **Modo B:** Cola um hash SHA-256 (64 caracteres hex)
3. Clica em "Verificar"
4. Frontend chama GET /verify/public/{hash}
5. Backend consulta apenas o Smart Contract (`verifyDocument(hash)`) — sem acessar o banco
6. Retorna:
   - Se registrado: `{ exists: true, registeredAt, registeredBy, blockNumber }`
   - Se não registrado: `{ exists: false }`
7. Frontend exibe resultado público (sem expor metadados privados como nome do dono)

![Fluxograma — fluxo de verificação pública](<artefatos_visuais/4. Fluxograma — Verificação Pública.png>)

---

### 3.3 Fluxos Alternativos — Exceções e Erros

| Código | Situação | Causa | Tratamento |
|---|---|---|---|
| **E01** | Falha na transação blockchain durante upload | Timeout, sem saldo de ETH, contrato pausado | Status do documento marcado como `FAILED`; arquivo criptografado mantido em disco; toast de erro com motivo; permite retry |
| **E02** | Hash duplicado | Usuário tenta registrar arquivo cujo hash já existe no contrato | Contrato retorna `DocumentAlreadyRegistered`; backend responde 409 Conflict; frontend exibe mensagem clara |
| **E03** | Arquivo acima de 50 MB | Upload excede o limite | Backend responde 413 Payload Too Large antes de processar; frontend valida tamanho antes do envio |
| **E04** | Token JWT expirado | Sessao maior que 15 min | Backend responde 401; axios interceptor redireciona automaticamente para `/login` |
| **E05** | Tentativa de acessar documento de outro usuário | userId não confere | Backend responde 404 (intencionalmente vago, para não expor existência); frontend exibe "Documento não encontrado" |
| **E06** | Falha na descriptografia | Chave alterada ou arquivo corrompido | Backend responde 500 com mensagem genérica; logs internos detalham o erro real |
| **E07** | Hash invalido na verificação pública | Formato incorreto (não tem 64 hex chars) | Backend responde 400 Bad Request com mensagem explicativa |

![Diagrama de Atividade — tratamento de erros E01 (falha blockchain) e E02 (hash duplicado)](<artefatos_visuais/5. Diagrama de Atividade — Erros E01 e E02.png>)

---

## 4. Mockups e Experiência do Usuário (UX)

Esta seção apresenta a visualização do produto antes da implementação, validando o fluxo de navegação, a organização da interface é a clareza da experiência.

---

### 4.1 Fluxo de Navegação

O DocChain possui as seguintes rotas:

**Rotas Públicas (sem autenticação):**
- `/login` — Tela de login
- `/register` — Tela de cadastro
- `/verify` — Verificação pública

**Rotas Protegidas (dashboard):**
- `/dashboard` — Lista de documentos do usuário
- `/upload` — Upload de novo documento
- `/documents/[id]` — Detalhe + verificação + download de um documento

**Estrutura de navegação:**

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

[Acesso público independente]
/verify
```

![Fluxo de Navegação entre telas](<artefatos_visuais/6. Fluxo de Navegação (entre telas).png>)

---

### 4.2 Wireframes e Mockups das Telas

A seguir, descrição das principais telas. Cada uma deve ser produzida no **Figma** (recomendado) com layout responsivo (desktop 1440 px e mobile 375 px).

**Tela 1: /login**
- **Funcionalidade:** Autenticar usuário existente
- **Componentes:** Logo, título "Entrar", campo email, campo senha, botao "Entrar", link "Criar conta"
- **Ações:** Submeter formulario → POST /auth/login → recebe JWT → redireciona para `/dashboard`
- **Estados:** Loading no botao durante request; toast de erro em credenciais invalidas

![Mockup da tela /login](<artefatos_visuais/7 - login.png>)

**Tela 2: /register**
- **Funcionalidade:** Criar nova conta
- **Componentes:** Campos email, senha, nome, botao "Criar conta", link "Já tenho conta"
- **Ações:** POST /auth/register → auto-login → redireciona para `/dashboard`

![Mockup da tela /register](<artefatos_visuais/7 - cadastro.png>)

**Tela 3: /dashboard**
- **Funcionalidade:** Visão geral dos documentos do usuário
- **Componentes:**
  - Sidebar (desktop) ou Navbar (mobile) com itens: Dashboard, Upload, Sair
  - 3 cards de estatísticas: Total / Confirmados / Pendentes
  - Tabela paginada com colunas: Nome, Hash truncado, Status (badge colorido), Data, Ações
  - Botao "Novo Upload" em destaque
  - **Empty state:** ilustração + botao "Fazer primeiro upload"
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
- **Funcionalidade:** Detalhe completo do documento + verificação + download
- **Componentes:**
  - Header: nome do arquivo + badge de status
  - Grid 2 colunas com metadados (tipo, tamanho, data, dono)
  - Bloco "Blockchain": hash completo, txHash, link Etherscan, bloco, wallet
  - Botao "Copiar Hash"
  - Seção "Verificar Integridade": dropzone inline
  - Resultado da verificação: card verde (autentico) ou vermelho (falha)
  - Botao "Download Original"

![Mockup da tela /documents/[id]](<artefatos_visuais/7 - documento - id.png>)

**Tela 6: /verify (pública)**
- **Funcionalidade:** Validar autenticidade de qualquer documento sem login
- **Componentes:**
  - Layout limpo, sem sidebar
  - Toggle entre "Enviar arquivo" e "Colar hash"
  - Campo de input (arquivo ou hash)
  - Botao "Verificar"
  - Resultado: card verde (autentico, com dados blockchain) ou cinza (não encontrado)
  - Link para `/register` convidando o visitante a se cadastrar

![Mockup da tela /verify (pública)](<artefatos_visuais/7 - verify doc.png>)

---

### 4.3 Fluxo de Interação do Usuário

Demonstração passo a passo do fluxo principal (cadastro + registro de documento + verificação):

1. Usuário acessa o sistema em `/login`
2. Como não tem conta, clica em "Criar conta" → `/register`
3. Preenche email, senha, nome e clica em "Criar conta"
4. E auto-logado e redirecionado para `/dashboard`, que mostra empty state
5. Clica em "Novo Upload" → navega para `/upload`
6. Arrasta um PDF para a dropzone (ou clica e seleciona)
7. Confere preview com nome e tamanho do arquivo
8. Clica em "Registrar na Blockchain"
9. Acompanha visualmente o stepper: hash → criptografia → on-chain
10. Após ~20 segundos, ve a tela de sucesso com hash + link Etherscan
11. Clica em "Ver no Dashboard" e ve o documento listado com status "Confirmado"
12. Clica no documento → navega para `/documents/[id]`
13. Le os metadados, copia o hash, abre o link Etherscan em nova aba
14. Na seção "Verificar Integridade", faz upload do mesmo arquivo → recebe resultado **autentico**
15. (Teste negativo) Altera 1 byte do arquivo e tenta verificar → recebe resultado **falhou**

> **Nota:** a descrição sequencial dos 15 passos acima, combinada com os mockups das 6 telas (seção 4.2) e o diagrama de Fluxo de Navegação (seção 3), cumpre o requisito de "sequência de telas ou fluxo visual" do template de RFC da Católica SC.

---

### 4.4 Feedback Inicial de Usuários (Opcional)

Após a produção dos mockups, sugere-se conduzir uma validação rapida com **3 a 5 representantes do público-alvo** (advogados, contadores, estudantes) atraves de:

- Apresentação do protótipo navegável do Figma
- Roteiro de 5 tarefas: criar conta, fazer upload, ver detalhe, verificar, baixar
- Anotação de pontos de fricção em cada tarefa
- Coleta de sugestões via formulario curto (Google Forms ou Typeform gratuito)

> **Nota:** sessão opcional segundo o template de RFC da Católica SC. Pode ser executada após a produção dos mockups (já concluida) como reforco de validação, sem impacto no fechamento do RFC.

---

## 5. Arquitetura do Sistema

Esta seção apresenta como o sistema sera construído, utilizando o modelo C4 para descrever a arquitetura em diferentes níveis de abstração.

---

### 5.1 Diagrama C4

**Nível 1 — Diagrama de Contexto**

Visão macro do DocChain como caixa preta dentro do seu ecossistema.

- **Atores:**
  - **Usuário** (autenticado) — registra e gerencia seus documentos
  - **Verificador Público** (visitante) — consulta autenticidade sem autenticação
- **Sistema Principal:** DocChain (plataforma web)
- **Sistemas Externos:**
  - **Sepolia Testnet (Ethereum)** — recebe transações do contrato DocumentRegistry e armazena hashes imutáveis
  - **Etherscan** — explorador público de transações Ethereum, consultado via deep-link para visualização da tx
- **Fluxo de Valor:**
  - Usuário envia arquivo → DocChain processa → registra hash on-chain → retorna confirmação
  - Verificador envia hash → DocChain consulta blockchain → retorna prova pública

![Diagrama C4 Nível 1 — Contexto do sistema DocChain](<artefatos_visuais/8 - C4 — Nível 1 (Contexto).png>)

**Nível 2 — Diagrama de Containers**

Decomposição do sistema em unidades de execução independentes:

- **docchain-web** — Aplicação **Next.js 14** com App Router, servida via Node.js. Entrega SSR/CSR para o navegador. Comunica-se via HTTPS/JSON com a API.
- **docchain-api** — Aplicação **NestJS 11** expondo REST API. Orquestra fluxos de upload, criptografia, storage e blockchain.
- **docchain-db** — **PostgreSQL 16** armazenando users e documents (apenas metadados).
- **docchain-storage** — **Volume Docker** montado em `/uploads`, armazenando arquivos criptografados.
- **docchain-contracts** (externo) — Smart Contract **DocumentRegistry.sol** implantado na Sepolia. Acessado via Ethers.js + provider RPC (Infura/Alchemy).

**Protocolos de comunicação:**

| Origem | Destino | Protocolo |
|---|---|---|
| Browser | docchain-web | HTTPS |
| docchain-web | docchain-api | HTTPS / JSON (REST) |
| docchain-api | docchain-db | TCP / PostgreSQL wire protocol (porta 5432) |
| docchain-api | docchain-storage | Filesystem local |
| docchain-api | Sepolia (via RPC) | HTTPS / JSON-RPC |

![Diagrama C4 Nível 2 — Containers do sistema DocChain](<artefatos_visuais/9. C4 — Nível 2 (Containers).png>)

**Nível 3 — Diagrama de Componentes (foco no docchain-api)**

Estrutura interna do backend NestJS, organizado em módulos:

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
  - `LocalStorageService` (implementação filesystem em `/uploads`)
- **BlockchainModule**
  - `BlockchainService` (Ethers.js: `registerDocument`, `verifyDocument`, `isRegistered`)
- **PrismaModule (global)**
  - `PrismaService` (singleton do cliente Prisma)
- **Infraestrutura transversal**
  - `GlobalExceptionFilter` (filtro global de erros)
  - `ThrottlerGuard` (rate limiting)
  - `SwaggerModule` (documentação OpenAPI)

![Diagrama C4 Nível 3 — Componentes internos do container docchain-api](<artefatos_visuais/10. C4 — Nível 3 (Componentes do docchain-api).png>)

---

### 5.2 Modelo de Dados

O DocChain utiliza **PostgreSQL** com **quatro entidades** (gerenciadas via Prisma ORM): duas entidades de domínio (`User`, `Document`) e duas entidades operacionais para compliance e analytics (`AuditLog`, `VerificationAttempt`).

**Entidade User:**

| Atributo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| passwordHash | VARCHAR(60) | NOT NULL |
| name | VARCHAR(120) | NOT NULL |
| createdAt | TIMESTAMP | NOT NULL, default now() |
| updatedAt | TIMESTAMP | NOT NULL, auto-updated |

**Entidade Document:**

| Atributo | Tipo | Restrições |
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

| Atributo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User.id, NULLABLE (NULL para ações públicas), INDEX |
| action | ENUM (LOGIN, LOGOUT, REGISTER, UPLOAD, DOWNLOAD, DELETE, VERIFY_PUBLIC, VERIFY_PRIVATE) | NOT NULL, INDEX |
| resourceType | VARCHAR(50) | NULLABLE — "document", "user" etc. |
| resourceId | UUID | NULLABLE — ID do recurso afetado |
| ipAddress | VARCHAR(45) | NULLABLE — IPv4 ou IPv6 |
| userAgent | VARCHAR(500) | NULLABLE |
| metadata | JSONB | NULLABLE — dados específicos da ação (ex: { fileName, hash }) |
| createdAt | TIMESTAMP | NOT NULL, default now(), INDEX |

**Entidade VerificationAttempt:**

Log de toda tentativa de verificação (pública via `/verify` ou privada via dashboard). Usado para **analytics de uso** do produto, **anti-abuso** (rate limiting baseado em IP) e demonstração de aderencia real do mercado.

| Atributo | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| hash | VARCHAR(64) | NOT NULL — SHA-256 consultado, INDEX |
| found | BOOLEAN | NOT NULL — true se hash existe on-chain |
| documentId | UUID | FK → Document.id, NULLABLE, INDEX |
| userId | UUID | FK → User.id, NULLABLE (NULL para verificação pública) |
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

- **AuthModule** — Cadastro, login e gestão de tokens JWT
- **DocumentsModule** — Endpoints REST para upload, listagem, detalhe, verificação e download
- **CryptoService** — Hash SHA-256 e criptografia/descriptografia AES-256-GCM
- **StorageModule** — Camada de persistência de arquivos com interface abstrata (futura troca por IPFS sem refactor)
- **BlockchainModule** — Integração com Smart Contract via Ethers.js (`registerDocument`, `verifyDocument`, `isRegistered`)
- **PrismaModule** — Acesso a banco PostgreSQL com cliente tipado

**Smart Contract (docchain-contracts):**

- **DocumentRegistry.sol** — Contrato com mapping `bytes32 -> DocumentRecord`, funções `registerDocument`, `verifyDocument`, `isRegistered`, evento `DocumentRegistered`

**Frontend (docchain-web):**

- **App Router (Next.js 14)** — Rotas estaticas (`/login`, `/register`, `/verify`) e dinamicas (`/documents/[id]`)
- **Middleware de Autenticação** — Protege rotas privadas verificando cookie JWT
- **Zustand Store** — Estado global de autenticação
- **API Client (axios)** — Comunicação com backend com interceptors automáticos para Bearer token e tratamento de 401
- **Componentes UI** — DocumentTable, UploadDropzone, VerifyDropzone, StatusBadge, VerificationResult

**Infraestrutura:**

- **Docker Compose** — Orquestra PostgreSQL, API e Web em um único comando
- **Volumes persistentes** — `pgdata` (banco) e `uploads` (arquivos criptografados)

---

### 5.4 Stack Tecnologica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Smart Contracts | Solidity 0.8.24 + Hardhat 2.28 | Linguagem padrão de Ethereum; Hardhat oferece ambiente de teste, deploy e console interativo |
| Blockchain | Ethereum Sepolia Testnet | Testnet gratuita, ampla documentação, suporte a Ethers.js e Etherscan |
| Lib Blockchain | Ethers.js v6 | API moderna, melhor TypeScript, BigInt nativo, bundle menor que web3.js |
| Backend | NestJS 11 + TypeScript | Arquitetura modular, DI nativa, integração com Passport/JWT/Swagger/Throttler |
| ORM | Prisma 7 | Schema declarativo como documentação viva, migrations automáticas, cliente totalmente tipado |
| Banco | PostgreSQL 16 | Relacional robusto, suporte a UUID, indices avancados, padrão da industria |
| Autenticação | bcrypt + JWT (Passport) | bcrypt para hashing de senha; JWT stateless para escalabilidade horizontal |
| Upload | Multer (memoryStorage) | Padrão do NestJS; processamento em memória sem persistência temporaria |
| Criptografia | Node.js crypto (SHA-256 + AES-256-GCM) | Nativo, sem dependência externa, padrão da industria |
| Validação | class-validator + Joi | class-validator para DTOs; Joi para validar env vars |
| Documentação API | Swagger / OpenAPI | Documentação automática a partir de decorators NestJS |
| Frontend | Next.js 14 (App Router) + TypeScript | Server Components, SSR/CSR hibrido, melhor DX |
| Estilização | Tailwind CSS + shadcn/ui | Utility-first; shadcn fornece componentes acessíveis customizáveis |
| Estado global | Zustand 4 | Boilerplate mínimo, hook-based, ideal para auth state |
| HTTP Client | axios | Interceptors fáceis para injetar Authorization Bearer e tratar 401 |
| Upload UI | react-dropzone | Drag-and-drop com validação de tipo e tamanho |
| Notificações | sonner | Toasts modernos e acessíveis |
| Infraestrutura | Docker + Docker Compose | Ambiente reproduzível; "docker compose up" sobe tudo |
| Versionamento | Git + GitHub | Versionamento distribuido; GitHub para colaboração e CI futuro |

**Justificativas-chave:**

- **NestJS x Express puro:** NestJS impoe estrutura modular (modules, controllers, services, providers) e já integra IoC, Swagger, Throttler e Passport — economiza tempo e mantém o código organizado em um projeto acadêmico.
- **Prisma x TypeORM:** Prisma tem melhor migration story, schema único como fonte de verdade e cliente totalmente tipado, reduzindo bugs em tempo de execução.
- **Sepolia x Mainnet:** Sepolia e gratuita e tem a mesma arquitetura técnica do mainnet — ideal para TCC. Migração futura para mainnet ou L2 (Polygon, Arbitrum) e direta.
- **AES-256-GCM x AES-CBC:** GCM e autenticado (authTag detecta adulteração em repouso), consolidado como padrão moderno.
- **Hash do arquivo original x Hash do criptografado:** Hashear o arquivo original permite verificação pública sem necessidade de descriptografar — essencial para o caso de uso `/verify` e para a propriedade de "prova pública".

---
