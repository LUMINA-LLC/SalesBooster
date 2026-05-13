'use client';

import { useState } from 'react';

interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  // ── データ入力・編集 ──
  {
    category: 'データ入力',
    question: 'データを誤って登録してしまいました。修正できますか？',
    answer:
      'データ管理画面（/sales/records）から該当のレコードを選んで編集または削除できます。編集・削除のたびにディスプレイ画面の数値も自動的に更新されます。',
  },
  {
    category: 'データ入力',
    question: '他のメンバーの売上を代理で登録できますか？',
    answer:
      'はい。データ入力モーダルの「メンバー」欄で対象者を選んで登録できます。また、入力担当者（Operator）として登録されたユーザーは、ライセンス人数にカウントされず、ランキングにも表示されません。',
  },
  {
    category: 'データ入力',
    question: '速報を流したくない時はどうすればいいですか？',
    answer:
      'データ入力モーダルの「速報通知」のチェックを外して登録してください。当該レコードはディスプレイモードで速報動画が再生されません。',
  },
  {
    category: 'データ入力',
    question: 'CSV/Excel で一括登録できますか？',
    answer:
      'はい。売上データはデータ管理画面、メンバーはメンバー設定画面、個人目標は目標設定画面からそれぞれインポートできます。日付は yyyy/mm/dd・yyyyMMdd など複数形式に対応し、メンバー名はあいまいマッチで照合します。',
  },

  // ── ディスプレイモード ──
  {
    category: 'ディスプレイモード',
    question: 'ディスプレイモードの表示内容を変更したいです。',
    answer:
      '管理者の方は ディスプレイモード設定（/settings?section=display）から、ビューの表示順・表示時間・期間プリセット、データ更新間隔、トランジション効果、ダークモードなどを設定できます。',
  },
  {
    category: 'ディスプレイモード',
    question: '速報の動画やメッセージを変更できますか？',
    answer:
      'ディスプレイモード設定の「速報設定」から、メッセージと動画（3 種類）を選べます。データ種別ごとに ON/OFF・メッセージ・動画 を個別に設定することも可能です。',
  },
  {
    category: 'ディスプレイモード',
    question: '速報が反映されません。',
    answer:
      '速報は Supabase Realtime のチャネル経由で配信されます。ネットワークの WebSocket 接続（wss://*.supabase.co）が許可されていることをご確認ください。社内プロキシ等で遮断されている場合、管理者にご相談ください。',
  },
  {
    category: 'ディスプレイモード',
    question: '画像・YouTube・テキストのスライドを表示できますか？',
    answer:
      'はい。ディスプレイモード設定の「カスタムスライド管理」から、画像 URL／YouTube リンク／テキスト の 3 種類を追加でき、ビュー設定で表示順を指定できます。',
  },

  // ── メンバー・グループ ──
  {
    category: 'メンバー / グループ',
    question: 'メンバーを追加するにはどうすればいいですか？',
    answer:
      '管理者の方は メンバー設定（/settings?section=member）から、メール・パスワード・役割（メンバー／管理者／入力担当者）・部署・プロフィール画像 を設定して追加できます。CSV/Excel での一括追加にも対応しています。',
  },
  {
    category: 'メンバー / グループ',
    question: 'メンバーの所属グループを過去に遡って記録できますか？',
    answer:
      'はい。グループ設定（/settings?section=group）でメンバーごとに 開始月／終了月 を指定できます。これにより、過去の月のランキングは当時の所属グループで集計されます。',
  },
  {
    category: 'メンバー / グループ',
    question: '自分のロールを変更できません。',
    answer:
      '誤操作防止のため、自分自身のロール（メンバー／管理者／入力担当者）は変更できない仕様です。他の管理者に変更を依頼してください。',
  },

  // ── 目標設定 ──
  {
    category: '目標設定',
    question: '目標値を設定するにはどうすればいいですか？',
    answer:
      '目標設定（/settings?section=target）で、個人目標とグループ目標をそれぞれ月別に設定できます。年度・データ種別を切り替えて表形式で一括入力できます。設定した目標値はダッシュボードのグラフに目標ラインとして表示されます。',
  },

  // ── 外部連携 ──
  {
    category: '外部連携',
    question: 'LINE / Google Chat に通知を送るにはどうすればいいですか？',
    answer:
      '外部連携設定（/settings?section=integration）で、LINE は Channel Access Token + Group ID、Google Chat は Webhook URL を入力します。テスト送信で接続を確認後、売上登録時に自動通知されます。',
  },

  // ── ライセンス ──
  {
    category: 'ライセンス',
    question: 'ライセンス期限を確認したいです。',
    answer:
      '契約情報（/settings?section=license）で、プラン種別・ライセンス期間・残り日数・契約履歴を確認できます。期限まで 7 日以下になると黄色、期限切れになると赤色のバッジが表示されます。',
  },
  {
    category: 'ライセンス',
    question: 'ライセンス人数のカウント対象は？',
    answer:
      'ロールが「メンバー（USER）」かつ「入力担当者ではない」ユーザーのみがカウントされます。管理者と入力担当者はカウント外です。メンバー編集でロール変更時、上限を超える場合はエラーになります。',
  },
  {
    category: 'ライセンス',
    question: '期限切れになるとどうなりますか？',
    answer:
      'データの登録・更新・削除が制限されます。閲覧は引き続き可能です。AI チャットの新規送信もできなくなります（過去履歴の閲覧・削除は可能）。',
  },

  // ── AIチャット ──
  {
    category: 'AIチャット',
    question: 'AIチャットの履歴は保存されますか？',
    answer:
      'はい。会話履歴はサーバ上に最大 90 日間保存され、チャット内の「履歴ボタン」から過去の会話を呼び出せます。「すべて削除」ボタンや会話単位の削除でいつでも消去できます。',
  },
  {
    category: 'AIチャット',
    question: 'AI に売上の数字を聞けますか？',
    answer:
      '現在のバージョンでは、特定のテナントの売上やランキングなどの実データを返すことはできません。データはダッシュボードや該当画面でご確認ください。製品の使い方・操作手順については AI で案内できます。',
  },
  {
    category: 'AIチャット',
    question: '個人情報を入力しても大丈夫ですか？',
    answer:
      '質問内容は AI 応答生成のため Google Gemini API へ送信されます。個人情報・機微情報の入力はお控えください。詳しくはプライバシーポリシーをご確認ください。',
  },

  // ── 監査ログ ──
  {
    category: '監査ログ',
    question: '誰が何をしたかを確認できますか？',
    answer:
      '操作ログ閲覧（/settings?section=log）で、ログイン／データ操作／設定変更などの履歴をユーザー・日付・アクション種別で絞り込んで確認できます。ログイン失敗とそのアクセス元 IP も記録されます。',
  },
];

const categoryOrder = [
  'データ入力',
  'ディスプレイモード',
  'メンバー / グループ',
  '目標設定',
  '外部連携',
  'ライセンス',
  'AIチャット',
  '監査ログ',
];

export default function FaqTab() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const grouped = categoryOrder.map((category) => ({
    category,
    items: faqItems.filter((i) => i.category === category),
  }));

  return (
    <div className="space-y-6">
      {grouped.map((group) =>
        group.items.length > 0 ? (
          <section key={group.category}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
              {group.category}
            </h2>
            <div className="space-y-2">
              {group.items.map((item, index) => {
                const key = `${group.category}-${index}`;
                const isOpen = openKey === key;
                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenKey(isOpen ? null : key)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 pr-4">
                        {item.question}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}
