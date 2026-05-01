import { getSupabaseAdmin } from '@/lib/supabase';
import { tenantEventChannel, TENANT_EVENTS } from '@/lib/realtimeEvents';

/**
 * テナント別の汎用チャネルへイベントをブロードキャストする。
 * service_role 鍵で送信するため RLS の影響を受けない。
 */
export const tenantEventsBroadcastService = {
  async notifyNewRecord(tenantId: number, recordId: number): Promise<void> {
    await sendEvent(tenantId, TENANT_EVENTS.NEW_RECORD, { id: recordId });
  },

  async notifyDataChanged(tenantId: number): Promise<void> {
    await sendEvent(tenantId, TENANT_EVENTS.DATA_CHANGED, {});
  },
};

async function sendEvent(
  tenantId: number,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const channel = supabase.channel(tenantEventChannel(tenantId));
  try {
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } finally {
    await supabase.removeChannel(channel);
  }
}
