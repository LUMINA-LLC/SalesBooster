import { NextResponse } from 'next/server';
import { tenantService } from '@/server/services/tenantService';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await tenantService.getPublicBySlug(slug);
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(result);
}
