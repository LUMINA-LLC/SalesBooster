import { NextRequest } from 'next/server';
import { memberController } from '@/server/controllers/memberController';

export async function POST(request: NextRequest) {
  return memberController.acceptTerms(request);
}
