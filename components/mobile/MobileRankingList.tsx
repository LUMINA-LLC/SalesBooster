'use client';

import Image from 'next/image';
import { SalesPerson } from '@/types';
import { formatNumber } from '@/lib/currency';
import { getUnitLabel } from '@/lib/units';
import Button from '@/components/common/Button';

interface MobileRankingListProps {
  salesData: SalesPerson[];
  loading: boolean;
  onAddSalesClick?: () => void;
  unit?: string;
}

export default function MobileRankingList({
  salesData,
  loading,
  onAddSalesClick,
  unit = 'MAN_YEN',
}: MobileRankingListProps) {
  const unitLabel = getUnitLabel(unit);
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* タイトルバー + 売上入力ボタン */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-800">売上ランキング</h2>
        {onAddSalesClick && (
          <Button
            icon={
              <svg
                className="w-5 h-5"
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
            }
            label="売上入力"
            color="red"
            onClick={onAddSalesClick}
          />
        )}
      </div>

      {/* コンテンツ */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : salesData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-gray-400 text-sm text-center">
            売上データがありません
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white">
          <ul className="divide-y divide-gray-200">
            {salesData.map((person) => (
              <li
                key={person.name}
                className="flex items-center px-4 py-3 gap-3"
              >
                {/* 順位 */}
                <div className="w-8 shrink-0 text-center">
                  <span
                    className={`text-lg font-bold ${
                      person.rank === 1
                        ? 'text-yellow-500'
                        : person.rank === 2
                          ? 'text-gray-400'
                          : person.rank === 3
                            ? 'text-amber-600'
                            : 'text-gray-500'
                    }`}
                  >
                    {person.rank}
                  </span>
                </div>

                {/* アバター */}
                <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-gray-300">
                  {person.imageUrl ? (
                    <Image
                      src={person.imageUrl}
                      alt={person.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-blue-600">
                      <span className="text-white text-sm font-bold">
                        {person.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 名前 + 部署 */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {person.name}
                  </div>
                  {person.department && (
                    <div className="text-xs text-gray-500 truncate">
                      {person.department}
                    </div>
                  )}
                </div>

                {/* 売上額 + 達成率 */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-gray-800">
                    {formatNumber(person.sales)}
                    {unitLabel}
                  </div>
                  <div
                    className={`text-xs font-semibold ${
                      person.achievement >= 100
                        ? 'text-red-600'
                        : person.achievement >= 80
                          ? 'text-blue-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {person.achievement}%
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
