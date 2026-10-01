/* The support file starts the static server and browser once, then gives every test its own isolated page */
module.exports = {
  spec: 'tests/e2e/**/*.e2e.test.js',
  require: 'tests/e2e/support/hooks.js',
  timeout: 30000,
  slow: 3000,
  forbidOnly: Boolean(process.env.CI)
};