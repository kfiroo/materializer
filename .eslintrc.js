module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        node: true
    },
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier'
    ],
    plugins: ['@typescript-eslint'],
    parserOptions: {
        sourceType: 'module'
    },
    rules: {
        indent: ['error', 4],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'never']
    },
    settings: {
        'import/extensions': ['.js', '.ts'],
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts']
        },
        'import/resolver': {
            node: {
                extensions: ['.js', '.ts']
            }
        }
    }
}
