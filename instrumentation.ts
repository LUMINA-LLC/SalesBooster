/**
 * Next.js のサーバ起動フック。
 *
 * Node.js ランタイムでのみ instrumentation-node.ts を動的 import する。
 * Edge ランタイムでは何もしない。
 *
 * 詳細は docs/newrelic-cloudwatch.md を参照。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}
