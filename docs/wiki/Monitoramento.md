# Monitoramento

Stack: `prom-client` na API, Prometheus para coleta e alertas, Grafana para visualização. Tudo sobe junto com `docker compose up` (configuração em `monitoring/`).

## Métricas expostas em `GET /metrics`

| Métrica | Tipo | Labels | Descrição |
| --- | --- | --- | --- |
| `docchain_http_requests_total` | counter | `method`, `route`, `status_code` | Requisições atendidas |
| `docchain_http_request_duration_seconds` | histogram | `method`, `route`, `status_code` | Latência por rota |
| `docchain_documents` | gauge | `status` | Documentos não excluídos por status, lido do banco a cada coleta |
| `docchain_process_*`, `docchain_nodejs_*` | vários | | Métricas padrão do Node (CPU, memória, event loop, GC) |

O label `route` usa o padrão da rota (`/documents/:id`), não a URL real, para não criar uma série por id. Requisições sem rota correspondente entram como `unmatched`.

Com `METRICS_TOKEN` definido, o endpoint exige `Authorization: Bearer <token>`. O `monitoring/prometheus.yml` tem o bloco comentado para essa configuração.

## Dashboard

Grafana em http://localhost:3002, pasta "DocChain", dashboard "DocChain API". Datasource e dashboard são provisionados automaticamente.

| Painel | Para que serve |
| --- | --- |
| API no ar | Alvo do Prometheus `UP` ou fora |
| Requisições/s e taxa de erro 5xx | Saúde geral |
| Documentos confirmados e com falha | Resultado do registro on-chain |
| Requisições e latência p95 por rota | Achar rota lenta (upload depende da Sepolia) |
| Respostas por status HTTP | Picos de 4xx/5xx |
| Documentos por status | Distribuição PENDING / PROCESSING / CONFIRMED / FAILED |
| Memória, CPU, event loop lag | Recursos do processo |

## Alertas (`monitoring/alerts.yml`)

| Alerta | Condição |
| --- | --- |
| `ApiDown` | Alvo fora por 1 minuto |
| `HighErrorRate` | Mais de 5% de respostas 5xx por 5 minutos |
| `SlowRequests` | p95 acima de 10 s por 10 minutos |
| `FailedDocuments` | Algum documento novo em `FAILED` nos últimos 15 minutos |

Os alertas aparecem em http://localhost:9090/alerts.

## Outros sinais

- `GET /health`: banco e blockchain (número do último bloco).
- Logs do Nest com nível configurável por `LOG_LEVEL`.
- Tabela `audit_logs`: trilha de ações por usuário.
