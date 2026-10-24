/** @private Helpers shared by schema inference and default value wrappers. */
const typeOf = (value) => {
  if (value === undefined) {
    return 'undefined';
  }
  return Object.prototype.toString
    .call(value)
    .replace(/^\[object\s+([a-z]+)\]$/i, '$1')
    .toLowerCase();
};

const hasOwnProperty = (obj, prop) => {
  return obj === null || typeOf(obj) === 'undefined'
    ? false
    : Object.prototype.hasOwnProperty.call(obj, prop);
};

module.exports = { typeOf, hasOwnProperty };
