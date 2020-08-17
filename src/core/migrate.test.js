const { Migrator } = require('./migrate');
const head = require('../../fixture/migration/head');

test('Correctly load all migrations and read the latest version', () => {
  const migrator = new Migrator(head);
  expect(migrator.getLatestVersion()).toBe('3.0.0');
  expect(migrator.isOudated('1.0.0')).toBe(true);
  expect(migrator.isOudated('3.0.0')).toBe(false);
});

test('Do full upgrade correctly', () => {
  const migrator = new Migrator(head);
  const callback = jest.fn();
  const result = migrator.migrate({ version: '1.0.0' }, null, callback);
  // callback has been invoked twice
  expect(callback.mock.calls.length).toBe(2);
  // first invocation received the correct version parameters
  expect(callback.mock.calls[0][0]).toBe('1.0.0');
  expect(callback.mock.calls[0][1]).toBe('2.0.0');
  // second invocation received the correct version parameters
  expect(callback.mock.calls[1][0]).toBe('2.0.0');
  expect(callback.mock.calls[1][1]).toBe('3.0.0');
  expect(result).toEqual({ version: '3.0.0', scalar: 2, vector: [1, 2] });
});

test('Do partial upgrade correctly', () => {
  const migrator = new Migrator(head);
  const callback = jest.fn();
  const result = migrator.migrate({ version: '1.0.0' }, '2.1.0', callback);
  // callback has been invoked twice
  expect(callback.mock.calls.length).toBe(1);
  // first invocation received the correct version parameters
  expect(callback.mock.calls[0][0]).toBe('1.0.0');
  expect(callback.mock.calls[0][1]).toBe('2.0.0');
  expect(result).toEqual({ version: '2.0.0', scalar: 1, vector: [1], useless: true });
});
