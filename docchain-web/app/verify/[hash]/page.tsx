import { PublicLayout } from '@/components/verify/PublicLayout';
import { PublicVerify } from '@/components/verify/PublicVerify';

export default async function VerifyHashPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  return (
    <PublicLayout>
      <PublicVerify initialHash={decodeURIComponent(hash)} />
    </PublicLayout>
  );
}
