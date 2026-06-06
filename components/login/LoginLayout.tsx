type LoginVariant = 'tenant' | 'admin';

interface LoginLayoutProps {
  children: React.ReactNode;
  /** テーマ。tenant=青グラデ、admin=グレー/黒グラデ */
  variant?: LoginVariant;
  /** ロゴ下のサブタイトル（例: アカウントにログイン / 管理者ログイン） */
  subtitle?: string;
}

const VARIANT_STYLES: Record<
  LoginVariant,
  {
    bg: string;
    ring: string;
    glow: string;
    subtitleColor: string;
    footerColor: string;
    footerLink: string;
    /** AdminPanel 等の見出しラベル（admin のみ） */
    badge?: string;
  }
> = {
  tenant: {
    bg: 'from-blue-600 via-blue-700 to-indigo-800',
    ring: 'border-white/10',
    glow: 'bg-white/5',
    subtitleColor: 'text-blue-100/80',
    footerColor: 'text-blue-200/60',
    footerLink: 'text-blue-200/80 hover:text-white',
  },
  admin: {
    bg: 'from-gray-900 via-gray-800 to-gray-900',
    ring: 'border-white/5',
    glow: 'bg-blue-500/5',
    subtitleColor: 'text-gray-300',
    footerColor: 'text-gray-600',
    footerLink: 'text-gray-500 hover:text-gray-300',
    badge: 'AdminPanel',
  },
};

/** ログイン系画面の共通レイアウト（背景＋装飾＋ロゴ＋フッター。中身を中央に表示） */
export default function LoginLayout({
  children,
  variant = 'tenant',
  subtitle = 'アカウントにログイン',
}: LoginLayoutProps) {
  const s = VARIANT_STYLES[variant];
  return (
    <div
      className={`min-h-screen relative flex items-center justify-center overflow-hidden bg-linear-to-br ${s.bg} px-6 py-10`}
    >
      {/* 装飾パターン（背景全面） */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-12 left-12 w-48 h-48 border-2 ${s.ring} rounded-full`}
        />
        <div
          className={`absolute top-32 left-32 w-64 h-64 border-2 ${s.ring} rounded-full`}
        />
        <div
          className={`absolute bottom-16 right-16 w-56 h-56 border-2 ${s.ring} rounded-full`}
        />
        <div
          className={`absolute bottom-32 left-20 w-40 h-40 border-2 ${s.ring} rounded-full`}
        />
        <div
          className={`absolute top-1/2 right-24 w-72 h-72 border-2 ${s.ring} rounded-full -translate-y-1/2`}
        />
        {/* グロー効果 */}
        <div
          className={`absolute top-1/4 left-1/4 w-96 h-96 ${s.glow} rounded-full blur-3xl`}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 ${s.glow} rounded-full blur-3xl`}
        />
      </div>

      {/* 中央コンテンツ */}
      <div className="relative z-10 w-full max-w-md">
        {/* ロゴ */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-baseline gap-2">
            <h1
              className="text-4xl font-bold tracking-tight"
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
            {s.badge && (
              <span className="text-white/90 text-xl font-semibold">
                - {s.badge}
              </span>
            )}
          </div>
          <p className={`${s.subtitleColor} text-sm mt-1`}>{subtitle}</p>
        </div>

        {children}

        {/* フッター */}
        <div className="mt-6 flex items-center justify-between px-1">
          <span className={`${s.footerColor} text-xs`}>v0.1.0</span>
          <span className={`${s.footerColor} text-xs`}>
            Powered by{' '}
            <a
              href="https://www.insideheart.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${s.footerLink} transition-colors`}
            >
              Inside Heart Co., Ltd.
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
