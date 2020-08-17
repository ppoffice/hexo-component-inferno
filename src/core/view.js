/**
 * View resolver and loader.
 * @module core/view
 */
const path = require('path');

let themeDir = null;

/**
 * Resolve the full path of a given view file name.
 * <p>
 * This function will first look up current theme layout directory and then view directory
 * (lib/view/) in this module and return the full path of the first found file
 * under these directories.
 *
 * @function
 * @name resolve
 * @param {string} filename The relative file path to the theme layout directory
 * or the lib/view/ directory in this directory.
 * @returns {string} Resolved full path of the given view file.
 */
function _resolve(filename) {
  if (typeof themeDir !== 'string') {
    throw new Error('Hexo theme directory is not defined. Please use init(hexo) first.');
  }

  if (path.isAbsolute(filename)) {
    return require.resolve(filename);
  }
  const resolved = [
    path.join(themeDir, '/layout/', filename),
    path.join(__dirname, '../view/', filename),
  ].find((filepath) => {
    try {
      require.resolve(filepath);
      return true;
    } catch (e) {
      return false;
    }
  });

  return require.resolve(resolved ? resolved : filename);
}

/**
 * Resolve and require a view module.
 *
 * @static
 * @function
 * @name require
 * @property {function} resolve See {@link module:core/view.resolve}.
 * @param {string} filename The file path of the view to be required.
 * @returns {Object} The view module.
 */
function _require(filename) {
  return require(_resolve(filename));
}

_require.resolve = _resolve;

/**
 * Initialize module global variables, including the theme directory variable.
 * <p>
 * Must be used before {@link module:core/view.require} or {@link module:core/view.resolve}.
 *
 * @static
 * @param {string} hexo Hexo instance.
 */
function init(hexo) {
  themeDir = hexo.theme_dir;
}

module.exports = {
  init,
  require: _require,
};
