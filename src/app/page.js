import { redirect } from 'next/navigation';
import { getCurrentUser } from '../lib/currentUser';

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  redirect(currentUser ? '/library' : '/login');
}
