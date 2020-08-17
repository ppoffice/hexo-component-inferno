const fs = require('fs');
const path = require('path');
const yaml = require('../util/yaml');

test('Correctly parse YAML string', () => {
  const example = fs.readFileSync(path.join(__dirname, '../../fixture/misc/original.yaml'), {
    encoding: 'utf8',
  });
  const result = JSON.stringify(yaml.parse(example));
  const expected = JSON.stringify(require('../../fixture/misc/parsed.json'));
  expect(result).toEqual(expected);
});

test('Correctly format to YAML string', () => {
  const example = require('../../fixture/misc/parsed.json');
  const expected = fs.readFileSync(path.join(__dirname, '../../fixture/misc/stringified.yaml'), {
    encoding: 'utf8',
  });
  expect(yaml.stringify(example)).toBe(expected);
});
