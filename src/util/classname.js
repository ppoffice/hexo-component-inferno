/**
 * A utility function for creating classnames from a string, array, or classname-to-boolean map.
 * @module util/classname
 */

/**
 * A utility function for creating classnames from a string, array, or classname-to-boolean map.
 *
 * @param {string|Array|Object} classname A class name string, an array of class names, or a plain object
 * whose keys are possible class names and values are booleans that indicate whether the class name is
 * active.
 * @returns {string} The class name string.
 * @throws {Error} The input classname is neither a string, an array, or a plain object.
 */
module.exports = function (classname) {
  if (typeof classname === 'string') {
    return classname;
  }
  if (Array.isArray(classname)) {
    return classname.join(' ');
  }
  if (typeof classname === 'object') {
    return Object.keys(classname)
      .filter((key) => !!classname[key])
      .join(' ');
  }
  throw new Error('Cannot process class name ' + JSON.stringify(classname));
};
