import { GITHUB_URL } from '@/lib/site';

export function PublicFooter() {
  return (
    <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
      <p>
        DocChain · Open Source · Rodando em Sepolia Testnet ·{' '}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          GitHub
        </a>
      </p>
    </footer>
  );
}
