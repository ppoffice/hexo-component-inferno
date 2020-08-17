const deepmerge = require('deepmerge');
const { Migration } = require('../../lib/core/migrate');

module.exports = class extends Migration {
  constructor() {
    super('2.0.0', null);
  }

  upgrade(config) {
    const result = deepmerge({}, config);

    result.scalar = 1;
    result.vector = [1];
    result.useless = true;

    return result;
  }
};
