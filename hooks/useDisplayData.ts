'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DisplayConfig,
  DisplayViewConfig,
  PeriodMode,
  DATA_REFRESH_INTERVAL_MS,
} from '@/types/display';
import {
  SalesPerson,
  ReportData,
  RankingBoardData,
  TrendData,
  DataTypeInfo,
} from '@/types';
import { useSalesPolling } from './useSalesPolling';
import { DEFAULT_UNIT } from '@/types/units';

interface UseDisplayDataReturn {
  salesData: SalesPerson[];
  recordCount: number;
  cumulativeSalesData: SalesPerson[];
  trendData: TrendData[];
  reportData: ReportData | null;
  rankingData: RankingBoardData | null;
  loading: boolean;
  error: string | null;
  dataTypes: DataTypeInfo[];
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
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

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
      const fiscalStart =
        now.getMonth() >= 3
          ? new Date(now.getFullYear(), 3, 1)
          : new Date(now.getFullYear() - 1, 3, 1);
      return {
        startDate: fiscalStart.toISOString(),
        endDate: endDate.toISOString(),
      };
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
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString(), endDate: endDate.toISOString() };
    }
  }
}

/** dataTypeIdからunitを解決するヘルパー */
export function resolveUnit(
  dataTypeId: string | undefined,
  dataTypes: DataTypeInfo[],
): string {
  if (!dataTypeId) return DEFAULT_UNIT;
  const dt = dataTypes.find((d) => String(d.id) === dataTypeId);
  return dt?.unit || DEFAULT_UNIT;
}

export function useDisplayData(
  config: DisplayConfig,
  currentDataTypeId?: string,
): UseDisplayDataReturn {
  const [salesData, setSalesData] = useState<SalesPerson[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [cumulativeSalesData, setCumulativeSalesData] = useState<SalesPerson[]>(
    [],
  );
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [rankingData, setRankingData] = useState<RankingBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
  const periodRef = useRef(getCurrentMonthPeriod());
  // dataTypeIdが変わった際の再取得で loading フラッシュを抑制するフラグ
  const initialLoadDoneRef = useRef(false);

  const abortRef = useRef<AbortController | null>(null);

  const fetchAllData = useCallback(async () => {
    // 前のリクエストをキャンセル
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    try {
      setError(null);
      const period = getCurrentMonthPeriod();
      periodRef.current = period;

      // データ種類一覧を取得（ビューごとのunit解決に使用）
      fetch(`/api/data-types`, { signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((data: DataTypeInfo[]) => {
          if (!signal.aborted) setDataTypes(data);
        })
        .catch(() => {});

      const addCommonFilters = (params: URLSearchParams) => {
        if (config.filter.memberId)
          params.set('memberId', config.filter.memberId);
        else if (config.filter.groupId)
          params.set('groupId', config.filter.groupId);
        if (currentDataTypeId) params.set('dataTypeId', currentDataTypeId);
      };

      const filterParams = new URLSearchParams();
      filterParams.set('startDate', period.startDate);
      filterParams.set('endDate', period.endDate);
      addCommonFilters(filterParams);
      const query = filterParams.toString();

      const rankingParams = new URLSearchParams();
      addCommonFilters(rankingParams);

      // 累計グラフ用の期間パラメータ
      const cumulativeView = config.views.find(
        (v) => v.viewType === 'CUMULATIVE_GRAPH',
      );
      const cumulativePeriod = resolvePeriod(
        cumulativeView?.periodMode ?? null,
        cumulativeView,
      );
      const cumulativeParams = new URLSearchParams();
      cumulativeParams.set('startDate', cumulativePeriod.startDate);
      cumulativeParams.set('endDate', cumulativePeriod.endDate);
      addCommonFilters(cumulativeParams);
      const cumulativeQuery = cumulativeParams.toString();

      const [salesRes, cumulativeRes, trendRes, reportRes, rankingRes] =
        await Promise.all([
          fetch(`/api/sales?${query}`, { signal }),
          fetch(`/api/sales/cumulative?${cumulativeQuery}`, { signal }),
          fetch(`/api/sales/trend?${query}`, { signal }),
          fetch(`/api/sales/report?${query}`, { signal }),
          fetch(`/api/sales/ranking?${rankingParams.toString()}`, { signal }),
        ]);

      if (signal.aborted) return;

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
      if (signal.aborted) return;
      setError(
        'データの取得に失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        initialLoadDoneRef.current = true;
      }
    }
  }, [config.filter, config.views, currentDataTypeId]);

  // 初回データ取得 + dataTypeId変更時の再取得
  useEffect(() => {
    fetchAllData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchAllData]);

  // ポーリング更新
  useSalesPolling({
    onUpdate: fetchAllData,
    intervalMs: DATA_REFRESH_INTERVAL_MS[config.dataRefreshInterval],
  });

  return {
    salesData,
    recordCount,
    cumulativeSalesData,
    trendData,
    reportData,
    rankingData,
    loading,
    error,
    dataTypes,
  };
}
