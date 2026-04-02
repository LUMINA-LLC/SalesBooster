'use client';

import { useState } from 'react';

const faqItems = [
  {
    question: 'データを誤って登録してしまいました。修正できますか？',
    answer:
      '「データ管理」画面から該当のレコードを選択し、編集または削除ができます。',
  },
  {
    question: 'メンバーを追加するにはどうすればいいですか？',
    answer:
      '管理者権限をお持ちの場合、「設定」→「メンバー管理」から新しいメンバーを追加できます。',
  },
  {
    question: 'ディスプレイモードの表示内容を変更したいです。',
    answer:
      '「設定」→「表示設定」から、表示するグラフの種類・順番・カスタムスライドなどを設定できます。',
  },
  {
    question: 'LINE や Google Chat に通知を送るにはどうすればいいですか？',
    answer:
      '「設定」→「外部連携」から、LINE または Google Chat の Webhook を設定し、接続テストを行ってください。',
  },
  {
    question: '目標値を設定するにはどうすればいいですか？',
    answer:
      '「設定」→「目標設定」から、メンバーごと・グループごとに月次・週次・日次の目標を設定できます。',
  },
  {
    question: 'データを Excel でエクスポートできますか？',
    answer:
      '「データ管理」画面の「エクスポート」ボタンから、表示中のデータを Excel ファイルとしてダウンロードできます。',
  },
];

export default function FaqTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqItems.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 pr-4">
              {item.question}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
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
          {openIndex === index && (
            <div className="px-5 pb-5 pt-0">
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
