/** データ管理画面で使う型 */

export interface SalesRecord {
  id: number;
  userId: string;
  memberName: string;
  department: string | null;
  value: number;
  dataTypeId: number | null;
  dataType: { id: number; name: string; unit: string } | null;
  description: string | null;
  customFields: Record<string, string> | null;
  recordDate: string;
  createdAt: string;
}

export interface RecordsResponse {
  records: SalesRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GroupOption {
  id: number;
  name: string;
}

export interface MemberOption {
  id: string;
  name: string;
}

export interface DataTypeOption {
  id: number;
  name: string;
}
