'use client';

import React from 'react';
import Image from 'next/image';
import { RankingBoardData, RankingMember } from '@/types';

interface RankingBoardProps {
  data: RankingBoardData;
  darkMode?: boolean;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString() + '円';
}

function MemberCard({
  member,
  darkMode = false,
}: {
  member: RankingMember;
  darkMode?: boolean;
}) {
  return (
    <div className="flex flex-col items-center py-3 px-2">
      <div
        className={`relative w-24 h-24 rounded-sm overflow-hidden border shadow-sm mb-1.5 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-200'}`}
      >
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
            <span className="text-white text-2xl font-bold">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div
        className={`text-xs font-bold text-center leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
      >
        {member.name}
      </div>
      <div className="text-[10px] text-green-600 font-bold mt-0.5">
        粗利 : {formatAmount(member.amount)}
      </div>
    </div>
  );
}

function EmptyCell() {
  return <div className="py-3 px-2 h-[150px]" />;
}

// ゾーン判定（TOP 20% / CENTER / LOW 20%）
function getZone(
  rankIdx: number,
  totalMembers: number,
): 'top' | 'center' | 'low' {
  const top20Index = Math.ceil(totalMembers * 0.2);
  const low20Index = Math.floor(totalMembers * 0.8);
  if (rankIdx < top20Index) return 'top';
  if (rankIdx >= low20Index) return 'low';
  return 'center';
}

// ゾーンごとの背景色
function getZoneBg(zone: 'top' | 'center' | 'low', darkMode: boolean): string {
  switch (zone) {
    case 'top':
      return darkMode ? 'bg-amber-900/20' : 'bg-amber-50/60';
    case 'low':
      return darkMode ? 'bg-teal-900/20' : 'bg-teal-50/60';
    default:
      return '';
  }
}

// ゾーン境界ラベル情報
const ZONE_LABELS: Record<
  string,
  {
    label: string;
    color: string;
    darkColor: string;
    borderColor: string;
    darkBorderColor: string;
  }
> = {
  top: {
    label: 'TOP 20%',
    color: 'text-amber-700 bg-amber-100 border-amber-300',
    darkColor: 'text-amber-300 bg-amber-900/40 border-amber-600',
    borderColor: 'border-amber-300',
    darkBorderColor: 'border-amber-700',
  },
  center: {
    label: 'CENTER',
    color: 'text-sky-700 bg-sky-100 border-sky-300',
    darkColor: 'text-sky-300 bg-sky-900/40 border-sky-600',
    borderColor: 'border-sky-300',
    darkBorderColor: 'border-sky-700',
  },
  low: {
    label: 'LOW 20%',
    color: 'text-teal-700 bg-teal-100 border-teal-300',
    darkColor: 'text-teal-300 bg-teal-900/40 border-teal-600',
    borderColor: 'border-teal-300',
    darkBorderColor: 'border-teal-700',
  },
};

export default function RankingBoard({
  data,
  darkMode = false,
}: RankingBoardProps) {
  // 最大順位数を算出
  const maxRank = Math.max(...data.columns.map((col) => col.members.length), 0);

  const rankLabels: string[] = [];
  for (let i = 0; i < maxRank; i++) {
    if (i === 0) rankLabels.push('TOP');
    else rankLabels.push(String(i + 1));
  }

  return (
    <div
      className={`mx-6 my-4 shadow-sm rounded overflow-auto h-[calc(100%-2rem)] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div
        className={`sticky top-0 z-20 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        <div className="p-4">
          <h2
            className={`text-lg font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
          >
            RANKING BOARD
          </h2>
        </div>

        <div style={{ minWidth: 'fit-content' }}>
          {/* ヘッダー行 */}
          <div
            className={`flex border-b-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
          >
            {/* 順位列ヘッダー */}
            <div
              className={`w-14 shrink-0 sticky left-0 z-10 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            />
            {/* 各カラムヘッダー */}
            {data.columns.map((col, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[150px] text-center py-2 px-1 border-l ${darkMode ? 'border-gray-600' : 'border-gray-200'} ${
                  col.isTotal
                    ? 'bg-red-600 text-white'
                    : i % 2 === 1
                      ? darkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-50'
                      : darkMode
                        ? 'bg-gray-800'
                        : 'bg-white'
                }`}
              >
                <div
                  className={`text-sm font-bold ${!col.isTotal && darkMode ? 'text-gray-100' : ''}`}
                >
                  {col.label}
                </div>
                {col.subLabel && (
                  <div className="text-[10px] opacity-80">{col.subLabel}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ minWidth: 'fit-content' }}>
        {/* ランキング行 */}
        {rankLabels.map((label, rankIdx) => {
          const zone = getZone(rankIdx, maxRank);
          const zoneBg = getZoneBg(zone, darkMode);
          const prevZone = rankIdx > 0 ? getZone(rankIdx - 1, maxRank) : null;
          const isZoneBoundary = prevZone !== null && prevZone !== zone;
          const zoneLabel = ZONE_LABELS[zone];

          return (
            <React.Fragment key={rankIdx}>
              {/* ゾーン境界ラベル行 */}
              {(rankIdx === 0 || isZoneBoundary) && (
                <div
                  className={`flex border-b ${darkMode ? zoneLabel.darkBorderColor : zoneLabel.borderColor}`}
                >
                  <div
                    className={`w-14 shrink-0 sticky left-0 z-10 border-r ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
                  />
                  <div className="flex-1 flex items-center py-1 px-4">
                    <span
                      className={`text-xs font-bold px-3 py-0.5 rounded-full border ${darkMode ? zoneLabel.darkColor : zoneLabel.color}`}
                    >
                      {zoneLabel.label}
                    </span>
                    <div
                      className={`flex-1 ml-3 border-t border-dashed ${darkMode ? zoneLabel.darkBorderColor : zoneLabel.borderColor}`}
                    />
                  </div>
                </div>
              )}
              {/* メンバー行 */}
              <div
                className={`flex border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} ${zoneBg}`}
              >
                {/* 順位ラベル */}
                <div
                  className={`w-14 shrink-0 sticky left-0 z-10 flex items-center justify-center border-r ${zoneBg || (darkMode ? 'bg-gray-800' : 'bg-white')} ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                >
                  <span
                    className={`text-sm font-bold ${rankIdx === 0 ? 'text-red-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {label}
                  </span>
                </div>
                {/* 各カラムのメンバー */}
                {data.columns.map((col, colIdx) => {
                  const member = col.members.find(
                    (m) => m.rank === rankIdx + 1,
                  );
                  return (
                    <div
                      key={colIdx}
                      className={`flex-1 min-w-[150px] border-l flex justify-center ${darkMode ? 'border-gray-600' : 'border-gray-200'} ${
                        colIdx % 2 === 1 && !col.isTotal
                          ? darkMode
                            ? 'bg-gray-700/50'
                            : 'bg-gray-50/50'
                          : ''
                      }`}
                    >
                      {member ? (
                        <MemberCard member={member} darkMode={darkMode} />
                      ) : (
                        <EmptyCell />
                      )}
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
