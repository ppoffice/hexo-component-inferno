const { deprecate } = require('../util/deprecate');

test('Warn once about each deprecated component', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    deprecate('share.example', 'Use another one instead.');
    deprecate('share.example', 'Use another one instead.');
    deprecate('comment.example', 'Use another one instead.');
    expect(warn.mock.calls).toEqual([
      ['hexo-component-inferno: share.example is deprecated. Use another one instead.'],
      ['hexo-component-inferno: comment.example is deprecated. Use another one instead.'],
    ]);
  } finally {
    warn.mockRestore();
  }
});
