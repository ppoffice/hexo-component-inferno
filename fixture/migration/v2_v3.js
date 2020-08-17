const deepmerge = require('deepmerge');
const { Migration } = require('../../lib/core/migrate');

module.exports = class extends Migration {
  constructor() {
    super('3.0.0', require('./v1_v2'));
  }

  upgrade(config) {
    const result = deepmerge({}, config);

    result.scalar = 2;
    result.vector = [1, 2];
    delete result.useless;

    return result;
  }
};
