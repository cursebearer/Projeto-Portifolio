import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Landing } from '@/components/landing/Landing';

export default async function Home() {
  if ((await cookies()).get('access_token')?.value) {
    redirect('/dashboard');
  }
  return <Landing />;
}
