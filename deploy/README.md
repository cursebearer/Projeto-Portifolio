# Deploy de produção

Uma VM Linux em nuvem pública roda a stack inteira com Docker Compose. O GitHub Actions publica as imagens no GHCR e atualiza a VM a cada merge na `main`; nenhum passo de deploy é manual.

```
GitHub (merge na main) -> CI verde -> CD: build e push no GHCR -> SSH na VM -> docker compose pull && up -d
```

| Arquivo | Função |
| --- | --- |
| `docker-compose.prod.yml` | postgres, api, web, caddy, prometheus, grafana |
| `Caddyfile` | HTTPS automático e roteamento por caminho no mesmo domínio |
| `.env.example` | Variáveis do compose (domínio, senhas, tag da imagem) |

## Provedor

Qualquer VM com 2 GB de RAM e Docker serve. Opções compatíveis com o Playbook (não pode Vercel, Netlify, Render nem Firebase):

| Provedor | Opção |
| --- | --- |
| Azure | VM B1ms/B2s, coberta pelo Azure for Students |
| AWS | EC2 t3.small |
| Google Cloud | e2-small |
| Hostinger | VPS KVM 1 |

## Preparação da VM (uma vez)

1. Criar a VM com Ubuntu 24.04, liberar as portas 22, 80 e 443.
2. Apontar o domínio (registro A) para o IP público da VM.
3. Instalar Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER   # sair e entrar de novo
   ```
4. Criar a pasta e os arquivos de segredo:
   ```bash
   mkdir -p ~/docchain && cd ~/docchain
   nano .env       # conteúdo de deploy/.env.example com valores reais
   nano api.env    # conteúdo de docchain-api/.env.example com valores reais
   chmod 600 .env api.env
   ```
   Em `api.env`, `DATABASE_URL`, `CORS_ORIGIN`, `VERIFY_PUBLIC_BASE_URL`, `UPLOAD_DIR`, `PORT` e `NODE_ENV` são sobrescritos pelo compose. `ENCRYPTION_KEY` precisa ser guardada fora da VM também: sem ela os arquivos cifrados não voltam.
5. Gerar uma chave SSH só para o deploy e autorizar na VM:
   ```bash
   ssh-keygen -t ed25519 -f docchain_deploy -N ""
   cat docchain_deploy.pub >> ~/.ssh/authorized_keys
   ```
6. Se os pacotes do GHCR estiverem privados, logar na VM com um token `read:packages`:
   ```bash
   echo <TOKEN> | docker login ghcr.io -u cursebearer --password-stdin
   ```
   Alternativa: deixar `docchain-api` e `docchain-web` públicos em GitHub > Packages > Package settings.

## Configuração no GitHub (uma vez)

Settings > Secrets and variables > Actions:

| Tipo | Nome | Valor |
| --- | --- | --- |
| Secret | `DEPLOY_HOST` | IP ou hostname da VM |
| Secret | `DEPLOY_USER` | usuário SSH |
| Secret | `DEPLOY_SSH_KEY` | conteúdo da chave privada `docchain_deploy` |
| Variable | `DEPLOY_DOMAIN` | `docchain.exemplo.com` |
| Variable | `NEXT_PUBLIC_API_URL` | `https://docchain.exemplo.com/api` |

Sem `DEPLOY_HOST`, o CD só publica as imagens e avisa que pulou o deploy.

## Rotas públicas

| URL | Serviço |
| --- | --- |
| `https://<domínio>/` | Web |
| `https://<domínio>/api/` | API (`/api/health`, `/api/docs`) |
| `https://<domínio>/grafana/` | Grafana |

`/api/metrics` responde 404 por fora; o Prometheus coleta pela rede interna do compose.

## Rollback

Na VM, fixar a tag anterior (SHA curto do commit) e subir de novo:

```bash
cd ~/docchain
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=<sha-anterior>/' .env
docker compose -f docker-compose.prod.yml up -d
```

Ou disparar o workflow CD manualmente (Actions > CD > Run workflow) a partir do commit desejado.
