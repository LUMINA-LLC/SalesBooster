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
        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-blue-600 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M3 20h2v-6h-2v6zm5 0h2v-10h-2v10zm5 0h2v-14h-2v14zm5 0h2v-8h-2v8z" />
            <path
              d="M16 4l4 0m0 0l0 4m0-4l-5 5"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-blue-600 font-display">Miroku</h1>
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
