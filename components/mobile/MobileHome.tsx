'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import MobileFilterBar from './MobileFilterBar';
import MobileSalesChart from './MobileSalesChart';
import MobileRankingList from './MobileRankingList';
import type { UseSalesDataReturn } from '@/hooks/useSalesData';

interface MobileHomeProps {
  data: UseSalesDataReturn;
  onAddSalesClick: () => void;
}

export default function MobileHome({ data, onAddSalesClick }: MobileHomeProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URLパラメータから読み取り
  const now = new Date();
  const monthParam = searchParams.get('m');
  const year = monthParam
    ? parseInt(monthParam.split('-')[0])
    : now.getFullYear();
  const month = monthParam
    ? parseInt(monthParam.split('-')[1])
    : now.getMonth() + 1;
  const groupId = searchParams.get('g') ?? '';
  const dataTypeId = searchParams.get('dt') ?? '';

  // URLパラメータ更新
  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value) newParams.set(key, value);
        else newParams.delete(key);
      }
      const qs = newParams.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const handleMonthChange = useCallback(
    (y: number, m: number) => {
      updateUrl({ m: `${y}-${String(m).padStart(2, '0')}` });
    },
    [updateUrl],
  );

  const handleGroupChange = useCallback(
    (gId: string) => {
      updateUrl({ g: gId });
    },
    [updateUrl],
  );

  const handleDataTypeChange = useCallback(
    (dtId: string, unit: string) => {
      data.setDataTypeUnit(unit);
      updateUrl({ dt: dtId });
    },
    [updateUrl, data],
  );

  // URLパラメータ → データフェッチ用stateに同期
  const period = useMemo(() => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [year, month]);

  useEffect(() => {
    data.setFilter({ groupId, memberId: '' });
    data.setPeriod(period);
    if (dataTypeId) data.setDataTypeId(dataTypeId);
  }, [groupId, period, dataTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { salesData, loading, fetchError, dataTypeUnit, fetchData } = data;

  return (
    <>
      <MobileFilterBar
        onMonthChange={handleMonthChange}
        onGroupChange={handleGroupChange}
        onDataTypeChange={handleDataTypeChange}
        initialYear={year}
        initialMonth={month}
        initialGroupId={groupId}
        initialDataTypeId={dataTypeId}
      />

      <main className="w-full flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="p-8 text-center">
            <div className="text-red-500 text-sm mb-2">{fetchError}</div>
            <button
              onClick={fetchData}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : salesData.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-sm">
              該当するデータがありません
            </div>
          </div>
        ) : (
          <>
            <MobileSalesChart salesData={salesData} unit={dataTypeUnit} />
            <MobileRankingList
              salesData={salesData}
              loading={false}
              onAddSalesClick={onAddSalesClick}
              unit={dataTypeUnit}
            />
          </>
        )}
      </main>
    </>
  );
}
