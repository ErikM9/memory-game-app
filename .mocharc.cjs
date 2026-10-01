/* forbidOnly fails CI runs where a stray .only would silently skip the rest of the suite */
module.exports = {
  spec: 'tests/unit/**/*.test.js',
  forbidOnly: Boolean(process.env.CI)
};