/**
 * A utility function for creating classnames from an classname-boolean map.
 * 
 * @param {object} classname classname-boolean map
 * 
 * @returns classname string
 */
module.exports = function(classname) {
    if (typeof classname === 'string') {
        return classname;
    }
    if (Array.isArray(classname)) {
        return classname.join(' ');
    }
    if (typeof classname === 'object') {
        return Object.keys(classname).filter(key => !!classname[key]).join(' ');
    }
    throw new Error('Cannot process class name' + JSON.stringify(classname));
};
