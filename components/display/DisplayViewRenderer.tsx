'use client';

import { ViewType, SalesPerson, ReportData, RankingBoardData, TrendData, NumberBoardMetric } from '@/types';
import { CustomSlideData } from '@/types/display';
import SalesPerformance from '@/components/SalesPerformance';
import CumulativeChart from '@/components/CumulativeChart';
import TrendChart from '@/components/TrendChart';
import ReportView from '@/components/report/ReportView';
import RankingBoard from '@/components/record/RankingBoard';
import CustomSlideView from './CustomSlideView';
import NumberBoard from './NumberBoard';

interface DisplayViewRendererProps {
  view: ViewType;
  darkMode: boolean;
  loading: boolean;
  salesData: SalesPerson[];
  recordCount: number;
  cumulativeSalesData: SalesPerson[];
  trendData: TrendData[];
  reportData: ReportData | null;
  rankingData: RankingBoardData | null;
  customSlide?: CustomSlideData | null;
  numberBoardMetrics?: NumberBoardMetric[];
  onVideoEnd?: () => void;
}

export default function DisplayViewRenderer({
  view,
  darkMode,
  loading,
  salesData,
  recordCount,
  cumulativeSalesData,
  trendData,
  reportData,
  rankingData,
  customSlide,
  numberBoardMetrics,
  onVideoEnd,
}: DisplayViewRendererProps) {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="mt-3 text-sm" style={{ color: 'var(--display-text-secondary)' }}>データを読み込み中...</div>
      </div>
    );
  }

  switch (view) {
    case 'PERIOD_GRAPH':
      return <SalesPerformance salesData={salesData} recordCount={recordCount} darkMode={darkMode} isDisplayMode />;
    case 'CUMULATIVE_GRAPH':
      return <CumulativeChart salesData={cumulativeSalesData} darkMode={darkMode} />;
    case 'TREND_GRAPH':
      return <TrendChart monthlyData={trendData} darkMode={darkMode} />;
    case 'REPORT':
      return reportData ? <ReportView reportData={reportData} darkMode={darkMode} /> : null;
    case 'RECORD':
      return rankingData ? <RankingBoard data={rankingData} darkMode={darkMode} /> : null;
    case 'CUSTOM_SLIDE':
      return customSlide ? <CustomSlideView slide={customSlide} darkMode={darkMode} onVideoEnd={onVideoEnd} /> : null;
    case 'NUMBER_BOARD':
      return <NumberBoard salesData={salesData} recordCount={recordCount} metrics={numberBoardMetrics ?? ['TOTAL_SALES', 'TOTAL_COUNT']} darkMode={darkMode} />;
    default:
      return (
        <div className="h-full flex items-center justify-center" style={{ color: 'var(--display-text-secondary)' }}>
          データがありません
        </div>
      );
  }
}
