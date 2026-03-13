'use client';


export default function ReportSettings() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">レポート設定</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">自動レポート生成</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">日次レポート</div>
                <div className="text-xs text-gray-500">毎日の売上サマリーを自動生成</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked aria-label="日次レポート" />
                <div className="w-11 h-6 bg-gray-200 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">週次レポート</div>
                <div className="text-xs text-gray-500">毎週の実績レポートを自動生成</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked aria-label="週次レポート" />
                <div className="w-11 h-6 bg-gray-200 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">月次レポート</div>
                <div className="text-xs text-gray-500">月末の実績レポートを自動生成</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked aria-label="月次レポート" />
                <div className="w-11 h-6 bg-gray-200 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">レポート出力形式</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded border-gray-300" defaultChecked />
              <span className="text-sm text-gray-700">PDF</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded border-gray-300" defaultChecked />
              <span className="text-sm text-gray-700">Excel (.xlsx)</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">CSV</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
