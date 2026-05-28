'use client';

import { ReactNode } from 'react';

interface ChartRowProps {
  /** 左側 sticky ラベルの中身。isDisplayMode のときは label 自体が非表示。 */
  label?: ReactNode;
  /** ラベル列の幅 (px) */
  labelWidth: number;
  /** カラム間ギャップ・両端パディング (px) */
  rowGap: number;
  /** isDisplayMode = true のとき左ラベル列を出さない */
  isDisplayMode: boolean;
  darkMode: boolean;
  /** 全体 <div> に追加する border クラスなど */
  className?: string;
  /** ラベル列に追加するクラス（背景色上書きなど） */
  labelClassName?: string;
  children: ReactNode;
}

/**
 * 売上パフォーマンス画面の各横方向「行」を表す共通コンポーネント。
 * - 左: sticky なラベル列（isDisplayMode 時は非表示）
 * - 右: rowGap でセルを並べる flex 領域
 *
 * 各セル本体は呼び出し側で <ChartRow.Cell> でラップする。
 */
export default function ChartRow({
  label,
  labelWidth,
  rowGap,
  isDisplayMode,
  darkMode,
  className = '',
  labelClassName = '',
  children,
}: ChartRowProps) {
  const stickyLabelBase = `shrink-0 sticky left-0 z-40 border-r flex items-center justify-center ${
    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
  }`;

  return (
    <div className={`flex ${className}`}>
      {!isDisplayMode && (
        <div
          className={`${stickyLabelBase} ${labelClassName}`}
          style={{ width: `${labelWidth}px` }}
        >
          {label}
        </div>
      )}
      <div
        className="flex-1 flex"
        style={{
          gap: `${rowGap}px`,
          paddingLeft: `${rowGap}px`,
          paddingRight: `${rowGap}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface ChartCellProps {
  columnWidth: number;
  className?: string;
  children: ReactNode;
}

/** ChartRow 内の固定幅セル。columnWidth で min/max を揃える。 */
export function ChartCell({
  columnWidth,
  className = '',
  children,
}: ChartCellProps) {
  return (
    <div
      className={`shrink-0 ${className}`}
      style={{
        minWidth: `${columnWidth}px`,
        maxWidth: `${columnWidth}px`,
      }}
    >
      {children}
    </div>
  );
}
