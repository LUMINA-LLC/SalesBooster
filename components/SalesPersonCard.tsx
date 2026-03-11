'use client';

import { SalesPerson } from '@/types';
import { formatNumber } from '@/lib/currency';

interface SalesPersonCardProps {
  person: SalesPerson;
  index: number;
  top20Index: number;
  low20Index: number;
  columnWidth: number;
  changed?: boolean;
  darkMode?: boolean;
}

export default function SalesPersonCard({ person, index, top20Index, low20Index, columnWidth, changed, darkMode = false }: SalesPersonCardProps) {
  // バッジの取得（TOP 20%で達成率100%以上）
  const getBadge = (index: number, person: SalesPerson) => {
    if (index < top20Index && person.achievement >= 100) {
      return (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`flex-1 border-r ${darkMode ? 'border-gray-600' : 'border-gray-200'}${changed ? ' animate-border-gold' : ''}`}
      style={{
        minWidth: `${columnWidth}px`,
        maxWidth: `${columnWidth}px`,
        borderWidth: changed ? '3px' : undefined,
        transition: 'border-color 0.5s ease',
      }}
    >
      {/* 順位 */}
      <div className={`text-center py-2 border-b ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
        <div className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{person.rank}位</div>
      </div>

      {/* メンバー */}
      <div className={`flex flex-col items-center py-2 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className={`text-[9px] mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>メンバー</div>
        <div className="relative mb-1.5 w-full px-2">
          {/* プロフィール画像 */}
          <div className={`relative w-full aspect-square rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm${changed ? ' animate-ring-glow' : ''}`}>
            {person.imageUrl ? (
              <img
                src={person.imageUrl}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                <span className="text-white text-xs font-bold">
                  {person.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {getBadge(index, person)}
        </div>
        <div className={`text-[9px] text-center font-medium leading-tight px-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          {person.name}
        </div>
        {person.department && (
          <div className={`text-[8px] mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{person.department}</div>
        )}
      </div>

      {/* 実績金額・達成率 */}
      <div className={`text-center py-2 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}${changed ? ' animate-card-flash' : ''}`}>
        <div className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}${changed ? ' animate-amount-flash' : ''}`}>
          {formatNumber(person.sales)}万円
        </div>
        <div
          className={`text-sm font-bold mt-1 ${
            person.achievement >= 100
              ? 'text-red-600'
              : person.achievement >= 80
              ? 'text-blue-600'
              : darkMode ? 'text-gray-400' : 'text-gray-600'
          }${changed ? ' animate-achievement-flash' : ''}`}
        >
          {person.achievement}%
        </div>
      </div>

      {/* 目標 */}
      <div className={`text-center py-2 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className={`text-[9px] mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>目標</div>
        <div className={`text-[11px] font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {formatNumber(person.target)}万円
        </div>
      </div>
    </div>
  );
}
