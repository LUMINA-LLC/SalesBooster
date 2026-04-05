export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // newrelic.js より先に環境変数を確実にセット
    if (!process.env.NEW_RELIC_HOME) {
      process.env.NEW_RELIC_HOME = process.cwd();
    }
    try {
      await import('newrelic');
    } catch (err) {
      console.error('[instrumentation] newrelic failed to load:', err);
    }
  }
}
