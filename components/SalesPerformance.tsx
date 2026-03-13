'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import PerformanceLabels from './PerformanceLabels';
import AverageTargetLine, { OverlayLine } from './AverageTargetLine';
import SalesBar from './SalesBar';
import ContractBanner from './ContractBanner';
import { COLUMN_WIDTH } from '@/types/chart';
import { SalesPerson } from '@/types';
import { formatNumber } from '@/lib/currency';
import { DEFAULT_UNIT } from '@/types/units';
import { getUnitLabel } from '@/lib/units';

interface SalesPerformanceProps {
  salesData: SalesPerson[];
  recordCount: number;
  darkMode?: boolean;
  isDisplayMode?: boolean;
  showNormaLine?: boolean;
  overlayLines?: OverlayLine[];
  unit?: string;
}

export default function SalesPerformance({
  salesData,
  recordCount,
  darkMode = false,
  isDisplayMode = false,
  showNormaLine = true,
  overlayLines = [],
  unit = DEFAULT_UNIT,
}: SalesPerformanceProps) {
  const prevDataRef = useRef<SalesPerson[]>([]);
  const [changedNames, setChangedNames] = useState<Set<string>>(new Set());
  const [bannerNames, setBannerNames] = useState<string[]>([]);

  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevDataRef.current;
    prevDataRef.current = salesData;

    // prevが空の場合はアニメーション不要（初回表示 or フィルター変更後のデータクリアからの復帰）
    if (prev.length === 0) return;

    const changed = new Set<string>();
    for (const person of salesData) {
      const prevPerson = prev.find((p) => p.name === person.name);
      if (prevPerson && prevPerson.sales !== person.sales) {
        changed.add(person.name);
      }
    }
    if (changed.size > 0) {
      // 一度クリアしてアニメーションクラスを外す
      setChangedNames(new Set());
      setBannerNames([]);

      // 前回のrAFが残っていればキャンセル
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // 次フレームで再設定 → CSSアニメーションが再トリガーされる
      animationFrameRef.current = requestAnimationFrame(() => {
        setChangedNames(changed);
        setBannerNames(Array.from(changed));
      });

      const timer = setTimeout(() => {
        setChangedNames(new Set());
        setBannerNames([]);
      }, 5000);
      return () => {
        clearTimeout(timer);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [salesData]);
  // 目標平均の計算（メンバーの目標値の平均）
  const averageTarget =
    salesData.length > 0
      ? Math.round(
          salesData.reduce((sum, person) => sum + person.target, 0) /
            salesData.length,
        )
      : 0;

  // 最大売上の取得（グラフの高さ調整用）
  const maxSales =
    salesData.length > 0
      ? Math.max(...salesData.map((person) => person.sales))
      : 0;

  // TOP 20%, CENTER, LOW 20%の境界を計算
  const top20Index = Math.ceil(salesData.length * 0.2);
  const low20Index = Math.floor(salesData.length * 0.8);

  // 各カラムの固定幅
  const columnWidth = COLUMN_WIDTH;

  // チーム合計の計算
  const totalSales = salesData.reduce((sum, person) => sum + person.sales, 0);

  // 左ラベル列の幅
  const labelWidth = 120;

  // sticky左ラベルの共通スタイル
  const stickyLabelClass = `shrink-0 sticky left-0 z-40 border-r flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`;

  return (
    <div
      className={`mx-6 my-4 shadow-sm relative overflow-x-auto h-[calc(100%-2rem)] flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      {/* 契約速報バナー */}
      <ContractBanner names={bannerNames} />

      <div
        className="flex-1 min-h-0 flex flex-col"
        style={{ minWidth: 'fit-content' }}
      >
        {/* グラフエリア */}
        <div className="flex flex-1 min-h-0">
          {!isDisplayMode && (
            <div
              className={stickyLabelClass}
              style={{ width: `${labelWidth}px` }}
            >
              <div className="flex flex-col justify-between h-full py-6 w-full">
                <div className="px-2 text-center">
                  <div
                    className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    ■ 月間売上
                  </div>
                  <div
                    className={`text-lg font-bold mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                  >
                    {formatNumber(maxSales)}
                    <span
                      className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      {getUnitLabel(unit)}
                    </span>
                  </div>
                  <div
                    className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="text-xs text-blue-600">■ チーム計</div>
                    <div className="text-lg font-bold text-blue-700 mt-1">
                      {formatNumber(totalSales)}
                      <span className="text-sm font-normal text-blue-500">
                        {getUnitLabel(unit)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div
                      className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      ■ 契約件数
                    </div>
                    <div
                      className={`text-lg font-bold mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                    >
                      {recordCount}
                      <span
                        className={`text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        件
                      </span>
                    </div>
                  </div>
                </div>
                {showNormaLine && averageTarget > 0 && (
                  <div className="px-2 text-center">
                    <div className="text-xs text-orange-600">ノルマライン</div>
                    <div className="text-lg font-bold text-orange-600 mt-1">
                      {formatNumber(averageTarget)}
                      <span className="text-sm font-normal text-orange-500">
                        {getUnitLabel(unit)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="relative py-6 flex-1 min-h-0">
            <PerformanceLabels />
            <AverageTargetLine
              averageTarget={showNormaLine ? averageTarget : 0}
              maxSales={maxSales}
              overlayLines={overlayLines}
              unit={unit}
            />
            <div className="absolute bottom-0 left-0 right-0 top-20 px-1">
              {/* ゾーン背景エリア */}
              {salesData.length > 0 && (
                <div className="absolute inset-0 flex pointer-events-none">
                  {salesData.map((_, index) => {
                    let zoneBg = '';
                    if (index < top20Index) {
                      zoneBg = darkMode ? 'bg-amber-900/10' : 'bg-amber-50/80';
                    } else if (index >= low20Index) {
                      zoneBg = darkMode ? 'bg-teal-900/10' : 'bg-teal-50/80';
                    }
                    return (
                      <div
                        key={index}
                        className={`flex-1 ${zoneBg}`}
                        style={{
                          minWidth: `${columnWidth}px`,
                          maxWidth: `${columnWidth}px`,
                        }}
                      />
                    );
                  })}
                </div>
              )}
              {/* ゾーン境界線 */}
              {salesData.length > 1 &&
                top20Index > 0 &&
                top20Index < salesData.length && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-10"
                    style={{
                      left: `${(top20Index / salesData.length) * 100}%`,
                      borderLeft: `2px dashed ${darkMode ? 'rgba(251, 191, 36, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    }}
                  />
                )}
              {salesData.length > 1 &&
                low20Index > 0 &&
                low20Index < salesData.length && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-10"
                    style={{
                      left: `${(low20Index / salesData.length) * 100}%`,
                      borderLeft: `2px dashed ${darkMode ? 'rgba(20, 184, 166, 0.4)' : 'rgba(13, 148, 136, 0.4)'}`,
                    }}
                  />
                )}
              <div className="relative h-full flex gap-1">
                {salesData.map((person, index) => (
                  <SalesBar
                    key={person.name}
                    person={person}
                    index={index}
                    maxSales={maxSales}
                    top20Index={top20Index}
                    low20Index={low20Index}
                    columnWidth={columnWidth}
                    changed={changedNames.has(person.name)}
                    unit={unit}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 順位行 */}
        <div
          className={`flex border-t border-b shrink-0 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
        >
          {!isDisplayMode && (
            <div
              className={`${stickyLabelClass} ${darkMode ? 'bg-gray-700!' : 'bg-gray-50!'}`}
              style={{ width: `${labelWidth}px` }}
            >
              <div
                className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                順位
              </div>
            </div>
          )}
          <div className="flex-1 flex px-1 gap-1">
            {salesData.map((person) => (
              <div
                key={person.name}
                className="flex-1 text-center py-2"
                style={{
                  minWidth: `${columnWidth}px`,
                  maxWidth: `${columnWidth}px`,
                }}
              >
                <div
                  className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                >
                  {person.rank}位
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* メンバー行 */}
        <div
          className={`flex border-b shrink-0 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
        >
          {!isDisplayMode && (
            <div
              className={stickyLabelClass}
              style={{ width: `${labelWidth}px` }}
            >
              <div
                className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                メンバー
              </div>
            </div>
          )}
          <div className="flex-1 flex px-1 gap-1">
            {salesData.map((person, index) => {
              const isChanged = changedNames.has(person.name);
              return (
                <div
                  key={person.name}
                  className="flex-1 flex flex-col items-center py-2"
                  style={{
                    minWidth: `${columnWidth}px`,
                    maxWidth: `${columnWidth}px`,
                  }}
                >
                  <div className="relative mb-1.5 w-full px-2">
                    <div
                      className={`relative w-full aspect-square rounded-sm bg-gray-300 overflow-hidden border border-white shadow-sm${isChanged ? ' animate-ring-glow' : ''}`}
                    >
                      {person.imageUrl ? (
                        <Image
                          src={person.imageUrl}
                          alt={person.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                          <span className="text-white text-xs font-bold">
                            {person.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    {index < top20Index && person.achievement >= 100 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-[9px] text-center font-medium leading-tight px-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                  >
                    {person.name}
                  </div>
                  {person.department && (
                    <div
                      className={`text-[8px] mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      {person.department}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 実績・達成率行 */}
        <div
          className={`flex border-b shrink-0 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
        >
          {!isDisplayMode && (
            <div
              className={stickyLabelClass}
              style={{ width: `${labelWidth}px` }}
            >
              <div className="text-center">
                <div
                  className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  実績
                </div>
                <div
                  className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  達成率
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 flex px-1 gap-1">
            {salesData.map((person) => {
              const isChanged = changedNames.has(person.name);
              return (
                <div
                  key={person.name}
                  className={`flex-1 text-center py-2${isChanged ? ' animate-card-flash' : ''}`}
                  style={{
                    minWidth: `${columnWidth}px`,
                    maxWidth: `${columnWidth}px`,
                  }}
                >
                  <div
                    className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}${isChanged ? ' animate-amount-flash' : ''}`}
                  >
                    {formatNumber(person.sales)}
                    {getUnitLabel(unit)}
                  </div>
                  <div
                    className={`text-sm font-bold mt-1 ${person.achievement >= 100 ? 'text-red-600' : person.achievement >= 80 ? 'text-blue-600' : 'text-gray-600'}${isChanged ? ' animate-achievement-flash' : ''}`}
                  >
                    {person.achievement}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 目標行 */}
        <div
          className={`flex border-b shrink-0 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
        >
          {!isDisplayMode && (
            <div
              className={stickyLabelClass}
              style={{ width: `${labelWidth}px` }}
            >
              <div
                className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                目標
              </div>
            </div>
          )}
          <div className="flex-1 flex px-1 gap-1">
            {salesData.map((person) => (
              <div
                key={person.name}
                className="flex-1 text-center py-2"
                style={{
                  minWidth: `${columnWidth}px`,
                  maxWidth: `${columnWidth}px`,
                }}
              >
                <div
                  className={`text-[11px] font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {formatNumber(person.target)}
                  {getUnitLabel(unit)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
