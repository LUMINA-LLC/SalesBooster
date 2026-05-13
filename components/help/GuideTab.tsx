import React from 'react';
import Link from 'next/link';

interface GuideItem {
  title: string;
  description: string;
  href?: string;
  badge?: string;
  icon: React.ReactNode;
}

const guideItems: GuideItem[] = [
  {
    title: 'ダッシュボード',
    href: '/',
    description:
      '期間グラフ・累計グラフ・トレンド・レポート・ランキング・数字ドンの 6 種類のビューで売上を可視化。期間（年初〜当月／直近 3 ヶ月／会計年度等）、グループ、メンバー、データ種別で絞り込みできます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    title: 'データ入力',
    description:
      '画面上部の「データ入力」ボタンからモーダルを開き、メンバー・データ種別・金額・日付・備考・カスタムフィールドを入力。速報通知の有無も選べます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
  },
  {
    title: 'ディスプレイモード',
    href: '/display',
    description:
      'オフィスの大画面向けの自動切替表示。Supabase Realtime により、売上登録から速報動画の再生までほぼ遅延なく全端末に反映されます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: 'データ管理',
    href: '/sales/records',
    description:
      '登録済みの売上データ一覧。日付範囲・グループ・メンバー・データ種別で絞り込み、編集・削除・CSV/Excel インポート・CSV エクスポートに対応。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: 'AIチャットサポート',
    description:
      '画面右下の Miroku AI ボタンから利用可能。製品の使い方を質問形式で確認できます。Ctrl + / でも開閉でき、会話履歴は 90 日間保存されます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    title: 'メンバー設定',
    href: '/settings?section=member',
    badge: '管理者',
    description:
      'メンバー／管理者／入力担当者の 3 タブで管理。役割（USER／ADMIN／入力担当者）を編集モーダルで選択できます。CSV／Excel での一括インポートにも対応。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    title: 'グループ設定',
    href: '/settings?section=group',
    badge: '管理者',
    description:
      'グループの作成・編集・削除に加え、メンバーの開始月／終了月による期間管理が可能。過去の所属履歴を保ったまま異動・転勤を記録できます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: 'データ種類管理',
    href: '/settings?section=dataType',
    badge: '管理者',
    description:
      '「粗利」「契約件数」など複数の売上指標を管理。単位（万円／件／時間 等）、色、デフォルト指定、有効／無効、表示順を設定できます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    title: '目標設定',
    href: '/settings?section=target',
    badge: '管理者',
    description:
      '個人目標・グループ目標を月別に設定。年度・データ種別を切り替えて表形式で一括入力できます。個人目標は CSV／Excel でのインポートにも対応。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
  },
  {
    title: 'データ入力設定（カスタムフィールド）',
    href: '/settings?section=record',
    badge: '管理者',
    description:
      'データ種別ごとに、テキスト／日付／プルダウン／数値（集計対象指定可）の独自項目を追加できます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        />
      </svg>
    ),
  },
  {
    title: 'ディスプレイモード設定',
    href: '/settings?section=display',
    badge: '管理者',
    description:
      'ビューの表示順・表示時間・期間プリセット、トランジション、データ更新間隔、会社ロゴ／チーム名／ダークモード、速報メッセージ・動画、カスタムスライドなどを設定。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: '外部連携設定',
    href: '/settings?section=integration',
    badge: '管理者',
    description:
      'LINE Messaging API（Channel Access Token + Group ID）と Google Chat（Webhook URL）への自動通知設定。テスト送信で接続確認も可能です。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
  {
    title: '操作ログ閲覧',
    href: '/settings?section=log',
    badge: '管理者',
    description:
      'ログイン／ログイン失敗／データ操作／設定変更などの監査ログを確認。ユーザー・日付・アクション種別で絞り込めます。失敗ログには IP アドレスも記録されます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: '契約情報',
    href: '/settings?section=license',
    badge: '管理者',
    description:
      'プラン種別（トライアル／スタンダード／エンタープライズ）、ライセンス期間、メンバー数、残り日数、契約履歴を確認できます。期限切れ時はデータ登録・編集・削除が制限されます。',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

export default function GuideTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {guideItems.map((item) => {
        const card = (
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all h-full">
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        );
        return item.href ? (
          <Link key={item.title} href={item.href} className="block">
            {card}
          </Link>
        ) : (
          <div key={item.title}>{card}</div>
        );
      })}
    </div>
  );
}
