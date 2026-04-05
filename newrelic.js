'use strict';

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'sales-booster'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',
  logging: {
    level: 'info',
    filepath: 'stdout',
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },
  distributed_tracing: {
    enabled: true,
  },
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
      max_samples_stored: 10000,
    },
    local_decorating: {
      enabled: false,
    },
    metrics: {
      enabled: true,
    },
  },
  browser_monitoring: {
    enable: false,
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [401, 403, 404],
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
    record_sql: 'obfuscated',
  },
  serverless_mode: {
    enabled: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
  },
};
