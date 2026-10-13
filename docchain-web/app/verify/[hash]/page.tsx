import { VerifyFrame } from '@/components/verify/VerifyFrame';

export default async function VerifyHashPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  return <VerifyFrame initialHash={decodeURIComponent(hash)} />;
}
