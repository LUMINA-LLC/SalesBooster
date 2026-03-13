'use client';

interface ContractBannerProps {
  names: string[];
}

export default function ContractBanner({ names }: ContractBannerProps) {
  if (names.length === 0) return null;

  return (
    <div
      className="animate-banner absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ padding: '24px 0' }}
    >
      <div
        className="bg-linear-to-r from-red-600 via-red-500 to-orange-500 text-white px-14 py-6 rounded-xl shadow-2xl flex items-center gap-5"
        style={{ boxShadow: '0 12px 48px rgba(220, 38, 38, 0.5)' }}
      >
        <span className="text-5xl">🔔</span>
        <div>
          <div className="font-black text-3xl tracking-wide">契約速報！</div>
          <div className="text-lg font-medium opacity-90 mt-1">
            {names.join('、')} が売上を更新しました
          </div>
        </div>
        <span className="text-5xl">🎉</span>
      </div>
    </div>
  );
}
