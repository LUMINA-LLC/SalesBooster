import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      'no-var': 'off', // no-varルールをオフにする
      '@typescript-eslint/no-unused-vars': 'error', // 未使用変数を警告レベルに変更
      '@typescript-eslint/no-explicit-any': 'error', // any型の使用をエラーレベルに変更
      '@typescript-eslint/no-empty-object-type': 'off', // 空のオブジェクト型の使用を許可する
      'react-hooks/set-state-in-effect': 'off', // データフェッチ等の正当なパターンで多用するため無効化
    },
  },
  prettier,
]);

export default eslintConfig;
