/** Jest для backend: ts-jest, тесты рядом с кодом (*.spec.ts / *.int-spec.ts). */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'src',
    testRegex: '.*\\.(spec|int-spec)\\.ts$',
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.int-spec.ts', '!main.ts'],
    coverageDirectory: '../coverage',
};
