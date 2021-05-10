module.exports = {
    'projects': [
        {
            'displayName': 'test',
            'transform': {
                '^.+\\.js$': 'babel-jest'
            },
            'collectCoverageFrom': [
                'src/**/*.js'
            ],
            'testPathIgnorePatterns': [
                '<rootDir>/node_modules/',
                '<rootDir>/__tests__/helpers.js',
                '<rootDir>/__tests__/setup-jest.js'
            ],
            'setupFilesAfterEnv': [
                '<rootDir>/__tests__/setup-jest.js'
            ],
            'testURL': 'http://sham-ui.example.com'
        },
        {
            'runner': 'jest-runner-eslint',
            'displayName': 'lint',
            'testMatch': [
                '<rootDir>/src/**/*.js',
                '<rootDir>/__tests__/**/*.js',
                '<rootDir>/bin/**/*.js'
            ],
            'testPathIgnorePatterns': [
                '<rootDir>/src/parser/index.js'
            ]
        }
    ]
};
