/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100,
    },
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
