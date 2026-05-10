'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SalesPerson, ReportData, RankingBoardData, TrendData } from '@/types';
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
  fetchData: () => void;
}

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
  const [prevAvg, setPrevAvg] = useState<{
    prevMonthAvg: number;
    prevYearAvg: number;
  }>({ prevMonthAvg: 0, prevYearAvg: 0 });

  const setAggregateField = useCallback((field: string, unit?: string) => {
    setAggregateFieldState(field);
    if (unit) setDataTypeUnit(unit);
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!period) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    setFetchError(null);

    const params = new URLSearchParams();
    params.set('startDate', period.startDate);
    params.set('endDate', period.endDate);
    if (filter.memberId) params.set('memberId', filter.memberId);
    else if (filter.groupId) params.set('groupId', filter.groupId);
    if (dataTypeId) params.set('dataTypeId', dataTypeId);
    if (aggregateField && aggregateField !== 'value')
      params.set('aggregateField', aggregateField);
    const query = params.toString();

    try {
      const [
        salesRes,
        cumulativeRes,
        trendRes,
        reportRes,
        prevAvgRes,
        rankingRes,
      ] = await Promise.all([
        fetch(`/api/sales?${query}`, { signal }),
        fetch(`/api/sales/cumulative?${query}`, { signal }),
        fetch(`/api/sales/trend?${query}`, { signal }),
        fetch(`/api/sales/report?${query}`, { signal }),
        fetch(`/api/sales/previous-avg?${query}`, { signal }),
        fetch(`/api/sales/ranking?${query}`, { signal }),
      ]);

      if (salesRes.ok) {
        const json = await salesRes.json();
        setSalesData(json.data);
        setRecordCount(json.recordCount);
      }
      if (cumulativeRes.ok) setCumulativeSalesData(await cumulativeRes.json());
      if (trendRes.ok) setTrendData(await trendRes.json());
      if (reportRes.ok) setReportData(await reportRes.json());
      if (prevAvgRes.ok) {
        const json = await prevAvgRes.json();
        setPrevAvg(json.data ?? json);
      }
      if (rankingRes.ok) setRankingData(await rankingRes.json());
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setFetchError(
        'データの取得に失敗しました。ネットワーク接続を確認してください。',
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
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
    fetchData,
  };
}
