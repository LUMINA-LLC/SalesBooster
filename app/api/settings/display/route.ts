import { NextRequest } from 'next/server';
import { displayController } from '@/server/controllers/displayController';

export async function GET(request: NextRequest) {
  return displayController.getConfig(request);
}

export async function PUT(request: NextRequest) {
  return displayController.updateConfig(request);
}

export async function POST(request: NextRequest) {
  return displayController.createConfig(request);
}
