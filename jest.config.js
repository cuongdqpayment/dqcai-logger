module.exports = {
  preset: 'react-native',
  moduleNameMapping: {
    '^@dqcai/logger$': '<rootDir>/src/index.ts',
    '^@dqcai/logger/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@dqcai/logger)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
};