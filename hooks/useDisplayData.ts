'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { DisplayConfig, DATA_REFRESH_INTERVAL_MS } from '@/types/display';
import {
  SalesPerson,
  ReportData,
  RankingBoardData,
  TrendData,
  DataTypeInfo,
} from '@/types';
import { useSalesPolling } from './useSalesPolling';
import { DEFAULT_UNIT } from '@/types/units';
import { resolveViewPeriod, getCurrentMonthPeriod } from '@/lib/displayPeriod';

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

/**
 * dataTypeIdからunitを解決するヘルパー。
 * dataTypeId 未指定時は isDefault=true のデータ種類の unit を使う。
 * デフォルトも無い場合は最初のデータ種類、それも無ければ DEFAULT_UNIT。
 */
export function resolveUnit(
  dataTypeId: string | undefined,
  dataTypes: DataTypeInfo[],
): string {
  if (dataTypeId) {
    const dt = dataTypes.find((d) => String(d.id) === dataTypeId);
    if (dt?.unit) return dt.unit;
  }
  const defaultDt = dataTypes.find((d) => d.isDefault);
  if (defaultDt?.unit) return defaultDt.unit;
  if (dataTypes[0]?.unit) return dataTypes[0].unit;
  return DEFAULT_UNIT;
}

export function useDisplayData(config: DisplayConfig): UseDisplayDataReturn {
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
      // 期間グラフビューの設定を参照して期間を決定（ビュータイプに依存しない統一関数）
      const periodGraphView = config.views.find(
        (v) => v.viewType === 'PERIOD_GRAPH',
      );
      const period = resolveViewPeriod(periodGraphView);
      periodRef.current = period;

      // データ種類一覧を取得（ビューごとのunit解決に使用）
      fetch(`/api/data-types`, { signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((data: DataTypeInfo[]) => {
          if (!signal.aborted) setDataTypes(data);
        })
        .catch(() => {});

      // 共通フィルタ (groupId / memberId)
      const addBaseFilters = (params: URLSearchParams) => {
        if (config.filter.memberId)
          params.set('memberId', config.filter.memberId);
        else if (config.filter.groupId)
          params.set('groupId', config.filter.groupId);
      };

      // 各ビューの dataTypeId を解決 (空文字は未指定として扱う)
      const dataTypeIdFor = (viewType: string): string => {
        const v = config.views.find((x) => x.viewType === viewType);
        return v?.dataTypeId || '';
      };

      // 期間グラフ
      const filterParams = new URLSearchParams();
      filterParams.set('startDate', period.startDate);
      filterParams.set('endDate', period.endDate);
      addBaseFilters(filterParams);
      const periodGraphDtId = dataTypeIdFor('PERIOD_GRAPH');
      if (periodGraphDtId) filterParams.set('dataTypeId', periodGraphDtId);

      // 累計グラフ
      const cumulativeView = config.views.find(
        (v) => v.viewType === 'CUMULATIVE_GRAPH',
      );
      const cumulativePeriod = resolveViewPeriod(cumulativeView);
      const cumulativeParams = new URLSearchParams();
      cumulativeParams.set('startDate', cumulativePeriod.startDate);
      cumulativeParams.set('endDate', cumulativePeriod.endDate);
      addBaseFilters(cumulativeParams);
      const cumulativeDtId = dataTypeIdFor('CUMULATIVE_GRAPH');
      if (cumulativeDtId) cumulativeParams.set('dataTypeId', cumulativeDtId);

      // 推移グラフ (期間グラフと同じ期間を流用)
      const trendParams = new URLSearchParams();
      trendParams.set('startDate', period.startDate);
      trendParams.set('endDate', period.endDate);
      addBaseFilters(trendParams);
      const trendDtId = dataTypeIdFor('TREND_GRAPH');
      if (trendDtId) trendParams.set('dataTypeId', trendDtId);

      // レポート
      const reportParams = new URLSearchParams();
      reportParams.set('startDate', period.startDate);
      reportParams.set('endDate', period.endDate);
      addBaseFilters(reportParams);
      const reportDtId = dataTypeIdFor('REPORT');
      if (reportDtId) reportParams.set('dataTypeId', reportDtId);

      // レコード (ランキング)
      const rankingParams = new URLSearchParams();
      addBaseFilters(rankingParams);
      const recordDtId = dataTypeIdFor('RECORD');
      if (recordDtId) rankingParams.set('dataTypeId', recordDtId);

      const [salesRes, cumulativeRes, trendRes, reportRes, rankingRes] =
        await Promise.all([
          fetch(`/api/sales?${filterParams.toString()}`, { signal }),
          fetch(`/api/sales/cumulative?${cumulativeParams.toString()}`, {
            signal,
          }),
          fetch(`/api/sales/trend?${trendParams.toString()}`, { signal }),
          fetch(`/api/sales/report?${reportParams.toString()}`, { signal }),
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
  }, [config.filter, config.views]);

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
