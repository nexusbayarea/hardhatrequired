'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeckRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/admin/deck'); }, [router]);
  return null;
}
