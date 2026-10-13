import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 px-4 py-12">
        <article className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
          <header>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-xs">Última atualização: {updatedAt}</p>
          </header>
          {children}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
