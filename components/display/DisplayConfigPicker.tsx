'use client';

interface ConfigOption {
  id: number;
  name: string;
}

interface DisplayConfigPickerProps {
  configs: ConfigOption[];
  /** 設定を選んだとき（configId を渡す） */
  onSelect: (configId: number) => void;
  /** 「ダッシュボードに戻る」を押したとき */
  onBack: () => void;
}

/**
 * 複数のディスプレイ設定からどれで開くか選ぶ画面。
 * ログイン画面とトーンを合わせたデザイン（青グラデ＋装飾＋ロゴ＋白カード）。
 */
export default function DisplayConfigPicker({
  configs,
  onSelect,
  onBack,
}: DisplayConfigPickerProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-10">
      {/* 装飾パターン（背景全面） */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-12 top-12 h-48 w-48 rounded-full border-2 border-white/10" />
        <div className="absolute left-32 top-32 h-64 w-64 rounded-full border-2 border-white/10" />
        <div className="absolute bottom-16 right-16 h-56 w-56 rounded-full border-2 border-white/10" />
        <div className="absolute bottom-32 left-20 h-40 w-40 rounded-full border-2 border-white/10" />
        <div className="absolute right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border-2 border-white/10" />
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* 中央コンテンツ */}
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <h1
            className="mb-1 text-4xl font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-fredoka), sans-serif',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(200,230,255,0.95) 50%, rgba(255,210,225,0.95) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Miroku
          </h1>
          <p className="mt-1 text-sm text-blue-100/80">
            ディスプレイ設定を選択
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2.5">
            {configs.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-800 transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <span>{c.name}</span>
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}
          </div>
          <button
            onClick={onBack}
            className="mt-4 w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
