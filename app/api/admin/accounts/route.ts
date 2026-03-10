import { NextRequest } from 'next/server';
import { superAdminController } from '@/server/controllers/superAdminController';

export async function GET(request: NextRequest) {
  return superAdminController.getAllAccounts(request);
}

export async function POST(request: NextRequest) {
  return superAdminController.createAccount(request);
}
