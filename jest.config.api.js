// Config separada de react-scripts test — solo corre los tests de backend en tests/.
module.exports = {
  testEnvironment: 'node',
  testRegex: 'tests/.*\\.test\\.js$',
  testPathIgnorePatterns: ['/node_modules/', '/\\._'],
  setupFiles: ['dotenv/config'],
  testTimeout: 20000,
};
