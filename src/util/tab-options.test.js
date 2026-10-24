const { splitOption, splitTabOptions } = require('./tab-options');

test.each([
  ['', ['']],
  ['active', ['active']],
  [':', ['', '']],
  ['title:', ['title', '']],
  [':value', ['', 'value']],
  ['title:Step 1: Install', ['title', 'Step 1: Install']],
  [' title : x ', [' title ', ' x ']],
  ['a\\:b:c', ['a\\', 'b:c']],
  ["'title:quoted'", ["'title", "quoted'"]],
  ['title:\t中文:😀', ['title', '\t中文:😀']],
])('Split %p at only the first colon, without trimming or unquoting', (input, expected) => {
  expect(splitOption(input)).toEqual(expected);
});

test.each([
  ['', []],
  ['   ', []],
  ['active id:tab title:One', ['active', 'id:tab', 'title:One']],
  ['  active   id:tab  ', ['active', 'id:tab']],
  ['\t', ['\t']],
  ['a\tb\nc', ['a\tb\nc']],
  ['\r\n\u00a0', ['\r\n\u00a0']],
  ['"title:Step 1: Install" active', ['title:Step 1: Install', 'active']],
  ["'title:Tim\\'s Tab'", ["title:Tim\\'s Tab"]],
  ['"icon:fas\\ fa-file"', ['icon:fas\\ fa-file']],
  ['"a\\"b"', ['a\\"b']],
  ["'a\"b'", ['a"b']],
  ['"a\'b"', ["a'b"]],
  ['"" \'\'', ['', '']],
  ['a\\ b', ['a\\', 'b']],
  ["title:'two words'", ["title:'two", "words'"]],
  ['bare"quote', ['bare"quote']],
  ["bare'quote", ["bare'quote"]],
  ['"a\\\\"', ['a\\\\']],
  ["'a\\\\'", ['a\\\\']],
  ['"a\tb\nc"', ['a\tb\nc']],
  ['" a  b "', [' a  b ']],
  ['中文:标题 😀', ['中文:标题', '😀']],
  ['a\0b', ['a\0b']],
  ['active active title:first title:second', ['active', 'active', 'title:first', 'title:second']],
])('Tokenize %p with the existing tabs quote and escape rules', (input, expected) => {
  expect(splitTabOptions(input)).toEqual(expected);
});

test.each([
  '"',
  "'",
  '"unterminated',
  "'unterminated",
  '"a"b',
  "'a'b",
  '"a""b"',
  '""\'\'',
  '"a"\tb',
  "'a'\nb",
  '"a"\r',
  '"a"\u00a0',
  '"a\\"',
  "'a\\'",
  '"a\\',
  "'a\\",
])('Reject %p with the exact existing error message', (input) => {
  let error;
  try {
    splitTabOptions(input);
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe(`malformatted tab options: ${input}`);
});

test('Tokenization and first-colon splitting preserve flags, duplicates and literal values', () => {
  const input = 'active "title:Step 1: Install" title:second unknown:value ""';
  expect(splitTabOptions(input).map(splitOption)).toEqual([
    ['active'],
    ['title', 'Step 1: Install'],
    ['title', 'second'],
    ['unknown', 'value'],
    [''],
  ]);
  expect(splitTabOptions('')).toEqual([]);
});
