module.exports = {
    // Ambiente de teste
    testEnvironment: 'node',

    // Padrões de arquivos de teste
    testMatch: [
        '**/src/tests/**/*.test.js',
        '**/__tests__/**/*.js'
    ],

    // Arquivos a ignorar
    testPathIgnorePatterns: [
        '/node_modules/',
        '/uploads/'
    ],

    // Timeout para testes (aumentado para testes de integração)
    testTimeout: 10000,

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

    // Cobertura de código
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/tests/**',
        '!src/swagger/**',
        '!src/config/**'
    ],

    // Formato de relatório de cobertura
    coverageReporters: ['text', 'lcov', 'html'],

    // Diretório de cobertura
    coverageDirectory: 'coverage',

    // Limites de cobertura
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 60,
            statements: 60
        }
    },

    // Verbose output
    verbose: true,

    // Forçar saída após testes
    forceExit: true,

    // Limpar mocks automaticamente
    clearMocks: true,

    // Restaurar mocks automaticamente
    restoreMocks: true
};
