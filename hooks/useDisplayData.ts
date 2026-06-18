'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { DisplayConfig } from '@/types/display';
import {
  SalesPerson,
  ReportSummary,
  RankingBoardData,
  TrendData,
  DataTypeInfo,
} from '@/types';
import { supabase } from '@/lib/supabase';
import { tenantEventChannel, TENANT_EVENTS } from '@/lib/realtimeEvents';
import { DEFAULT_UNIT } from '@/types/units';
import { resolveViewPeriod } from '@/lib/displayPeriod';

/** 連続したデータ変更通知をまとめるための debounce 間隔 */
const DATA_CHANGED_DEBOUNCE_MS = 500;

/**
 * 1ビュー（config.views の 1 要素）分の取得済みデータ。
 * viewType に応じて必要な 1 種だけ持つ判別共用体。
 * 同種ビューを複数追加してもビューごとに独立したデータを持てる。
 */
export type ViewData =
  | { kind: 'PERIOD'; salesData: SalesPerson[]; recordCount: number }
  | { kind: 'CUMULATIVE'; cumulativeSalesData: SalesPerson[] }
  | { kind: 'TREND'; trendData: TrendData[] }
  | { kind: 'REPORT'; reportSummary: ReportSummary | null }
  | { kind: 'RECORD'; rankingData: RankingBoardData | null }
  // 集計値: dataTypeId 未指定メトリクス用に salesData/recordCount を持つ
  | { kind: 'NUMBER'; salesData: SalesPerson[]; recordCount: number }
  | { kind: 'NONE' };

interface UseDisplayDataReturn {
  /** config.views の index → そのビューのデータ */
  viewDataMap: Record<number, ViewData>;
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
  dataTypeId: number | null | undefined,
  dataTypes: DataTypeInfo[],
): string {
  if (dataTypeId != null) {
    const dt = dataTypes.find((d) => d.id === dataTypeId);
    if (dt?.unit) return dt.unit;
  }
  const defaultDt = dataTypes.find((d) => d.isDefault);
  if (defaultDt?.unit) return defaultDt.unit;
  if (dataTypes[0]?.unit) return dataTypes[0].unit;
  return DEFAULT_UNIT;
}

