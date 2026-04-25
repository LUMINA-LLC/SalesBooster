/** メンバーシップ用の日付ヘルパー */

export function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export interface MemberOption {
  id: string;
  name: string;
  department: string | null;
}

export interface MembershipRecord {
  id: number;
  userId: string;
  startMonth: string;
  endMonth: string | null;
  user: { id: string; name: string };
}
