const classname = require('../util/classname');

test('Correctly create the class name string', () => {
  expect(classname('class-1')).toBe('class-1');
  expect(classname(['class-1', 'class-2'])).toBe('class-1 class-2');
  expect(classname({ 'class-1': true, 'class-2': false, 'class-3': 1 })).toBe('class-1 class-3');
  expect(() => {
    return classname(false);
  }).toThrow();
});
