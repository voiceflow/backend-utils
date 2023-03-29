module.exports = {
  extends: ['@voiceflow/eslint-config', '@voiceflow/eslint-config/typescript'],
  overrides: [
    {
      files: ['config/**/*', 'test/**/*'],
      extends: ['@voiceflow/eslint-config/utility', '@voiceflow/eslint-config/mocha'],
      rules: {
        'max-len': [
          'error',
          {
            code: 120,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true,
          },
        ],
        // off
        'no-unused-expressions': 'off',
      },
    },
  ],
};
