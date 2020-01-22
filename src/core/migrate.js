const path = require('path');
const semver = require('semver');

class Migration {

    /**
     * @param {string} version Target version
     * @param {string} head File name of the previous migration
     */
    constructor(version, head) {
        this.head = head;
        this.version = version;
    }

    upgrade(config) {
        throw new Error('Not implemented!');
    }

    migrate(config) {
        const result = this.upgrade(config);
        result.version = this.version.toString();
        return result;
    }
}


class Migrator {
    constructor(root) {
        this.versions = [];
        this.migrations = {};

        let head = 'head';
        while (head) {
            const migration = new(require(path.join(root, head)))();
            if (!(migration instanceof Migration)) {
                throw new Error(`Migration ${head} is not a Migration class.`);
            }
            if (!semver.valid(migration.version)) {
                throw new Error(`${migration.version} is not a valid version in ${head}`);
            }
            this.versions.push(migration.version);
            this.migrations[migration.version.toString()] = migration;
            head = migration.head;
        }

        this.versions.sort(semver.compare);
    }

    getLatestVersion() {
        if (!this.versions.length) {
            return null;
        }
        return this.versions[this.versions.length - 1];
    }

    isOudated(version) {
        return this.getLatestVersion() && semver.lt(version, this.getLatestVersion());
    }

    migrate(config, toVersion = null, callback = null) {
        const fVer = config.version;
        const tVer = toVersion || this.getLatestVersion();
        // find all migrations whose version is larger than fromVer, smaller or equal to toVer
        // and run migrations on the config one by one
        return this.versions.filter(ver => semver.gt(ver, fVer) && !semver.gt(ver, tVer))
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

Migrator.Migration = Migration;

module.exports = Migrator;
