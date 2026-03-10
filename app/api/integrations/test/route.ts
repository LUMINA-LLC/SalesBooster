import { NextRequest } from 'next/server';
import { settingsController } from '@/server/controllers/settingsController';

export async function POST(request: NextRequest) {
  const cloned = request.clone();
  const body = await cloned.json();

  if (body.type === 'google-chat') {
    return settingsController.testGoogleChatNotification(request);
  }

  return settingsController.testLineNotification(request);
}
