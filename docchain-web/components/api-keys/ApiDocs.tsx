import { DetailCard } from '@/components/document-detail/InfoCards';
import { publicApiUrl } from '@/lib/api-keys';

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[12.5px] leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

// Em produção a API fica sob /api (Caddy) e o Swagger em /api/docs; localmente, em :3000/api/docs.
export function swaggerUrl(base: string): string {
  return base.endsWith('/api') ? `${base}/docs` : `${base}/api/docs`;
}

const ENDPOINTS = [
  { method: 'POST', path: '/documents', what: 'Registra um documento (campo de arquivo: file, até 50 MB).' },
  { method: 'GET', path: '/documents', what: 'Lista seus documentos. Filtros: page, limit (até 100), status.' },
  { method: 'GET', path: '/documents/{id}', what: 'Consulta um documento: status, hash, transação e bloco.' },
];

const ERRORS = [
  { code: '401', what: 'Chave ausente, inválida ou revogada.' },
  { code: '403', what: 'A rota não aceita API key (ex.: excluir ou compartilhar).' },
  { code: '404', what: 'Documento não encontrado na sua conta.' },
  { code: '409', what: 'Este arquivo já foi registrado (o mesmo hash não pode ser registrado duas vezes).' },
  { code: '413', what: 'Arquivo acima de 50 MB.' },
  { code: '429', what: 'Muitas requisições em pouco tempo. Aguarde e tente de novo.' },
];

export function ApiDocs() {
  const base = publicApiUrl();

  return (
    <div className="space-y-5">
      <DetailCard title="Como funciona">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Com uma chave de API, o seu próprio sistema (um ERP, um script, um site) registra documentos
            no DocChain sem precisar do navegador. Cada arquivo enviado passa pelo mesmo processo da
            plataforma: impressão digital SHA-256, criptografia e registro na blockchain.
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Gere uma chave em &quot;Suas chaves&quot; e copie na hora: ela aparece uma única vez.</li>
            <li>
              Envie a chave no cabeçalho <code className="font-mono text-foreground">X-API-Key</code> de cada
              requisição.
            </li>
            <li>Os documentos enviados aparecem no seu dashboard, como se você tivesse feito o upload.</li>
          </ol>
          <p>
            A chave só permite <strong className="text-foreground">enviar e consultar</strong> documentos.
            Excluir, baixar, compartilhar e gerenciar a conta continuam exigindo login na plataforma.
          </p>
        </div>
      </DetailCard>

      <DetailCard title="Endpoints">
        <p className="mb-3 text-sm text-muted-foreground">
          Endereço base: <code className="font-mono text-foreground">{base}</code>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Método</th>
                <th className="py-2 pr-3 font-medium">Rota</th>
                <th className="py-2 font-medium">O que faz</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={`${e.method} ${e.path}`} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-mono text-xs font-semibold text-primary">{e.method}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-foreground">{e.path}</td>
                  <td className="py-2 text-muted-foreground">{e.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailCard>

      <DetailCard title="Exemplos">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Registrar um documento (curl)</p>
            <Code>{`curl -X POST ${base}/documents \\
  -H "X-API-Key: SUA_CHAVE" \\
  -F "file=@contrato.pdf"`}</Code>
            <p className="mt-2 text-xs text-muted-foreground">
              A resposta já vem com o registro concluído: <code className="font-mono">status</code>{' '}
              CONFIRMED, <code className="font-mono">hash</code>, <code className="font-mono">txHash</code>{' '}
              e <code className="font-mono">blockNumber</code>. Pode levar alguns segundos, o tempo da
              confirmação na blockchain.
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Consultar um documento (curl)</p>
            <Code>{`curl ${base}/documents/ID_DO_DOCUMENTO \\
  -H "X-API-Key: SUA_CHAVE"`}</Code>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Registrar um documento (JavaScript / Node.js 18+)</p>
            <Code>{`import { readFile } from 'node:fs/promises';

const form = new FormData();
form.append('file', new Blob([await readFile('contrato.pdf')]), 'contrato.pdf');

const res = await fetch('${base}/documents', {
  method: 'POST',
  headers: { 'X-API-Key': process.env.DOCCHAIN_API_KEY },
  body: form,
});
const doc = await res.json();
console.log(doc.status, doc.hash, doc.txHash);`}</Code>
          </div>
          <p className="text-xs text-muted-foreground">
            A referência completa da API, com todos os campos, está no Swagger:{' '}
            <code className="font-mono">{swaggerUrl(base)}</code>.
          </p>
        </div>
      </DetailCard>

      <DetailCard title="Erros">
        <ul className="space-y-2 text-sm">
          {ERRORS.map((e) => (
            <li key={e.code} className="flex gap-3">
              <span className="w-10 shrink-0 font-mono font-semibold text-foreground">{e.code}</span>
              <span className="text-muted-foreground">{e.what}</span>
            </li>
          ))}
        </ul>
      </DetailCard>

      <DetailCard title="Boas práticas">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Guarde a chave em variável de ambiente ou cofre de segredos do seu sistema.</li>
          <li>Nunca coloque a chave em código que roda no navegador nem em repositório público.</li>
          <li>Use uma chave por sistema, assim dá para revogar uma sem afetar as outras.</li>
          <li>Se suspeitar que a chave vazou, revogue na hora e gere outra.</li>
        </ul>
      </DetailCard>
    </div>
  );
}
