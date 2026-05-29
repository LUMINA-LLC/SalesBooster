'use client';

import { useState, useEffect } from 'react';
import type { DataTypeInfo } from '@/types';
import type { DateRange } from '@/components/FilterBar';

export interface GroupOption {
  id: number;
  name: string;
  imageUrl?: string | null;
  memberList: { id: string; name: string }[];
}

export interface MemberOption {
  id: string;
  name: string;
}

export interface AggregatableFieldOption {
  id: number;
  name: string;
  unit: string;
}

export interface DashboardInitData {
  groups: GroupOption[];
  members: MemberOption[];
  dateRange: DateRange | null;
  dataTypes: DataTypeInfo[];
  aggregatableFields: AggregatableFieldOption[];
}

const EMPTY: DashboardInitData = {
  groups: [],
  members: [],
  dateRange: null,
  dataTypes: [],
  aggregatableFields: [],
};

/**
 * ダッシュボード初期表示用のマスターデータを 1 リクエストで取得する。
 * groups / members / date-range / data-types / 初期 data-type の custom-fields を
 * /api/dashboard/init から一括取得し、初期化中のリクエスト連発を防ぐ。
 */
export function useDashboardInit(): {
  data: DashboardInitData;
  loading: boolean;
} {
  const [data, setData] = useState<DashboardInitData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/dashboard/init')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: DashboardInitData | null) => {
        if (!active) return;
        if (json) setData({ ...EMPTY, ...json });
      })
      .catch(() => {
        if (active) setData(EMPTY);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { data, loading };
}
