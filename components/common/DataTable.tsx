'use client';

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

const DEFAULT_PAGE_SIZE = 10;

export interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render: (item: T) => ReactNode;
}

interface BaseProps<T> {
  columns: Column<T>[];
  keyField: keyof T;
  emptyMessage?: string;
  mobileRender?: (item: T) => ReactNode;
}

interface ClientPaginationProps<T> extends BaseProps<T> {
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  pageSize?: number;
  serverPagination?: never;
}

interface ServerPaginationProps<T> extends BaseProps<T> {
  data: T[];
  serverPagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  searchPlaceholder?: never;
  searchFilter?: never;
  pageSize?: never;
}

type DataTableProps<T> = ClientPaginationProps<T> | ServerPaginationProps<T>;

function isServerPagination<T>(
  props: DataTableProps<T>,
): props is ServerPaginationProps<T> {
  return 'serverPagination' in props && props.serverPagination != null;
}

export default function DataTable<T>(props: DataTableProps<T>) {
  if (isServerPagination(props)) {
    return <ServerPaginatedTable {...props} />;
  }

  return <ClientPaginatedTable {...props} />;
}

function ClientPaginatedTable<T>({
  data,
  columns,
  keyField,
  searchPlaceholder = '検索...',
  searchFilter,
  emptyMessage = '該当するデータがありません',
  pageSize = DEFAULT_PAGE_SIZE,
  mobileRender,
}: ClientPaginationProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) => searchFilter(item, q));
  }, [data, searchQuery, searchFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pagedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, data]);

  return (
    <>
      {searchFilter && (
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {isMobile && mobileRender ? (
        <MobileCardList
          data={pagedData}
          keyField={keyField}
          emptyMessage={emptyMessage}
          mobileRender={mobileRender}
        />
      ) : (
        <TableBody
          columns={columns}
          data={pagedData}
          keyField={keyField}
          emptyMessage={emptyMessage}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={filteredData.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </>
  );
}

function ServerPaginatedTable<T>({
  data,
  columns,
  keyField,
  emptyMessage = '該当するデータがありません',
  serverPagination,
  mobileRender,
}: ServerPaginationProps<T>) {
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile && mobileRender ? (
        <MobileCardList
          data={data}
          keyField={keyField}
          emptyMessage={emptyMessage}
          mobileRender={mobileRender}
        />
      ) : (
        <TableBody
          columns={columns}
          data={data}
          keyField={keyField}
          emptyMessage={emptyMessage}
        />
      )}

      <Pagination
        currentPage={serverPagination.currentPage}
        totalPages={serverPagination.totalPages}
        total={serverPagination.total}
        pageSize={serverPagination.pageSize}
        onPageChange={serverPagination.onPageChange}
      />
    </>
  );
}

function MobileCardList<T>({
  data,
  keyField,
  emptyMessage,
  mobileRender,
}: {
  data: T[];
  keyField: keyof T;
  emptyMessage: string;
  mobileRender: (item: T) => ReactNode;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div
          key={String(item[keyField])}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          {mobileRender(item)}
        </div>
      ))}
    </div>
  );
}

function TableBody<T>({
  columns,
  data,
  keyField,
  emptyMessage,
}: {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${col.align === 'right' ? 'text-right' : 'text-left'} px-6 py-3 text-xs font-semibold text-gray-500 uppercase`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-sm text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={String(item[keyField])}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  // 表示するページ番号を計算（最大5つ）
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i,
  );

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-500">
        {total}件中 {startItem}-{endItem}件を表示
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          前へ
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
