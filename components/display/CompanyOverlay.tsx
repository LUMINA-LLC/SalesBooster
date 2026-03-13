'use client';

import Image from 'next/image';

interface CompanyOverlayProps {
  companyLogoUrl: string;
  teamName: string;
}

export default function CompanyOverlay({
  companyLogoUrl,
  teamName,
}: CompanyOverlayProps) {
  if (!companyLogoUrl && !teamName) return null;

  return (
    <div className="absolute bottom-4 right-4 z-40 flex items-center space-x-3 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2">
      {companyLogoUrl && (
        <Image
          src={companyLogoUrl}
          alt="Company Logo"
          width={120}
          height={32}
          className="h-8 w-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
          unoptimized
        />
      )}
      {teamName && (
        <span className="text-sm font-semibold text-white drop-shadow-sm">
          {teamName}
        </span>
      )}
    </div>
  );
}
