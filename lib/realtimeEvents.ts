/**
 * Supabase Realtime のテナント別チャネル名・イベント名の定義。
 * サーバ側 (broadcast 送信) とクライアント側 (購読) の両方から参照する。
 */

export const tenantEventChannel = (tenantId: number) =>
  `tenant-events-${tenantId}`;

export const TENANT_EVENTS = {
  /** 速報通知: INSERT のうち notifyBreakingNews=true のもの */
  NEW_RECORD: 'new-record',
  /** 売上データ変更通知: INSERT / UPDATE / DELETE 全て */
  DATA_CHANGED: 'data-changed',
} as const;
