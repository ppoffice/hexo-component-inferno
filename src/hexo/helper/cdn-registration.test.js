const register = require('./cdn');

function helpers() {
  const result = {};
  register({
    get config() {
      throw new Error('registration config must not be used');
    },
    extend: {
      helper: {
        register: (name, fn) => {
          result[name] = fn;
        },
      },
    },
  });
  return result;
}

test('Registration keeps helper names, signatures and per-call page configuration', () => {
  const registered = helpers();
  expect(Object.keys(registered)).toEqual(['cdn', 'fontcdn', 'iconcdn']);
  expect([registered.cdn.length, registered.fontcdn.length, registered.iconcdn.length]).toEqual([
    3, 1, 0,
  ]);
  const first = { config: { providers: { cdn: 'unpkg', fontcdn: 'loli', iconcdn: 'loli' } } };
  const second = { config: { providers: {} } };
  expect(registered.cdn.call(first, 'jquery', '1', 'dist/a.js')).toBe(
    'https://unpkg.com/jquery@1/dist/a.js',
  );
  expect(registered.cdn.call(second, 'jquery', '1', 'dist/a.js')).toBe(
    'https://cdn.jsdelivr.net/npm/jquery@1/dist/a.js',
  );
  first.config.providers.cdn = 'cdnjs';
  expect(registered.cdn.call(first, 'jquery', '1', 'dist/a.js')).toBe(
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/1/a.js',
  );
  expect(registered.fontcdn.call(first, 'A')).toBe('https://fonts.loli.net/css?family=A');
  expect(registered.fontcdn.call(second, 'A')).toBe('https://fonts.googleapis.com/css?family=A');
  expect(registered.iconcdn.call(first)).toBe(
    'https://cdnjs.loli.net/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  );
  expect(registered.iconcdn.call(second)).toBe(
    'https://use.fontawesome.com/releases/v6.0.0/css/all.css',
  );
});

test.each([undefined, false, 0, '', 'unpkg', () => {}])(
  'Non-object config.providers %p uses defaults',
  (providers) => {
    const api = helpers();
    const context = { config: { providers } };
    expect(api.cdn.call(context, 'pkg', '1', 'file')).toBe(
      'https://cdn.jsdelivr.net/npm/pkg@1/file',
    );
    expect(api.fontcdn.call(context, 'A')).toBe('https://fonts.googleapis.com/css?family=A');
    expect(api.iconcdn.call(context)).toBe(
      'https://use.fontawesome.com/releases/v6.0.0/css/all.css',
    );
  },
);

test('Arrays are provider bags, null remains an error, and absent config is not normalized', () => {
  const api = helpers();
  const providers = [];
  providers.cdn = 'unpkg';
  providers.fontcdn = 'https://fonts/${fontname}/${type}';
  providers.iconcdn = 'icons-as-is';
  expect(api.cdn.call({ config: { providers } }, 'pkg', '1', 'file')).toBe(
    'https://unpkg.com/pkg@1/file',
  );
  expect(api.fontcdn.call({ config: { providers } }, 'A')).toBe('https://fonts/A/css');
  expect(api.iconcdn.call({ config: { providers } })).toBe('icons-as-is');
  for (const fn of Object.values(api)) {
    expect(() => fn.call({ config: { providers: null } })).toThrow(TypeError);
    expect(() => fn.call({ config: null })).toThrow(TypeError);
    expect(() => fn.call({})).toThrow(TypeError);
  }
});

test('The original typeof probe and second context read are preserved', () => {
  const api = helpers();
  let reads = 0;
  const context = {
    get config() {
      reads++;
      return { providers: reads === 1 ? {} : { cdn: 'unpkg' } };
    },
  };
  expect(api.cdn.call(context, 'pkg', '1', 'file')).toBe('https://unpkg.com/pkg@1/file');
  expect(reads).toBe(2);
});

test('Fallback retains whether a fixture already replaced package arguments', () => {
  const api = helpers();
  const context = { config: { providers: { cdn: 'cdnjs' } } };
  expect(api.cdn.call(context, 'moment', '1', 42)).toBe('https://cdn.jsdelivr.net/npm/moment@1/42');
  expect(api.cdn.call(context, 'pace-js', '1', 42)).toBe('https://cdn.jsdelivr.net/npm/pace@1/42');
  expect(api.cdn.call(context, 'katex', '1', null)).toBe(
    'https://cdn.jsdelivr.net/npm/KaTeX@1/null',
  );
});

test('Font type omission/undefined use css while null/false/empty values are substituted', () => {
  const api = helpers();
  const context = { config: {} };
  expect(api.fontcdn.call(context, 'A')).toBe('https://fonts.googleapis.com/css?family=A');
  expect(api.fontcdn.call(context, 'A', undefined)).toBe(
    'https://fonts.googleapis.com/css?family=A',
  );
  expect(api.fontcdn.call(context, 'A', null)).toBe('https://fonts.googleapis.com/null?family=A');
  expect(api.fontcdn.call(context, 'A', false)).toBe('https://fonts.googleapis.com/false?family=A');
  expect(api.fontcdn.call(context, 'A', '')).toBe('https://fonts.googleapis.com/?family=A');
});

test('Template replacements retain dollar-string semantics and chained placeholder order', () => {
  const api = helpers();
  const context = { config: { providers: { cdn: 'x/${ package }/${version}/${ filename }' } } };
  expect(api.cdn.call(context, '$&', 'v$&', '$&')).toBe('x/${ package }/v${version}/${ filename }');
  context.config.providers.cdn = 'x/${PACKAGE}/${ version }/${filename}/${unknown}/${ package x }';
  expect(api.cdn.call(context, '${version}', '${filename}', 'asset')).toBe(
    'x/asset/asset/asset/${unknown}/${ package x }',
  );
});
