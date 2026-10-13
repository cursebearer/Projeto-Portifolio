import { cookies } from 'next/headers';
import { Shell } from '@/components/dashboard/Shell';
import { PublicLayout } from '@/components/verify/PublicLayout';
import { PublicVerify } from '@/components/verify/PublicVerify';

export async function VerifyFrame({ initialHash }: { initialHash?: string }) {
  const loggedIn = Boolean((await cookies()).get('access_token')?.value);

  if (!loggedIn) {
    return (
      <PublicLayout>
        <PublicVerify initialHash={initialHash} />
      </PublicLayout>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Verificar documento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta pública na blockchain Sepolia — a mesma que qualquer pessoa pode fazer sem
            conta.
          </p>
        </div>
        <PublicVerify initialHash={initialHash} showSignupCta={false} />
      </div>
    </Shell>
  );
}
