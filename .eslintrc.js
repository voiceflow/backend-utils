module.exports = {
  extends: '@voiceflow/eslint-config',
  rules: {
    'no-continue': 'off',
    'quotes': ['error', 'single', 'avoid-escape'],
    'sonarjs/cognitive-complexity': 'warn',
    'promise/always-return': 'off',
  }
};
