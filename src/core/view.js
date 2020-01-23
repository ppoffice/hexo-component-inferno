const path = require('path');

let themeDir = null;

function _resolve(filename) {
    if (typeof themeDir !== 'string') {
        throw new Error('Hexo theme directory is not defined. Please use init(hexo) first.');
    }

    if (path.isAbsolute(filename)) {
        return require.resolve(filename);
    }
    const resolved = [
        path.join(themeDir, '/layout/', filename),
        path.join(__dirname, '../view/', filename)
    ].find(filepath => {
        try {
            require.resolve(filepath);
            return true;
        } catch (e) {
            return false;
        }
    });

    return require.resolve(resolved ? resolved : filename);
}

function _require(filename) {
    return require(_resolve(filename));
}

_require.resolve = _resolve;

function init(hexo) {
    themeDir = hexo.theme_dir;
}

module.exports = {
    init,
    require: _require
};
