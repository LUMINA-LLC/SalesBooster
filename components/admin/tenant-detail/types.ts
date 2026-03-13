export interface SubscriptionHistory {
  id: number;
  action: string;
  planType: string | null;
  maxMembers: number | null;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
  createdAt: string;
}

export interface TenantDetail {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  planType: string | null;
  maxMembers: number | null;
  licenseStartDate: string | null;
  licenseEndDate: string | null;
  isTrial: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    departments: number;
    groups: number;
    salesRecords: number;
    targets: number;
    integrations: number;
  };
  users: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  }[];
  subscriptionHistories: SubscriptionHistory[];
}

export const PLAN_TYPE_LABELS: Record<string, string> = {
  TRIAL: 'トライアル',
  STANDARD: 'スタンダード',
  ENTERPRISE: 'エンタープライズ',
};

export const ACTION_LABELS: Record<string, string> = {
  TRIAL_START: 'トライアル開始',
  CREATE: '契約作成',
  UPDATE: '契約更新',
  RENEW: '契約延長',
  EXPIRE: '契約終了',
};

export const ACTION_COLORS: Record<string, string> = {
  TRIAL_START: 'bg-blue-100 text-blue-800',
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  RENEW: 'bg-green-100 text-green-800',
  EXPIRE: 'bg-red-100 text-red-800',
};

export const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDateTime = (isoDate: string) => {
  const d = new Date(isoDate);
  return `${formatDate(isoDate)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
