'use client';

import { useRouter } from 'next/navigation';

interface LogoProps {
  subtitle?: string;
}

export default function Logo({ subtitle }: LogoProps) {
  const router = useRouter();

  return (
    <div className="flex items-center">
      <button
        onClick={() => router.push('/')}
        className="flex items-center space-x-1 hover:scale-105 transition-transform"
      >
        <span
          className="text-3xl font-bold tracking-tight"
          style={{
            fontFamily: 'var(--font-fredoka), sans-serif',
            background:
              'linear-gradient(135deg, #6dd5ed 0%, #2193b0 30%, #6dd5ed 50%, #cc2b5e 70%, #ff6a88 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Miroku
        </span>
      </button>
      {subtitle && (
        <>
          <span className="text-gray-300 mx-4">|</span>
          <span className="text-lg font-semibold text-gray-700">
            {subtitle}
          </span>
        </>
      )}
    </div>
  );
}
