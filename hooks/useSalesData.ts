'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SalesPerson, ReportData, RankingBoardData, TrendData } from '@/types';
import { PeriodSelection } from '@/components/filter/PeriodNavigator';
import { useSalesPolling } from './useSalesPolling';
import { DEFAULT_UNIT } from '@/types/units';

const FETCH_DEBOUNCE_MS = 100;

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
  fetchData: () => void;
}

export function useSalesData(): UseSalesDataReturn {
  const [salesData, setSalesData] = useState<SalesPerson[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [cumulativeSalesData, setCumulativeSalesData] = useState<SalesPerson[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [rankingData, setRankingData] = useState<RankingBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SalesFilter>({ groupId: '', memberId: '' });
  const [period, setPeriod] = useState<PeriodSelection | null>(null);
  const [dataTypeId, setDataTypeId] = useState('');
  const [dataTypeUnit, setDataTypeUnit] = useState<string>(DEFAULT_UNIT);
  const [prevAvg, setPrevAvg] = useState<{ prevMonthAvg: number; prevYearAvg: number }>({ prevMonthAvg: 0, prevYearAvg: 0 });

  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);

  const fetchRankingData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.memberId) params.set('memberId', filter.memberId);
      else if (filter.groupId) params.set('groupId', filter.groupId);
      if (dataTypeId) params.set('dataTypeId', dataTypeId);
      const res = await fetch(`/api/sales/ranking?${params.toString()}`);
      if (res.ok) setRankingData(await res.json());
    } catch (error) {
      console.error('Failed to fetch ranking data:', error);
    }
  }, [filter, dataTypeId]);

  const fetchDataImmediate = useCallback(async () => {
    if (!period) return;

    try {
      setFetchError(null);
      const params = new URLSearchParams();
      params.set('startDate', period.startDate);
      params.set('endDate', period.endDate);
      if (filter.memberId) params.set('memberId', filter.memberId);
      else if (filter.groupId) params.set('groupId', filter.groupId);
      if (dataTypeId) params.set('dataTypeId', dataTypeId);
      const query = params.toString();

      fetchRankingData();

      const [salesRes, cumulativeRes, trendRes, reportRes, prevAvgRes] = await Promise.all([
        fetch(`/api/sales?${query}`),
        fetch(`/api/sales/cumulative?${query}`),
        fetch(`/api/sales/trend?${query}`),
        fetch(`/api/sales/report?${query}`),
        fetch(`/api/sales/previous-avg?${query}`),
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
    } catch {
      setFetchError('データの取得に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setLoading(false);
    }
  }, [period, filter, dataTypeId, fetchRankingData]);

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

  // フィルター/期間変更時
  useEffect(() => {
    setSalesData([]);
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // ポーリング
  useSalesPolling({ onUpdate: fetchData });

  return {
    salesData, recordCount, cumulativeSalesData, trendData, reportData, rankingData,
    loading, fetchError, prevAvg,
    filter, setFilter, period, setPeriod,
    dataTypeId, setDataTypeId, dataTypeUnit, setDataTypeUnit,
    fetchData,
  };
}
