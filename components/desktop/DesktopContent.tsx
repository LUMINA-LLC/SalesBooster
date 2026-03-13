'use client';

import SalesPerformance from '@/components/SalesPerformance';
import CumulativeChart from '@/components/CumulativeChart';
import TrendChart from '@/components/TrendChart';
import ReportView from '@/components/report/ReportView';
import RankingBoard from '@/components/record/RankingBoard';
import { ViewType, VIEW_TYPE_LABELS } from '@/types';
import type { OverlayLine } from '@/components/AverageTargetLine';
import type { OverlayLineType } from '@/components/FilterBar';
import type { UseSalesDataReturn } from '@/hooks/useSalesData';

interface DesktopContentProps {
  data: UseSalesDataReturn;
  currentView: ViewType;
  overlayLines: OverlayLineType[];
}

export default function DesktopContent({ data, currentView, overlayLines }: DesktopContentProps) {
  const { salesData, recordCount, cumulativeSalesData, trendData, reportData, rankingData, loading, fetchError, prevAvg, dataTypeUnit, fetchData } = data;

  // オーバーレイライン構築
  const chartOverlayLines: OverlayLine[] = [];
  if (overlayLines.includes('prev_month') && prevAvg.prevMonthAvg > 0) {
    chartOverlayLines.push({ value: prevAvg.prevMonthAvg, label: '前月平均', color: 'emerald-500', borderStyle: 'dashed' });
  }
  if (overlayLines.includes('prev_year') && prevAvg.prevYearAvg > 0) {
    chartOverlayLines.push({ value: prevAvg.prevYearAvg, label: '前年同月平均', color: 'purple-500', borderStyle: 'dashed' });
  }
  const showNormaLine = overlayLines.includes('norma');

  const isDataEmpty =
    (currentView === 'PERIOD_GRAPH' && salesData.length === 0) ||
    (currentView === 'CUMULATIVE_GRAPH' && cumulativeSalesData.length === 0) ||
    (currentView === 'TREND_GRAPH' && trendData.every((d) => d.sales === 0));

  if (fetchError) {
    return (
      <div className="mx-6 my-4 p-12 bg-white rounded shadow-sm text-center">
        <div className="text-red-500 text-lg mb-2">{fetchError}</div>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-6 my-4 p-12 bg-white rounded shadow-sm flex flex-col items-center justify-center h-[calc(100%-2rem)]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        <div className="mt-3 text-sm text-gray-500">データを読み込み中...</div>
      </div>
    );
  }

  if (isDataEmpty) {
    return (
      <div className="mx-6 my-4 p-12 bg-white rounded shadow-sm text-center">
        <div className="text-gray-400 text-lg mb-2">該当するデータがありません</div>
        <div className="text-gray-400 text-sm">フィルター条件を変更してください</div>
      </div>
    );
  }

  if (currentView === 'CUMULATIVE_GRAPH') {
    return <CumulativeChart salesData={cumulativeSalesData} showNormaLine={showNormaLine} overlayLines={chartOverlayLines} unit={dataTypeUnit} />;
  }
  if (currentView === 'PERIOD_GRAPH') {
    return <SalesPerformance salesData={salesData} recordCount={recordCount} showNormaLine={showNormaLine} overlayLines={chartOverlayLines} unit={dataTypeUnit} />;
  }
  if (currentView === 'TREND_GRAPH') {
    return <TrendChart monthlyData={trendData} />;
  }
  if (currentView === 'REPORT' && reportData) {
    return <ReportView reportData={reportData} />;
  }
  if (currentView === 'RECORD' && rankingData) {
    return <RankingBoard data={rankingData} />;
  }

  return (
    <div className="mx-6 my-4 p-8 bg-white rounded shadow-sm text-center text-gray-500">
      {VIEW_TYPE_LABELS[currentView]}の表示は準備中です
    </div>
  );
}
