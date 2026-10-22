const { Migration, Migrator } = require('./migrate');
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

test('Read versions written as numbers or with fewer parts', () => {
  const migrator = new Migrator(head);
  expect(migrator.isOudated(1)).toBe(true);
  expect(migrator.isOudated('2.1')).toBe(true);
  expect(migrator.isOudated(3.0)).toBe(false);
  expect(migrator.migrate({ version: 2 }).version).toBe('3.0.0');
  expect(() => migrator.isOudated('latest')).toThrow('latest is not a valid configuration version');
});

test('Report the version before each migration that changes the config object', () => {
  class V2 extends Migration {
    constructor() {
      super('2.0.0', null);
    }

    upgrade(config) {
      config.upgraded = true;
      return config;
    }
  }
  const callback = jest.fn();
  new Migrator(V2).migrate({ version: '1.0.0' }, null, callback);
  expect(callback.mock.calls).toEqual([['1.0.0', '2.0.0']]);
});