export function useDisplayData(config: DisplayConfig): UseDisplayDataReturn {
  const [viewDataMap, setViewDataMap] = useState<Record<number, ViewData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataTypes, setDataTypes] = useState<DataTypeInfo[]>([]);
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

      // 表示順（有効なビューを order でソート）。useDisplayMode の enabledViews と
      // 同じ並びにし、currentViewIndex（enabledViews 基準）で引けるようにする。
      const enabledViews = config.views
        .filter((v) => v.enabled)
        .sort((a, b) => a.order - b.order);

      // ビューごとに、その index・dataTypeId・期間で個別にデータ取得する。
      // 同種ビューを複数追加しても結果が混ざらないよう index で分離する。
      const entries = await Promise.all(
        enabledViews.map(async (view, index): Promise<[number, ViewData]> => {
          const params = new URLSearchParams();
          addBaseFilters(params);
          // REPORT は画面内で全データ種類を表示するため dataTypeId で絞り込まない。
          if (view.dataTypeId != null && view.viewType !== 'REPORT')
            params.set('dataTypeId', String(view.dataTypeId));
          // 集計値（メイン値 / 集計対象カスタムフィールド）。
          // "value"/"" はメイン値なので送らず、"cf_<id>" のみ送信する。
          if (
            view.aggregateField &&
            view.aggregateField !== 'value' &&
            view.viewType !== 'REPORT'
          )
            params.set('aggregateField', view.aggregateField);

          const period = resolveViewPeriod(view);
          const setPeriod = () => {
            params.set('startDate', period.startDate);
            params.set('endDate', period.endDate);
          };

          try {
            switch (view.viewType) {
              case 'PERIOD_GRAPH': {
                setPeriod();
                const res = await fetch(`/api/sales?${params}`, { signal });
                if (!res.ok) return [index, { kind: 'NONE' }];
                const json = await res.json();
                return [
                  index,
                  {
                    kind: 'PERIOD',
                    salesData: json.data,
                    recordCount: json.recordCount,
                  },
                ];
              }
              case 'CUMULATIVE_GRAPH': {
                setPeriod();
                const res = await fetch(`/api/sales/cumulative?${params}`, {
                  signal,
                });
                if (!res.ok) return [index, { kind: 'NONE' }];
                return [
                  index,
                  { kind: 'CUMULATIVE', cumulativeSalesData: await res.json() },
                ];
              }
              case 'TREND_GRAPH': {
                setPeriod();
                const res = await fetch(`/api/sales/trend?${params}`, {
                  signal,
                });
                if (!res.ok) return [index, { kind: 'NONE' }];
                return [index, { kind: 'TREND', trendData: await res.json() }];
              }
              case 'REPORT': {
                setPeriod();
                const res = await fetch(`/api/sales/report-summary?${params}`, {
                  signal,
                });
                if (!res.ok) return [index, { kind: 'NONE' }];
                return [
                  index,
                  { kind: 'REPORT', reportSummary: await res.json() },
                ];
              }
              case 'RECORD': {
                const res = await fetch(`/api/sales/ranking?${params}`, {
                  signal,
                });
                if (!res.ok) return [index, { kind: 'NONE' }];
                return [
                  index,
                  { kind: 'RECORD', rankingData: await res.json() },
                ];
              }
              case 'NUMBER_BOARD': {
                // dataTypeId 未指定メトリクス用の salesData/recordCount。
                // metricConfigs で個別 dataTypeId 指定のメトリクスは NumberBoard が自前取得する。
                setPeriod();
                const res = await fetch(`/api/sales?${params}`, { signal });
                if (!res.ok) return [index, { kind: 'NONE' }];
                const json = await res.json();
                return [
                  index,
                  {
                    kind: 'NUMBER',
                    salesData: json.data,
                    recordCount: json.recordCount,
                  },
                ];
              }
              default:
                // CUSTOM_SLIDE はデータ取得不要
                return [index, { kind: 'NONE' }];
            }
          } catch {
            return [index, { kind: 'NONE' }];
          }
        }),
      );

      if (signal.aborted) return;
      // viewType ごとに対応する ViewData の kind（前回データ流用の妥当性チェック用）
      const expectedKind: Record<string, ViewData['kind']> = {
        PERIOD_GRAPH: 'PERIOD',
        CUMULATIVE_GRAPH: 'CUMULATIVE',
        TREND_GRAPH: 'TREND',
        REPORT: 'REPORT',
        RECORD: 'RECORD',
        NUMBER_BOARD: 'NUMBER',
      };
      // 今回取得対象だった index のみで再構築する（削除されたビューのデータは破棄）。
      // 取得失敗(NONE)のビューは、一時的な通信エラーで画面が空になるのを防ぐため
      // 前回データを保持する。ただしビュー構成変更で index の指すビューが変わると
      // 別ビューの古いデータが残るため、前回データの kind が今回ビューの種類と
      // 一致するときに限り流用する（サイネージの常時表示向け）。
      setViewDataMap((prev) => {
        const next: Record<number, ViewData> = {};
        for (const [index, vd] of entries) {
          const prevVd = prev[index];
          const reusable =
            vd.kind === 'NONE' &&
            prevVd &&
            prevVd.kind === expectedKind[enabledViews[index].viewType];
          next[index] = reusable ? prevVd : vd;
        }
        return next;
      });
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

  // Supabase Realtime: data-changed イベントを debounce 付きで購読し、
  // 売上データの変更を検知したら全データを再取得する。
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId ?? null;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tenantId === null) return;

    const channel = supabase
      .channel(tenantEventChannel(tenantId))
      .on('broadcast', { event: TENANT_EVENTS.DATA_CHANGED }, () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          fetchAllData();
        }, DATA_CHANGED_DEBOUNCE_MS);
      })
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchAllData]);

  return {
    viewDataMap,
    loading,
    error,
    dataTypes,
  };
}
