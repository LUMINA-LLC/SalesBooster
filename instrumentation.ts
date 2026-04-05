export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[instrumentation] NEXT_RUNTIME=nodejs, loading newrelic...');
    console.log(
      '[instrumentation] NEW_RELIC_LICENSE_KEY set:',
      !!process.env.NEW_RELIC_LICENSE_KEY,
    );
    console.log(
      '[instrumentation] NEW_RELIC_APP_NAME:',
      process.env.NEW_RELIC_APP_NAME,
    );
    try {
      await import('newrelic');
      console.log('[instrumentation] newrelic loaded successfully');
    } catch (err) {
      console.error('[instrumentation] newrelic failed to load:', err);
    }
  } else {
    console.log(
      '[instrumentation] Skipping newrelic, NEXT_RUNTIME:',
      process.env.NEXT_RUNTIME,
    );
  }
}
