'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { DisplayConfig, DisplayViewConfig, PeriodMode } from '@/types/display';
import { SalesPerson, ReportData, RankingBoardData, TrendData } from '@/types';
import { useSalesPolling } from './useSalesPolling';

interface UseDisplayDataReturn {
  salesData: SalesPerson[];
  recordCount: number;
  cumulativeSalesData: SalesPerson[];
  trendData: TrendData[];
  reportData: ReportData | null;
  rankingData: RankingBoardData | null;
  loading: boolean;
  error: string | null;
}

function getCurrentMonthPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** periodModeに応じた期間を計算 */
function resolvePeriod(
  mode: PeriodMode | null | undefined,
  view?: DisplayViewConfig | undefined,
): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  switch (mode) {
    case 'LAST_3M': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { startDate: start.toISOString(), endDate: endDate.toISOString() };
    }
    case 'LAST_6M': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { startDate: start.toISOString(), endDate: endDate.toISOString() };
    }
    case 'FISCAL_YEAR': {
      // 4月始まり: 現在月が4月以降なら今年の4月、1-3月なら前年の4月
      const fiscalStart = now.getMonth() >= 3
        ? new Date(now.getFullYear(), 3, 1)
        : new Date(now.getFullYear() - 1, 3, 1);
      return { startDate: fiscalStart.toISOString(), endDate: endDate.toISOString() };
    }
    case 'CUSTOM': {
      let startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      let endStr = endDate.toISOString();
      if (view?.periodStartMonth) {
        startDate = new Date(`${view.periodStartMonth}-01`).toISOString();
      }
      if (view?.periodEndMonth) {
        const [y, m] = view.periodEndMonth.split('-').map(Number);
        endStr = new Date(y, m, 0, 23, 59, 59).toISOString();
      }
      return { startDate, endDate: endStr };
    }
    case 'YTD':
    default: {
      // 年初〜当月
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString(), endDate: endDate.toISOString() };
    }
  }
}

export function useDisplayData(config: DisplayConfig): UseDisplayDataReturn {
  const [salesData, setSalesData] = useState<SalesPerson[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [cumulativeSalesData, setCumulativeSalesData] = useState<SalesPerson[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [rankingData, setRankingData] = useState<RankingBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const periodRef = useRef(getCurrentMonthPeriod());

  const fetchAllData = useCallback(async () => {
    try {
      setError(null);
      const period = getCurrentMonthPeriod();
      periodRef.current = period;

      const filterParams = new URLSearchParams();
      filterParams.set('startDate', period.startDate);
      filterParams.set('endDate', period.endDate);
      if (config.filter.memberId) filterParams.set('memberId', config.filter.memberId);
      else if (config.filter.groupId) filterParams.set('groupId', config.filter.groupId);
      const query = filterParams.toString();

      const rankingParams = new URLSearchParams();
      if (config.filter.memberId) rankingParams.set('memberId', config.filter.memberId);
      else if (config.filter.groupId) rankingParams.set('groupId', config.filter.groupId);

      // 累計グラフ用の期間パラメータ（ビューのperiodModeに応じて計算）
      const cumulativeView = config.views.find((v) => v.viewType === 'CUMULATIVE_GRAPH');
      const cumulativePeriod = resolvePeriod(cumulativeView?.periodMode ?? null, cumulativeView);
      const cumulativeParams = new URLSearchParams();
      cumulativeParams.set('startDate', cumulativePeriod.startDate);
      cumulativeParams.set('endDate', cumulativePeriod.endDate);
      if (config.filter.memberId) cumulativeParams.set('memberId', config.filter.memberId);
      else if (config.filter.groupId) cumulativeParams.set('groupId', config.filter.groupId);
      const cumulativeQuery = cumulativeParams.toString();

      const [salesRes, cumulativeRes, trendRes, reportRes, rankingRes] = await Promise.all([
        fetch(`/api/sales?${query}`),
        fetch(`/api/sales/cumulative?${cumulativeQuery}`),
        fetch(`/api/sales/trend?${query}`),
        fetch(`/api/sales/report?${query}`),
        fetch(`/api/sales/ranking?${rankingParams.toString()}`),
      ]);

      if (salesRes.ok) {
        const salesJson = await salesRes.json();
        setSalesData(salesJson.data);
        setRecordCount(salesJson.recordCount);
      }
      if (cumulativeRes.ok) setCumulativeSalesData(await cumulativeRes.json());
      if (trendRes.ok) setTrendData(await trendRes.json());
      if (reportRes.ok) setReportData(await reportRes.json());
      if (rankingRes.ok) setRankingData(await rankingRes.json());
    } catch {
      setError('データの取得に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setLoading(false);
    }
  }, [config.filter, config.views]);

  // 初回データ取得
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ポーリング更新
  useSalesPolling({ onUpdate: fetchAllData, intervalMs: config.dataRefreshInterval });

  return {
    salesData,
    recordCount,
    cumulativeSalesData,
    trendData,
    reportData,
    rankingData,
    loading,
    error,
  };
}
