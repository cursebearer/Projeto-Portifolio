import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
      <nav aria-label="Rodapé" className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href="/privacidade" className="hover:text-foreground">
          Privacidade
        </Link>
        <Link href="/termos" className="hover:text-foreground">
          Termos de Uso
        </Link>
      </nav>
      <p>DocChain · Rodando em Sepolia Testnet</p>
    </footer>
  );
}
