import Link from 'next/link';
import {
  ArrowRight,
  Blocks,
  FileCheck,
  Fingerprint,
  Lock,
  ScanSearch,
  ShieldCheck,
  Upload,
  UserCheck,
} from 'lucide-react';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Upload,
    title: 'Envie o documento',
    text: 'Contrato, nota fiscal, laudo, imagem — qualquer arquivo de até 50 MB.',
  },
  {
    icon: Fingerprint,
    title: 'Impressão digital e cofre',
    text: 'Geramos a impressão digital do arquivo (SHA-256) e guardamos o original trancado com criptografia AES-256.',
  },
  {
    icon: Blocks,
    title: 'Registro na blockchain',
    text: 'A impressão digital é gravada na blockchain, onde não pode ser apagada nem alterada. Você recebe o link da transação.',
  },
];

const FEATURES = [
  {
    icon: Fingerprint,
    title: 'Prova de integridade',
    text: 'Se uma única vírgula do documento mudar, a impressão digital muda e a verificação acusa.',
  },
  {
    icon: Lock,
    title: 'Arquivos cifrados',
    text: 'O documento fica armazenado com AES-256-GCM. Sem a chave, o arquivo é ilegível.',
  },
  {
    icon: UserCheck,
    title: 'Privacidade (LGPD)',
    text: 'Na blockchain vai só a impressão digital — nunca o conteúdo, seu nome ou seu e-mail.',
  },
  {
    icon: FileCheck,
    title: 'Comprovante para compartilhar',
    text: 'Envie o documento por e-mail com um comprovante em PDF e QR code. Quem recebe confere a autenticidade sozinho.',
  },
];

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        <section
          className="px-4 pb-20 pt-16 text-center sm:pt-24"
          style={{
            backgroundImage:
              'radial-gradient(1000px 500px at 50% 0%, rgba(126,182,255,0.12), transparent 60%)',
          }}
        >
          <div className="mx-auto max-w-3xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Registro documental com prova em blockchain
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Prove que seu documento é o original.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              O DocChain registra a impressão digital dos seus documentos em uma blockchain pública.
              Qualquer pessoa pode conferir, a qualquer momento, que o arquivo não foi alterado —
              sem cartório, sem certificado digital e sem precisar de conta.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/verify">
                  <ScanSearch className="h-4 w-4" />
                  Verificar um documento
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-4 py-16" aria-labelledby="como-funciona">
          <div className="mx-auto max-w-5xl">
            <h2 id="como-funciona" className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              Como funciona
            </h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border px-4 py-16" aria-labelledby="verificacao">
          <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2">
            <div>
              <h2 id="verificacao" className="text-2xl font-bold text-foreground sm:text-3xl">
                Qualquer pessoa confere. Sem conta.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Recebeu um documento registrado no DocChain? Arraste o arquivo na página de
                verificação: a impressão digital é calculada no seu próprio navegador — o arquivo
                não é enviado — e comparada com o registro na blockchain.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/verify">
                  Abrir verificação pública
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="rounded-xl border border-success/40 bg-success/10 p-6">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-6 w-6 text-success" />
                <p className="font-semibold text-success">Documento Autêntico</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                A impressão digital do arquivo coincide com a registrada na blockchain Sepolia.
              </p>
              <code className="mt-4 block break-all rounded-md bg-background/60 p-3 font-mono text-xs text-muted-foreground">
                0x9414f2c44b39f2fa0a5cc31417880833dea0012c735273dbfb05cf205a263464
              </code>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-4 py-16" aria-labelledby="seguranca">
          <div className="mx-auto max-w-5xl">
            <h2 id="seguranca" className="text-center text-2xl font-bold text-foreground sm:text-3xl">
              Segurança e transparência
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4 rounded-xl border border-border bg-card p-6">
                  <f.icon className="h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Comece agora</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Crie sua conta e registre seu primeiro documento em menos de um minuto.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Criar conta grátis</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/verify">Verificar um documento</Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
