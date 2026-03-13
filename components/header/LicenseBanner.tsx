'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface LicenseInfo {
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
}

export default function LicenseBanner() {
  const { data: session } = useSession();
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isSuperAdmin || !session) return;

    fetch('/api/license')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLicense(data);
      })
      .catch(() => {});
  }, [session, isSuperAdmin]);

  if (!license || isSuperAdmin || dismissed) return null;

  if (license.isExpired) {
    return (
      <div className="bg-red-600 text-white text-center text-xs font-medium py-1.5 px-4 flex items-center justify-center gap-2">
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span>
          ライセンスの有効期限が切れています。データの閲覧は可能ですが、登録・編集・削除は制限されています。
        </span>
      </div>
    );
  }

  if (
    license.isTrial &&
    license.daysRemaining !== null &&
    license.daysRemaining <= 14
  ) {
    return (
      <div className="bg-yellow-500 text-white text-center text-xs font-medium py-1.5 px-4 flex items-center justify-center gap-2">
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          トライアル期間の残りが{license.daysRemaining}
          日です。引き続きご利用いただくには有料プランへの切り替えが必要です。
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 hover:opacity-80"
          aria-label="閉じる"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }

  return null;
}
