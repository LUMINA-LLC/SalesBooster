export interface Integration {
  id: number;
  name: string;
  description: string;
  status: string;
  icon: string;
  config: Record<string, string> | null;
}

export interface CardProps {
  integration: Integration;
  onRefresh: () => Promise<void>;
  showMsg: (type: 'success' | 'error', text: string) => void;
}
