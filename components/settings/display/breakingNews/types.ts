export interface DataTypeOption {
  id: number;
  name: string;
  isDefault?: boolean;
}

export const VIDEO_OPTIONS = [
  { id: '1', label: 'ノーマル', src: '/movies/1.mp4' },
  { id: '2', label: '表彰式', src: '/movies/2.mp4' },
  { id: '3', label: 'ファンタジスタ', src: '/movies/3.mp4' },
] as const;

export const DEFAULT_TAB_ID = '__default__';
