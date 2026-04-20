import {
  BarStyle,
  EffectIntensity,
  GraphConfig,
  DEFAULT_GRAPH_CONFIG,
} from '@/types/graph';

/** 16進カラーをRGBに変換 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  const num = parseInt(
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned,
    16,
  );
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/** カラーを明るくする/暗くする */
function shade(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const adjust = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * factor)));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** バー1本分のスタイル定義 */
export interface BarColorSet {
  main: string;
  gradient: string;
  topGradient: string;
  glow: string;
}

/**
 * メインカラー + GraphConfig からバーのスタイルを生成
 */
export function buildBarColorSet(
  mainColor: string,
  config: GraphConfig = DEFAULT_GRAPH_CONFIG,
): BarColorSet {
  const lighter1 = shade(mainColor, 40);
  const lighter2 = shade(mainColor, 20);
  const darker1 = shade(mainColor, -20);
  const darker2 = shade(mainColor, -40);
  const veryLight = shade(mainColor, 70);

  const gradient = buildGradient(
    config.gradientIntensity,
    mainColor,
    lighter1,
    lighter2,
    darker1,
    darker2,
  );
  const topGradient = `linear-gradient(180deg, ${veryLight} 0%, ${lighter1} 50%, ${lighter2} 100%)`;
  const glow = buildGlow(config.glowIntensity, mainColor);

  return { main: mainColor, gradient, topGradient, glow };
}

function buildGradient(
  intensity: EffectIntensity,
  main: string,
  lighter1: string,
  lighter2: string,
  darker1: string,
  darker2: string,
): string {
  if (intensity === 'NONE') {
    // フラット（メインカラー単色）
    return main;
  }
  if (intensity === 'LIGHT') {
    return `linear-gradient(180deg, ${lighter1} 0%, ${main} 100%)`;
  }
  if (intensity === 'STRONG') {
    return `linear-gradient(180deg, ${lighter1} 0%, ${lighter2} 20%, ${main} 50%, ${darker1} 80%, ${darker2} 100%)`;
  }
  // NORMAL
  return `linear-gradient(180deg, ${lighter1} 0%, ${lighter2} 30%, ${main} 70%, ${darker1} 100%)`;
}

function buildGlow(intensity: EffectIntensity, main: string): string {
  if (intensity === 'NONE') return 'none';
  if (intensity === 'LIGHT') return `0 0 8px ${rgba(main, 0.3)}`;
  if (intensity === 'STRONG') return `0 0 30px ${rgba(main, 0.7)}`;
  return `0 0 18px ${rgba(main, 0.5)}`;
}

/** ランキング順位に応じた色を取得 */
export function getRankColor(
  index: number,
  top20Index: number,
  low20Index: number,
  config: GraphConfig = DEFAULT_GRAPH_CONFIG,
): string {
  if (index < top20Index) return config.topColor;
  if (index < low20Index) return config.centerColor;
  return config.lowColor;
}

/** バースタイルから border-radius / 円柱の蓋表示判定 */
export interface BarStyleProps {
  borderRadius: string;
  showCylinderCap: boolean;
}

export function getBarStyleProps(barStyle: BarStyle): BarStyleProps {
  switch (barStyle) {
    case 'FLAT':
      return { borderRadius: '0', showCylinderCap: false };
    case 'ROUNDED':
      return { borderRadius: '12px 12px 0 0', showCylinderCap: false };
    case 'CYLINDER':
    default:
      return { borderRadius: '0', showCylinderCap: true };
  }
}
