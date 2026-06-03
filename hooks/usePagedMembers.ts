'use client';

import { useState, useEffect, useMemo } from 'react';

/** 1ページあたりの最短表示時間（ms）。等分結果がこれ未満なら下限を適用する。 */
const MIN_PAGE_MS = 1500;

/**
 * メンバー配列を membersPerPage 人ずつのページに分け、
 * ビューの総表示時間（totalDurationSec）をページ数で等分して自動でページ送りする。
 *
 * - membersPerPage が null/0、または members がページ内に収まる場合はページングしない（全件返す）。
 * - 戻り値は「現在ページに表示するメンバー」と、ページ位置情報。
 */
export function usePagedMembers<T>(
  members: T[],
  membersPerPage: number | null | undefined,
  totalDurationSec: number,
): { pageMembers: T[]; pageIndex: number; pageCount: number } {
  const perPage = membersPerPage && membersPerPage > 0 ? membersPerPage : null;

  const pageCount = useMemo(() => {
    if (!perPage) return 1;
    return Math.max(1, Math.ceil(members.length / perPage));
  }, [members.length, perPage]);

  const [pageIndex, setPageIndex] = useState(0);

  // ページ構成（1ページ人数・総人数）が変わったら先頭ページに戻し、巡回タイマーを張り直す。
  useEffect(() => {
    setPageIndex(0);
    if (pageCount <= 1) return;
    // 総表示時間をページ数で等分（下限 MIN_PAGE_MS）
    const perPageMs = Math.max(
      MIN_PAGE_MS,
      (totalDurationSec * 1000) / pageCount,
    );
    const timer = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % pageCount);
    }, perPageMs);
    return () => clearInterval(timer);
  }, [pageCount, totalDurationSec]);

  const pageMembers = useMemo(() => {
    if (!perPage) return members;
    const start = pageIndex * perPage;
    return members.slice(start, start + perPage);
  }, [members, perPage, pageIndex]);

  return { pageMembers, pageIndex, pageCount };
}
