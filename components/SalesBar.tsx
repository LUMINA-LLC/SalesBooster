'use client';

import { SalesPerson } from '@/types';
import { formatNumber } from '@/lib/currency';

interface SalesBarProps {
  person: SalesPerson;
  index: number;
  maxSales: number;
  top20Index: number;
  low20Index: number;
  columnWidth: number;
  changed?: boolean;
}

export default function SalesBar({ person, index, maxSales, top20Index, low20Index, columnWidth, changed }: SalesBarProps) {
  const barHeight = maxSales > 0 ? (person.sales / maxSales) * 100 : 0;

  // 色分け関数 - エネルギッシュで勝利感のあるデザイン
  const getBarColors = (index: number) => {
    if (index < top20Index) {
      // TOP 20% - ゴールド × オレンジ（勝者の輝き）
      return {
        main: '#F59E0B',
        gradient: 'linear-gradient(180deg, #FCD34D 0%, #F59E0B 30%, #D97706 70%, #B45309 100%)',
        topGradient: 'linear-gradient(180deg, #FEF3C7 0%, #FBBF24 50%, #F59E0B 100%)',
        glow: '0 0 20px rgba(251, 191, 36, 0.5)',
      };
    }
    if (index < low20Index) {
      // CENTER - ビビッドブルー × シアン（成長中）
      return {
        main: '#0EA5E9',
        gradient: 'linear-gradient(180deg, #7DD3FC 0%, #38BDF8 30%, #0EA5E9 70%, #0284C7 100%)',
        topGradient: 'linear-gradient(180deg, #E0F2FE 0%, #7DD3FC 50%, #38BDF8 100%)',
        glow: '0 0 15px rgba(56, 189, 248, 0.4)',
      };
    }
    // LOW 20% - ティール × グリーン（チャレンジャー）
    return {
      main: '#14B8A6',
      gradient: 'linear-gradient(180deg, #5EEAD4 0%, #2DD4BF 30%, #14B8A6 70%, #0D9488 100%)',
      topGradient: 'linear-gradient(180deg, #CCFBF1 0%, #5EEAD4 50%, #2DD4BF 100%)',
      glow: '0 0 12px rgba(45, 212, 191, 0.3)',
    };
  };

  const colors = getBarColors(index);
  const cylinderWidth = columnWidth - 20; // 円柱の幅

  return (
    <div
      className="flex-1 h-full flex flex-col justify-end items-center"
      style={{ minWidth: `${columnWidth}px`, maxWidth: `${columnWidth}px` }}
    >
      {/* 円柱バー */}
      {person.sales > 0 && (
        <div
          className={`relative flex flex-col items-center${changed ? ' animate-bar-power' : ''}`}
          style={{
            height: `${barHeight}%`,
            minHeight: '50px',
            width: `${cylinderWidth}px`,
            transition: 'height 2s cubic-bezier(0.22, 1.2, 0.36, 1)',
          }}
        >
          {/* 売上金額バッジ - 円柱の上に浮かぶ */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2 z-30 whitespace-nowrap"
            style={{ top: '-28px' }}
          >
            <div
              className={`px-2 py-1 rounded-full text-white font-bold text-xs shadow-lg${changed ? ' animate-badge-burst' : ''}`}
              style={{
                background: colors.main,
                boxShadow: changed
                  ? `0 4px 20px ${colors.main}, 0 0 30px ${colors.main}90`
                  : `0 2px 8px ${colors.main}80`,
                transition: 'box-shadow 0.5s ease',
              }}
            >
              {formatNumber(person.sales)}万円
            </div>
          </div>

          {/* 上部の楕円（蓋） */}
          <div
            className="absolute top-0 left-0 right-0 z-10"
            style={{
              height: '14px',
              background: colors.topGradient,
              borderRadius: '50%',
              transform: 'translateY(-7px)',
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15)',
            }}
          />

          {/* 円柱の本体 */}
          <div
            className="absolute inset-0"
            style={{
              background: colors.gradient,
              boxShadow: colors.glow,
            }}
          />

          {/* サムアップアイコン（TOP 20%のみ）*/}
          {index < top20Index && (
            <div className="absolute left-1/2 transform -translate-x-1/2 z-20" style={{ top: '50%', marginTop: '-20px' }}>
              <svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
