/**
 * @jest-environment jsdom
 */
/* eslint-env browser */
const { isDark, getAppearance } = require('../util/appearance');

function evaluate(expression) {
  // eslint-disable-next-line no-new-func
  return new Function(`return ${expression};`)();
}

function setAppearance(appearance, prefersDark = false) {
  if (appearance) {
    document.documentElement.setAttribute('data-appearance', appearance);
  } else {
    document.documentElement.removeAttribute('data-appearance');
  }
  window.matchMedia = (query) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefersDark,
  });
}

afterEach(() => {
  delete window.matchMedia;
});

test('Light without the data-appearance attribute', () => {
  setAppearance(null, true);
  expect(evaluate(getAppearance())).toBe('light');
  expect(evaluate(isDark())).toBe(false);
});

test('Dark with data-appearance="dark"', () => {
  setAppearance('dark');
  expect(evaluate(getAppearance())).toBe('dark');
  expect(evaluate(isDark())).toBe(true);
});

test('Follow the system color scheme with data-appearance="auto"', () => {
  setAppearance('auto', false);
  expect(evaluate(getAppearance())).toBe('auto');
  expect(evaluate(isDark())).toBe(false);
  setAppearance('auto', true);
  expect(evaluate(isDark())).toBe(true);
});

test('Light with an unknown appearance', () => {
  setAppearance('sepia', true);
  expect(evaluate(getAppearance())).toBe('light');
  expect(evaluate(isDark())).toBe(false);
});
