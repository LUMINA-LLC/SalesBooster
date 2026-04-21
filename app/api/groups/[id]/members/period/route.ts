import { NextRequest } from 'next/server';
import { groupController } from '@/server/controllers/groupController';

/** メンバーシップの期間（開始月・終了月）を更新 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return groupController.updateMembershipPeriod(request, Number(id));
}
