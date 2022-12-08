/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 60,
      functions: 60,
      statements: 60,
    },
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
}
