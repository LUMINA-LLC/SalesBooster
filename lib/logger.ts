/**
 * サーバ側用 logger。
 *
 * 動作概要:
 *   - Amplify (AWS Lambda) 環境では JSON 1 行で stdout/stderr に出力する。
 *     Lambda の stdout は CloudWatch Logs に流れ、Subscription Filter →
 *     Kinesis Firehose 経由で New Relic Logs に送る前提。
 *   - それ以外（ローカル開発など）は通常の console.* で人が読みやすい形式に出す。
 *
 * クライアント側（"use client"）からは使わないこと。サーバ側 (server/, lib/, instrumentation.ts,
 * API route handler) でのみ使用する。
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const SERVICE_NAME = process.env.NEW_RELIC_APP_NAME || 'sales-booster';

// Amplify SSR は AWS Lambda 上で動くため AWS_LAMBDA_FUNCTION_NAME が立つ。
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

function serializeError(err: unknown): LogContext {
  if (err instanceof Error) {
    return {
      'error.message': err.message,
      'error.name': err.name,
      'error.stack': err.stack,
    };
  }
  return { 'error.value': String(err) };
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (isLambda) {
    // CloudWatch Logs での検索性を意識した JSON 構造化ログ。
    // New Relic Logs の attribute としてそのまま使える命名にする。
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: SERVICE_NAME,
      ...(context ?? {}),
    };
    const line = JSON.stringify(payload);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
    return;
  }

  // ローカル開発: 読みやすい形式
  const prefix = `[${level.toUpperCase()}]`;
  if (level === 'error') {
    if (context) console.error(prefix, message, context);
    else console.error(prefix, message);
  } else if (level === 'warn') {
    if (context) console.warn(prefix, message, context);
    else console.warn(prefix, message);
  } else if (level === 'debug') {
    if (context) console.debug(prefix, message, context);
    else console.debug(prefix, message);
  } else {
    if (context) console.log(prefix, message, context);
    else console.log(prefix, message);
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    emit('debug', message, context);
  },
  info(message: string, context?: LogContext): void {
    emit('info', message, context);
  },
  warn(message: string, context?: LogContext): void {
    emit('warn', message, context);
  },
  /**
   * error ログ。第 2 引数に Error / unknown を渡すと自動的にスタック等を展開する。
   * 追加コンテキストは第 3 引数に渡す。
   *
   * @example
   *   logger.error('Failed to fetch sales data', err);
   *   logger.error('Audit log failed', err, { tenantId, action });
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const merged: LogContext = {
      ...(error !== undefined ? serializeError(error) : {}),
      ...(context ?? {}),
    };
    emit('error', message, Object.keys(merged).length > 0 ? merged : undefined);
  },
};
