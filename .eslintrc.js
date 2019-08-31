module.exports = {
    extends: [
        'prettier',
        'plugin:prettier/recommended'
    ],
    plugins: ['prettier'],
    env: {
        node: true,
        es6: true,
        mocha: true
    },
    rules: {
        'prettier/prettier': 1,
        'no-console': ['warn', {
            allow: ['warn', 'error']
        }],
        'eqeqeq': ['warn', 'always']
    }
};
