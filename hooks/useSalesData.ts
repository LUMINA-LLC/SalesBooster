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

/**
 * fetch 起動の集約待ち時間（ms）。
 * ビュー切替などで period が複数の連続レンダーに跨って確定する場合に、
 * その間の中間状態での fetch を抑え、最後の確定値で 1 回だけ走らせる。
 */
const FETCH_COALESCE_MS = 50;

export interface UseSalesDataOptions {
  /** 初期選択データ種類ID（マスター取得時に確定するため初期値として渡す） */
  initialDataTypeId?: string;
  /**
   * 初期パラメータ（period / dataTypeId 等）が出揃ったかどうか。
   * false の間は sales 系 fetch を起動しない。
   * 初期化中の連続した state 更新によるリクエスト連発・キャンセルを防ぐ。
   * 既定 true（呼び出し側が制御しない場合は従来どおり即時 fetch）。
   */
  ready?: boolean;
}

export function useSalesData(
  options: UseSalesDataOptions = {},
): UseSalesDataReturn {
  const { initialDataTypeId = '', ready = true } = options;
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
  const [period, setPeriodState] = useState<PeriodSelection | null>(null);
  const [dataTypeId, setDataTypeId] = useState(initialDataTypeId);
  const [dataTypeUnit, setDataTypeUnit] = useState<string>(DEFAULT_UNIT);
  const [dataTypeName, setDataTypeName] = useState<string>('');
  const [aggregateField, setAggregateFieldState] = useState<string>('value');
  const [currentView, setCurrentView] = useState<ViewType>('PERIOD_GRAPH');
  const [prevAvg, setPrevAvg] = useState<{
    prevMonthAvg: number;
    prevYearAvg: number;
  }>({ prevMonthAvg: 0, prevYearAvg: 0 });

  // period は usePeriodNavigation から「同じ値・別オブジェクト」で複数回渡されうる。
  // startDate/endDate が変わらない場合は state を更新せず、無駄な再 fetch を防ぐ。
  const setPeriod = useCallback((p: PeriodSelection | null) => {
    setPeriodState((prev) => {
      if (prev === p) return prev;
      if (prev && p && prev.startDate === p.startDate && prev.endDate === p.endDate)
        return prev;
      return p;
    });
  }, []);

  const setAggregateField = useCallback((field: string, unit?: string) => {
    setAggregateFieldState(field);
    if (unit) setDataTypeUnit(unit);
  }, []);

  const abortRef = useRef<AbortController | null>(null);
  // 同じ period/filter/dataType の間、previous-avg は 1 回だけ取得する。
  // period/filter/dataType が変わったら下の useEffect でリセットする。
  const prevAvgFetchedRef = useRef(false);

  // 初期 dataTypeId はマスター取得（useDashboardInit）完了後に確定するため、
  // 後から渡ってきた初期値を一度だけ state に反映する。
  // （ユーザーが手動で切り替えた後は上書きしない）
  const initialDataTypeApplied = useRef(false);
  useEffect(() => {
    if (initialDataTypeApplied.current) return;
    if (initialDataTypeId) {
      initialDataTypeApplied.current = true;
      setDataTypeId(initialDataTypeId);
    }
  }, [initialDataTypeId]);

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

  // 初期化が完了し最初の fetch を起動したか。
  // 初回起動までは初期パラメータが完全に出揃うまで待つ:
  //  - ready（マスター取得完了）
  //  - period 確定（usePeriodNavigation が dateRange から算出済み）
  //  - dataTypeId が初期値と一致（初期値ありの場合のみ。反映が 1 レンダー遅れる対策）
  // これらが別タイミングで確定することによる fetch 連発・abort を防ぐ。
  // 初回起動後は通常どおり変更に追従する。
  const initialFetchStarted = useRef(false);
  useEffect(() => {
    if (!initialFetchStarted.current) {
      if (!ready || period === null) return;
      if (initialDataTypeId && dataTypeId !== initialDataTypeId) return;
      initialFetchStarted.current = true;
    }
    // ビュー切替時、period は複数の連続したレンダーに跨って確定しうる
    //（例: 累計切替 → 前ビュー由来の月で一旦通知 → 直後のレンダーで累計用の初期月へ再設定）。
    // この連続更新は別マクロタスクに分かれるため setTimeout(0) では畳めない。
    // 短い遅延（FETCH_COALESCE_MS）でまとめ、値が落ち着いた「最後の 1 回」だけ fetch する。
    // 直前に立てたタイマーは下の cleanup で都度クリアされる（体感遅延はほぼ無し）。
    const timer = setTimeout(() => {
      fetchData();
    }, FETCH_COALESCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [ready, period, currentView, dataTypeId, initialDataTypeId, fetchData]);

  // アンマウント時に進行中のリクエストを中断する
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
