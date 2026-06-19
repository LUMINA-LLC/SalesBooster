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
  DAI: 'DAI',
} as const;

export type UnitValue = (typeof Unit)[keyof typeof Unit];

// ラベル・選択肢・乗数・デフォルト単位の定数は const/units.ts に定義する。
