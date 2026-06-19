/** グラフ設定の選択肢・初期値の定数 */

import type { BarStyle, EffectIntensity, GraphConfig } from '@/types/graph';

export const BAR_STYLE_OPTIONS: { value: BarStyle; label: string }[] = [
  { value: 'CYLINDER', label: '3D円柱' },
  { value: 'FLAT', label: 'フラット' },
  { value: 'ROUNDED', label: '角丸' },
];

export const EFFECT_INTENSITY_OPTIONS: {
  value: EffectIntensity;
  label: string;
}[] = [
  { value: 'NONE', label: 'なし' },
  { value: 'LIGHT', label: '弱' },
  { value: 'NORMAL', label: '標準' },
  { value: 'STRONG', label: '強' },
];

export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  topColor: '#F59E0B',
  centerColor: '#0EA5E9',
  lowColor: '#14B8A6',
  barStyle: 'CYLINDER',
  showNormaLine: true,
  darkMode: false,
  gradientIntensity: 'NORMAL',
  glowIntensity: 'NORMAL',
  rankingLimit: null,
  defaultViewSettings: {},
};
