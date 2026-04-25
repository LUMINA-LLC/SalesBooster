'use client';

import {
  ViewType,
  SalesPerson,
  ReportData,
  RankingBoardData,
  TrendData,
  NumberBoardMetric,
  DataTypeInfo,
} from '@/types';
import { CustomSlideData, NumberBoardMetricConfig } from '@/types/display';
import { GraphConfig, DEFAULT_GRAPH_CONFIG } from '@/types/graph';
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
  numberBoardMetricConfigs?: NumberBoardMetricConfig[];
  unit?: string;
  dataTypes?: DataTypeInfo[];
  filter?: { groupId: string; memberId: string };
  graphConfig?: GraphConfig;
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
  numberBoardMetricConfigs,
  unit,
  dataTypes,
  filter,
  graphConfig = DEFAULT_GRAPH_CONFIG,
  onVideoEnd,
}: DisplayViewRendererProps) {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div
          className="mt-3 text-sm"
          style={{ color: 'var(--display-text-secondary)' }}
        >
          データを読み込み中...
        </div>
      </div>
    );
  }

  switch (view) {
    case 'PERIOD_GRAPH':
      return (
        <SalesPerformance
          salesData={salesData}
          recordCount={recordCount}
          darkMode={darkMode}
          isDisplayMode
          unit={unit}
          showNormaLine={graphConfig.showNormaLine}
          graphConfig={graphConfig}
        />
      );
    case 'CUMULATIVE_GRAPH':
      return (
        <CumulativeChart
          salesData={cumulativeSalesData}
          darkMode={darkMode}
          unit={unit}
          showNormaLine={graphConfig.showNormaLine}
          graphConfig={graphConfig}
        />
      );
    case 'TREND_GRAPH':
      return (
        <TrendChart monthlyData={trendData} darkMode={darkMode} unit={unit} />
      );
    case 'REPORT':
      return reportData ? (
        <ReportView reportData={reportData} darkMode={darkMode} unit={unit} />
      ) : null;
    case 'RECORD':
      return rankingData ? (
        <RankingBoard data={rankingData} darkMode={darkMode} unit={unit} />
      ) : null;
    case 'CUSTOM_SLIDE':
      return customSlide ? (
        <CustomSlideView
          slide={customSlide}
          darkMode={darkMode}
          onVideoEnd={onVideoEnd}
        />
      ) : null;
    case 'NUMBER_BOARD':
      return (
        <NumberBoard
          salesData={salesData}
          recordCount={recordCount}
          metrics={numberBoardMetrics ?? ['TOTAL_SALES', 'TOTAL_COUNT']}
          metricConfigs={numberBoardMetricConfigs}
          darkMode={darkMode}
          unit={unit}
          dataTypes={dataTypes}
          filter={filter}
        />
      );
    default:
      return (
        <div
          className="h-full flex items-center justify-center"
          style={{ color: 'var(--display-text-secondary)' }}
        >
          データがありません
        </div>
      );
  }
}
