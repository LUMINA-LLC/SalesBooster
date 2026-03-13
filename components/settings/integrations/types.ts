export interface Integration {
  id: number | null;
  serviceKey: string;
  status: string;
  config: Record<string, string> | null;
}

export interface ServiceDefinition {
  serviceKey: string;
  name: string;
  description: string;
  icon: string;
}

export interface CardProps {
  integration: Integration;
  service: ServiceDefinition;
  onRefresh: () => Promise<void>;
  showMsg: (type: 'success' | 'error', text: string) => void;
}

/** サービス定義（DBレコードがなくても表示する） */
export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    serviceKey: 'LINE',
    name: 'LINE Messaging API',
    description: 'グループトークへの売上通知',
    icon: 'LINE',
  },
  {
    serviceKey: 'GOOGLE_CHAT',
    name: 'Google Chat',
    description: 'Webhook による売上通知',
    icon: 'GOOGLE_CHAT',
  },
];
