'use client';

import { ReportSummary, DataTypeInfo } from '@/types';
import {
  ViewType,
  SalesEntry,
  RankingBoardData,
  TrendData,
  NumberBoardMetric,
} from '@/types/salesView';
import { CustomSlideData, NumberBoardMetricConfig } from '@/types/display';
import { GraphConfig, DEFAULT_GRAPH_CONFIG } from '@/types/graph';
import SalesPerformance from '@/components/sales-performance';
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
  salesData: SalesEntry[];
  recordCount: number;
  cumulativeSalesData: SalesEntry[];
  trendData: TrendData[];
  reportSummary: ReportSummary | null;
  rankingData: RankingBoardData | null;
  customSlide?: CustomSlideData | null;
  numberBoardMetrics?: NumberBoardMetric[];
  numberBoardMetricConfigs?: NumberBoardMetricConfig[];
  unit?: string;
  /** 現在表示中ビューのデータ種別名 (例: "売上") */
  dataTypeName?: string;
  dataTypes?: DataTypeInfo[];
  filter?: { groupId: string; memberId: string };
  graphConfig?: GraphConfig;
  /** グラフ系ビューの1ページ表示人数（null/0=全員） */
  membersPerPage?: number | null;
  /** ビューの表示秒数（ページ送りの等分に使う） */
  durationSec?: number;
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
  reportSummary,
  rankingData,
  customSlide,
  numberBoardMetrics,
  numberBoardMetricConfigs,
  unit,
  dataTypeName,
  dataTypes,
  filter,
  graphConfig = DEFAULT_GRAPH_CONFIG,
  membersPerPage,
  durationSec = 30,
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
          dataTypeName={dataTypeName}
          showNormaLine={graphConfig.showNormaLine}
          graphConfig={graphConfig}
          membersPerPage={membersPerPage}
          durationSec={durationSec}
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
          membersPerPage={membersPerPage}
          durationSec={durationSec}
        />
      );
    case 'TREND_GRAPH':
      return (
        <TrendChart monthlyData={trendData} darkMode={darkMode} unit={unit} />
      );
    case 'REPORT':
      return reportSummary ? (
        <ReportView summary={reportSummary} darkMode={darkMode} />
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
