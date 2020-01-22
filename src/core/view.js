const fs = require('fs');
const path = require('path');

module.exports = hexo => {
    if (typeof hexo.theme_dir !== 'string') {
        throw new Error('Hexo theme directory is not defined');
    }

    function _resolve(filename) {
        if (path.isAbsolute(filename)) {
            return require.resolve(filename);
        }
        const resolved = [
            path.join(hexo.theme_dir, '/layout/', filename),
            path.join(__dirname, '../view/', filename)
        ].find(fs.existsSync);

        return resolved ? require.resolve(resolved) : require.resolve(filename);
    }

    function _require(filename) {
        return require(_resolve(filename));
    }

    _require.resolve = _resolve;

    return {
        require: _require
    };
};
