// ========================================
// JEST CONFIGURATION
// jest.config.js
// ========================================

module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    'jest.config.js',
  ],
  testMatch: ['**/src/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
};
