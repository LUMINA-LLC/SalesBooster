export default function ContactTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="max-w-md mx-auto text-center">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          お問い合わせ
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          ご不明点やご要望がございましたら、下記のメールアドレスまでお気軽にお問い合わせください。
        </p>
        <a
          href="mailto:fqp@insideheart.jp"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>fqp@insideheart.jp</span>
        </a>
        <p className="text-xs text-gray-400 mt-4">
          通常、1〜2営業日以内にご返信いたします。
        </p>
      </div>
    </div>
  );
}
