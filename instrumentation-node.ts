/**
 * Node.js ランタイム専用の instrumentation。
 *
 * instrumentation.ts から動的 import される。Edge ランタイムでは読み込まれないため、
 * process.cwd() などの Node API を安全に使える。
 *
 * - AWS Lambda (Amplify SSR 含む) では agent を使わず、stdout のログを
 *   CloudWatch → newrelic-log-ingestion Lambda 経由で New Relic に届ける。
 * - ローカル / 非 Amplify 環境では従来どおり New Relic Node Agent をロードする。
 *
 * 詳細は docs/newrelic-cloudwatch.md を参照。
 */
import { logger } from '@/lib/logger';

// AWS Lambda (Amplify SSR 含む) では agent を使わない。
// 非 Lambda 環境で License Key が無ければ agent は起動できない。
if (
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  process.env.NEW_RELIC_LICENSE_KEY
) {
  if (!process.env.NEW_RELIC_HOME) {
    process.env.NEW_RELIC_HOME = process.cwd();
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('newrelic');
  } catch (err) {
    logger.error('New Relic agent failed to load', err);
  }
}
