/**
 * Next.js のサーバ起動時フック。
 *
 * Amplify (AWS Lambda) では New Relic Node Agent は使わず、
 * stdout の構造化ログを CloudWatch Logs → Kinesis Firehose 経由で
 * New Relic Logs に転送する運用にしている (docs/newrelic-cloudwatch.md 参照)。
 *
 * Amplify 以外（ローカル / 自前サーバ）では従来どおり Node Agent をロードして
 * APM・Logs を直送する。
 */
import { logger } from '@/lib/logger';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // AWS Lambda（Amplify SSR 含む）では agent を使わない。
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    logger.info('New Relic agent skipped (running on AWS Lambda)', {
      lambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    });
    return;
  }

  if (!process.env.NEW_RELIC_LICENSE_KEY) {
    logger.info('New Relic agent skipped (NEW_RELIC_LICENSE_KEY not set)');
    return;
  }

  if (!process.env.NEW_RELIC_HOME) {
    process.env.NEW_RELIC_HOME = process.cwd();
  }
  try {
    await import('newrelic');
    logger.info('New Relic agent loaded');
  } catch (err) {
    logger.error('New Relic agent failed to load', err);
  }
}
