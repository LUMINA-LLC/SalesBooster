import { getSupabaseAdmin } from '@/lib/supabase';

const BREAKING_NEWS_EVENT = 'new-record';

const channelName = (tenantId: number) => `breaking-news-${tenantId}`;

/**
 * テナント別の速報チャネルへ「新規レコード作成」イベントをブロードキャストする。
 */
export const breakingNewsBroadcastService = {
  async notifyNewRecord(tenantId: number, recordId: number): Promise<void> {
    const supabase = getSupabaseAdmin();
    const channel = supabase.channel(channelName(tenantId));
    try {
      await channel.send({
        type: 'broadcast',
        event: BREAKING_NEWS_EVENT,
        payload: { id: recordId },
      });
    } finally {
      await supabase.removeChannel(channel);
    }
  },

  channelName,
  event: BREAKING_NEWS_EVENT,
};
