/**
 * Configuration migration classes.
 * @module core/migrate
 */
const semver = require('semver');

/**
 * Configuration migration base class.
 * <p>
 * Classes that extend this class will specify the target version for the configuration
 * object to upgrade to.
 * The extended classes should have a constructor that takes no parameters exposed.
 */
class Migration {
  /**
   * @param {string} version Target version.
   * @param {module:core/migrate~Migration} head Class of the previous migration.
   */
  constructor(version, head) {
    this.head = head;
    this.version = version;
  }

  /**
   * Upgrade a configuration object to the target version.
   * Any class that extends this class must implement this method.
   *
   * @param {Object} config The configuration object to be upgrade.
   * @returns {Object} The upgraded configuration object, which is copied from the original
   * configuration object.
   */
  upgrade(config) {
    throw new Error('Not implemented!');
  }

  /**
   * Upgrade a configuration object to the target version and bump the version number
   * to the target version.
   *
   * @param {Object} config The configuration object to be upgrade.
   * @returns {Object} The upgraded configuration object, which is copied from the original
   * configuration object.
   */
  migrate(config) {
    const result = this.upgrade(config);
    result.version = this.version.toString();
    return result;
  }
}

/**
 * Configuration upgrade utility class.
 * <p>
 * This class load a series of {@link Migration} classes following the 'head' property of the
 * head migration.
 * It is used to run the migrations that are before or equal to a given target version
 * on a configuration object.
 */
class Migrator {
  /**
   * @param {module:core/migrate~Migration} head The latest migration class to be loaded.
   */
  constructor(head) {
    /** @access private */
    this.versions = [];

    /** @access private */
    this.migrations = {};

    while (head) {
      const migration = new head(); // eslint-disable-line new-cap
      if (!(migration instanceof Migration)) {
        throw new Error(`Migration ${migration.constructor.name} is not a Migration class.`);
      }
      if (!semver.valid(migration.version)) {
        throw new Error(
          `${migration.version} is not a valid version in ${migration.constructor.name}}`,
        );
      }
      this.versions.push(migration.version);
      this.migrations[migration.version] = migration;
      head = migration.head;
    }

    this.versions.sort(semver.compare);
  }

  /**
   * Get the latest target version among all loaded migrations.
   *
   * @returns {string} The latest target version.
   */
  getLatestVersion() {
    if (!this.versions.length) {
      return null;
    }
    return this.versions[this.versions.length - 1];
  }

  /**
   * Check if the given version is the latest target version.
   *
   * @param {string} version A version number to be checked.
   * @returns {boolean} true if the given version is the latest version.
   */
  isOudated(version) {
    return this.getLatestVersion() && semver.lt(version, this.getLatestVersion());
  }

  /**
   * Upgrade a given configuration to a given target version.
   *
   * @param {Object} config The configuration object to be upgraded.
   * @param {string} toVersion Target version number.
   * @param {Function} callback An optional callback function called when each migration
   * is done. It takes the original version of the configuration object and the current migration
   * version as parameters.
   * @returns {Object} The upgrade configuration object.
   */
  migrate(config, toVersion = null, callback = null) {
    const fVer = config.version;
    const tVer = toVersion || this.getLatestVersion();
    // find all migrations whose version is larger than fromVer, smaller or equal to toVer
    // and run migrations on the config one by one.
    return this.versions
      .filter((ver) => semver.gt(ver, fVer) && !semver.gt(ver, tVer))
      .sort(semver.compare)
      .reduce((cfg, ver) => {
        const migration = this.migrations[ver.toString()];
        const result = migration.migrate(cfg);
        if (typeof callback === 'function') {
          callback(cfg.version, migration.version);
        }
        return result;
      }, config);
  }
}

module.exports = {
  Migration,
  Migrator,
};
