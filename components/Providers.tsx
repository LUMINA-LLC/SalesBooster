'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import TermsAcceptanceGate from './auth/TermsAcceptanceGate';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <TermsAcceptanceGate />
    </SessionProvider>
  );
}
