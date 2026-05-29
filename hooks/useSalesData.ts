'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SalesPerson,
  ReportData,
  RankingBoardData,
  TrendData,
  ViewType,
} from '@/types';
import { PeriodSelection } from '@/components/filter/PeriodNavigator';
import { DEFAULT_UNIT } from '@/types/units';

export interface SalesFilter {
  groupId: string;
  memberId: string;
}

export interface SalesDataState {
  salesData: SalesPerson[];
  recordCount: number;
  cumulativeSalesData: SalesPerson[];
  trendData: TrendData[];
  reportData: ReportData | null;
  rankingData: RankingBoardData | null;
  loading: boolean;
  fetchError: string | null;
  prevAvg: { prevMonthAvg: number; prevYearAvg: number };
}

export interface UseSalesDataReturn extends SalesDataState {
  filter: SalesFilter;
  setFilter: (f: SalesFilter) => void;
  period: PeriodSelection | null;
  setPeriod: (p: PeriodSelection | null) => void;
  dataTypeId: string;
  setDataTypeId: (id: string) => void;
  dataTypeUnit: string;
  setDataTypeUnit: (unit: string) => void;
  dataTypeName: string;
  setDataTypeName: (name: string) => void;
  aggregateField: string;
  setAggregateField: (field: string, unit?: string) => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  fetchData: () => void;
}

/** グラフ系ビュー（previous-avg を必要とするビュー） */
const GRAPH_VIEWS: ReadonlySet<ViewType> = new Set([
  'PERIOD_GRAPH',
  'CUMULATIVE_GRAPH',
  'TREND_GRAPH',
]);

export function useSalesData(): UseSalesDataReturn {
  const [salesData, setSalesData] = useState<SalesPerson[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [cumulativeSalesData, setCumulativeSalesData] = useState<SalesPerson[]>(
    [],
  );
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [rankingData, setRankingData] = useState<RankingBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SalesFilter>({
    groupId: '',
    memberId: '',
  });
  const [period, setPeriod] = useState<PeriodSelection | null>(null);
  const [dataTypeId, setDataTypeId] = useState('');
  const [dataTypeUnit, setDataTypeUnit] = useState<string>(DEFAULT_UNIT);
  const [dataTypeName, setDataTypeName] = useState<string>('');
  const [aggregateField, setAggregateFieldState] = useState<string>('value');
  const [currentView, setCurrentView] = useState<ViewType>('PERIOD_GRAPH');
  const [prevAvg, setPrevAvg] = useState<{
    prevMonthAvg: number;
    prevYearAvg: number;
  }>({ prevMonthAvg: 0, prevYearAvg: 0 });

  const setAggregateField = useCallback((field: string, unit?: string) => {
    setAggregateFieldState(field);
    if (unit) setDataTypeUnit(unit);
  }, []);

  const abortRef = useRef<AbortController | null>(null);
  // 同じ period/filter/dataType の間、previous-avg は 1 回だけ取得する。
  // period/filter/dataType が変わったら下の useEffect でリセットする。
  const prevAvgFetchedRef = useRef(false);

  const buildQuery = useCallback(() => {
    if (!period) return null;
    const params = new URLSearchParams();
    params.set('startDate', period.startDate);
    params.set('endDate', period.endDate);
    if (filter.memberId) params.set('memberId', filter.memberId);
    else if (filter.groupId) params.set('groupId', filter.groupId);
    if (dataTypeId) params.set('dataTypeId', dataTypeId);
    if (aggregateField && aggregateField !== 'value')
      params.set('aggregateField', aggregateField);
    return params.toString();
  }, [period, filter, dataTypeId, aggregateField]);

  /**
   * 現在のビューに対応する API のみを叩く。
   * グラフ系ビューでは previous-avg も（未取得なら）併せて取得する。
   */
  const fetchData = useCallback(async () => {
    const query = buildQuery();
    if (query === null) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    setFetchError(null);

    const fetchJson = async (path: string) => {
      const res = await fetch(`${path}?${query}`, { signal });
      return res.ok ? res.json() : null;
    };

    try {
      const tasks: Promise<unknown>[] = [];

      switch (currentView) {
        case 'PERIOD_GRAPH':
          tasks.push(
            fetchJson('/api/sales').then((json) => {
              if (json) {
                setSalesData(json.data);
                setRecordCount(json.recordCount);
              }
            }),
          );
          break;
        case 'CUMULATIVE_GRAPH':
          tasks.push(
            fetchJson('/api/sales/cumulative').then((json) => {
              if (json) setCumulativeSalesData(json);
            }),
          );
          break;
        case 'TREND_GRAPH':
          tasks.push(
            fetchJson('/api/sales/trend').then((json) => {
              if (json) setTrendData(json);
            }),
          );
          break;
        case 'REPORT':
          tasks.push(
            fetchJson('/api/sales/report').then((json) => {
              if (json) setReportData(json);
            }),
          );
          break;
        case 'RECORD':
          tasks.push(
            fetchJson('/api/sales/ranking').then((json) => {
              if (json) setRankingData(json);
            }),
          );
          break;
        default:
          break;
      }

      if (GRAPH_VIEWS.has(currentView) && !prevAvgFetchedRef.current) {
        prevAvgFetchedRef.current = true;
        tasks.push(
          fetchJson('/api/sales/previous-avg').then((json) => {
            if (json) setPrevAvg(json.data ?? json);
          }),
        );
      }

      await Promise.all(tasks);
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setFetchError(
        'データの取得に失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [buildQuery, currentView]);

  // period / filter / dataType / aggregateField が変わったら、
  // すべてのビューのキャッシュを破棄して previous-avg のフラグもリセットする。
  // （次に各ビューを開いたとき改めて取り直す）
  useEffect(() => {
    setSalesData([]);
    setRecordCount(0);
    setCumulativeSalesData([]);
    setTrendData([]);
    setReportData(null);
    setRankingData(null);
    setPrevAvg({ prevMonthAvg: 0, prevYearAvg: 0 });
    prevAvgFetchedRef.current = false;
  }, [period, filter, dataTypeId, aggregateField]);

  useEffect(() => {
    fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData]);

  return {
    salesData,
    recordCount,
    cumulativeSalesData,
    trendData,
    reportData,
    rankingData,
    loading,
    fetchError,
    prevAvg,
    filter,
    setFilter,
    period,
    setPeriod,
    dataTypeId,
    setDataTypeId,
    dataTypeUnit,
    setDataTypeUnit,
    dataTypeName,
    setDataTypeName,
    aggregateField,
    setAggregateField,
    currentView,
    setCurrentView,
    fetchData,
  };
}
