import { ApiDocs } from '@/components/api-keys/ApiDocs';
import { ApiKeysManager } from '@/components/api-keys/ApiKeysManager';

export default function IntegrationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Integre o seu sistema ao DocChain para registrar documentos automaticamente.
        </p>
      </div>
      <ApiKeysManager />
      <ApiDocs />
    </div>
  );
}
