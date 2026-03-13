import { NextRequest } from 'next/server';
import { groupController } from '@/server/controllers/groupController';

/** メンバー履歴取得 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return groupController.getMemberHistory(request, Number(id));
}

/** メンバー同期（一括設定） */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return groupController.syncMembers(request, Number(id));
}

/** メンバー追加（開始月指定） */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return groupController.addMember(request, Number(id));
}

/** メンバー所属終了（異動） */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return groupController.endMembership(request, Number(id));
}

/** メンバー所属レコード削除 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return groupController.removeMembership(request, Number(id));
}
