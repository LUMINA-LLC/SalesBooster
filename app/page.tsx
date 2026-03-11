'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/header/Header';
import FilterBar from '@/components/FilterBar';
import SalesPerformance from '@/components/SalesPerformance';
import CumulativeChart from '@/components/CumulativeChart';
import TrendChart from '@/components/TrendChart';
import SalesInputModal from '@/components/SalesInputModal';
import { SalesPerson, ViewType, ReportData, RankingBoardData, VIEW_TYPE_LABELS, TrendData } from '@/types';
import ReportView from '@/components/report/ReportView';
import RankingBoard from '@/components/record/RankingBoard';
import { useSalesPolling } from '@/hooks/useSalesPolling';
import { PeriodSelection } from '@/components/filter/PeriodNavigator';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileRankingList from '@/components/mobile/MobileRankingList';
import SetupWizard from '@/components/setup/SetupWizard';
import type { OverlayLineType } from '@/components/FilterBar';
import type { OverlayLine } from '@/components/AverageTargetLine';

const FETCH_DEBOUNCE_MS = 100;

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('PERIOD_GRAPH');
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [salesData, setSalesData] = useState<SalesPerson[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [cumulativeSalesData, setCumulativeSalesData] = useState<SalesPerson[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [rankingData, setRankingData] = useState<RankingBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ groupId: string; memberId: string }>({ groupId: '', memberId: '' });
  const [period, setPeriod] = useState<PeriodSelection | null>(null);
  const [dataTypeId, setDataTypeId] = useState('');
  const [overlayLines, setOverlayLines] = useState<OverlayLineType[]>(['norma']);
  const [prevAvg, setPrevAvg] = useState<{ prevMonthAvg: number; prevYearAvg: number }>({ prevMonthAvg: 0, prevYearAvg: 0 });
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const isMobile = useIsMobile();

  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);

  // ランキングデータ取得（期間に依存しない、グループ/メンバーのみ）
  const fetchRankingData = useCallback(async () => {
    try {
      const rankingParams = new URLSearchParams();
      if (filter.memberId) rankingParams.set('memberId', filter.memberId);
      else if (filter.groupId) rankingParams.set('groupId', filter.groupId);
      if (dataTypeId) rankingParams.set('dataTypeId', dataTypeId);
      const rankingRes = await fetch(`/api/sales/ranking?${rankingParams.toString()}`);
      if (rankingRes.ok) setRankingData(await rankingRes.json());
    } catch (error) {
      console.error('Failed to fetch ranking data:', error);
    }
  }, [filter, dataTypeId]);

  const fetchDataImmediate = useCallback(async () => {
    if (!period) return;

    try {
      setFetchError(null);
      const filterParams = new URLSearchParams();
      filterParams.set('startDate', period.startDate);
      filterParams.set('endDate', period.endDate);
      if (filter.memberId) filterParams.set('memberId', filter.memberId);
      else if (filter.groupId) filterParams.set('groupId', filter.groupId);
      if (dataTypeId) filterParams.set('dataTypeId', dataTypeId);
      const query = filterParams.toString();

      fetchRankingData();

      const [salesRes, cumulativeRes, trendRes, reportRes, prevAvgRes] = await Promise.all([
        fetch(`/api/sales?${query}`),
        fetch(`/api/sales/cumulative?${query}`),
        fetch(`/api/sales/trend?${query}`),
        fetch(`/api/sales/report?${query}`),
        fetch(`/api/sales/previous-avg?${query}`),
      ]);

      if (salesRes.ok) {
        const salesJson = await salesRes.json();
        setSalesData(salesJson.data);
        setRecordCount(salesJson.recordCount);
      }
      if (cumulativeRes.ok) setCumulativeSalesData(await cumulativeRes.json());
      if (trendRes.ok) setTrendData(await trendRes.json());
      if (reportRes.ok) setReportData(await reportRes.json());
      if (prevAvgRes.ok) {
        const avgJson = await prevAvgRes.json();
        setPrevAvg(avgJson.data ?? avgJson);
      }

    } catch {
      setFetchError('データの取得に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setLoading(false);
    }
  }, [period, filter, dataTypeId, fetchRankingData]);

  // デバウンス付きfetchData: 短時間の連続呼び出しを1回にまとめる
  const fetchData = useCallback(() => {
    if (fetchingRef.current) return;
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);

    fetchTimerRef.current = setTimeout(async () => {
      fetchingRef.current = true;
      try {
        await fetchDataImmediate();
      } finally {
        fetchingRef.current = false;
      }
    }, FETCH_DEBOUNCE_MS);
  }, [fetchDataImmediate]);

  // フィルター/期間変更時: データをクリアしてローディング表示してからfetch（アニメーション抑制のため）
  useEffect(() => {
    setSalesData([]);
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // ポーリングによるリアルタイム更新（データクリアなし → アニメーション発火可能）
  useSalesPolling({ onUpdate: fetchData });

  // セットアップウィザード表示判定
  useEffect(() => {
    fetch('/api/setup')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const status = data?.data ?? data;
        if (status && status.setupCompleted === false) {
          setShowSetupWizard(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSetupComplete = async () => {
    try {
      await fetch('/api/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupCompleted: true }),
      });
    } catch (err) {
      console.error('Failed to update setup status:', err);
    }
    setShowSetupWizard(false);
    fetchData();
  };

  const handleSetupSkip = async () => {
    try {
      await fetch('/api/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupCompleted: true }),
      });
    } catch (err) {
      console.error('Failed to update setup status:', err);
    }
    setShowSetupWizard(false);
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleAddSalesClick = () => {
    setIsSalesModalOpen(true);
  };

  const handleSalesModalClose = () => {
    setIsSalesModalOpen(false);
  };

  const handleSalesSubmit = async () => {
    // 送信元は即時反映
    fetchData();
  };

  // オーバーレイライン構築
  const buildOverlayLines = (): OverlayLine[] => {
    const lines: OverlayLine[] = [];
    if (overlayLines.includes('prev_month') && prevAvg.prevMonthAvg > 0) {
      lines.push({ value: prevAvg.prevMonthAvg, label: '前月平均', color: 'emerald-500', borderStyle: 'dashed' });
    }
    if (overlayLines.includes('prev_year') && prevAvg.prevYearAvg > 0) {
      lines.push({ value: prevAvg.prevYearAvg, label: '前年同月平均', color: 'purple-500', borderStyle: 'dashed' });
    }
    return lines;
  };

  const showNormaLine = overlayLines.includes('norma');
  const chartOverlayLines = buildOverlayLines();

  const isDataEmpty =
    (currentView === 'PERIOD_GRAPH' && salesData.length === 0) ||
    (currentView === 'CUMULATIVE_GRAPH' && cumulativeSalesData.length === 0) ||
    (currentView === 'TREND_GRAPH' && trendData.every((d) => d.sales === 0));

  const emptyMessage = (
    <div className="mx-6 my-4 p-12 bg-white rounded shadow-sm text-center">
      <div className="text-gray-400 text-lg mb-2">該当するデータがありません</div>
      <div className="text-gray-400 text-sm">フィルター条件を変更してください</div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <Header onAddSalesClick={handleAddSalesClick} />
      <FilterBar
        onViewChange={handleViewChange}
        onFilterChange={setFilter}
        onPeriodChange={setPeriod}
        onDataTypeChange={setDataTypeId}
        onOverlayLinesChange={setOverlayLines}
      />

      <main className="w-full flex-1 min-h-0 overflow-auto">
        {isMobile ? (
          <MobileRankingList salesData={salesData} loading={loading} onAddSalesClick={handleAddSalesClick} />
        ) : fetchError ? (
          <div className="mx-6 my-4 p-12 bg-white rounded shadow-sm text-center">
            <div className="text-red-500 text-lg mb-2">{fetchError}</div>
            <button
              onClick={fetchData}
              className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : loading ? (
          <div className="mx-6 my-4 p-12 bg-white rounded shadow-sm flex flex-col items-center justify-center h-[calc(100%-2rem)]">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="mt-3 text-sm text-gray-500">データを読み込み中...</div>
          </div>
        ) : isDataEmpty ? (
          emptyMessage
        ) : currentView === 'CUMULATIVE_GRAPH' ? (
          <CumulativeChart salesData={cumulativeSalesData} showNormaLine={showNormaLine} overlayLines={chartOverlayLines} />
        ) : currentView === 'PERIOD_GRAPH' ? (
          <SalesPerformance salesData={salesData} recordCount={recordCount} showNormaLine={showNormaLine} overlayLines={chartOverlayLines} />
        ) : currentView === 'TREND_GRAPH' ? (
          <TrendChart monthlyData={trendData} />
        ) : currentView === 'REPORT' && reportData ? (
          <ReportView reportData={reportData} />
        ) : currentView === 'RECORD' && rankingData ? (
          <RankingBoard data={rankingData} />
        ) : (
          <div className="mx-6 my-4 p-8 bg-white rounded shadow-sm text-center text-gray-500">
            {VIEW_TYPE_LABELS[currentView]}の表示は準備中です
          </div>
        )}
      </main>

      {/* データ入力モーダル */}
      <SalesInputModal
        isOpen={isSalesModalOpen}
        onClose={handleSalesModalClose}
        onSubmit={handleSalesSubmit}
      />

      {/* セットアップウィザード */}
      {showSetupWizard && (
        <SetupWizard onComplete={handleSetupComplete} onSkip={handleSetupSkip} />
      )}
    </div>
  );
}
