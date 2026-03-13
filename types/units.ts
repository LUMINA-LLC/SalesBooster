/** Unit enum のキー（Prisma の Unit enum と一致） */
export const Unit = {
  MAN_YEN: 'MAN_YEN',
  SEN_YEN: 'SEN_YEN',
  YEN: 'YEN',
  KEN: 'KEN',
  HOUR: 'HOUR',
  MIN: 'MIN',
  PIECE: 'PIECE',
  TIME: 'TIME',
  PERSON: 'PERSON',
} as const;

export type UnitValue = (typeof Unit)[keyof typeof Unit];

/** enum キー → 表示ラベル */
export const UNIT_LABELS: Record<UnitValue, string> = {
  MAN_YEN: '万円',
  SEN_YEN: '千円',
  YEN: '円',
  KEN: '件',
  HOUR: '時間',
  MIN: '分',
  PIECE: '個',
  TIME: '回',
  PERSON: '人',
};

/** データ種類で選択可能な単位の一覧 */
export const UNIT_OPTIONS = Object.entries(UNIT_LABELS).map(
  ([value, label]) => ({
    value: value as UnitValue,
    label,
  }),
);

/** 単位ごとのDB保存時の乗数（入力値 × multiplier = DB保存値） */
export const UNIT_MULTIPLIERS: Record<UnitValue, number> = {
  MAN_YEN: 10_000,
  SEN_YEN: 1_000,
  YEN: 1,
  KEN: 1,
  HOUR: 1,
  MIN: 1,
  PIECE: 1,
  TIME: 1,
  PERSON: 1,
};

/** デフォルト単位 */
export const DEFAULT_UNIT: UnitValue = 'MAN_YEN';
