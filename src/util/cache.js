/**
 * View cache utility functions.
 * @module util/cache
 */
const crypto = require('crypto');
const { Component } = require('inferno'); // eslint-disable-line no-unused-vars
const { createElement } = require('inferno-create-element');

const cache = {};

function computeHash(props) {
    return crypto.createHash('md5').update(JSON.stringify(props)).digest('hex');
}

module.exports = {

    /**
     * Create cached component from a given component class.
     * The cache ID is caculated from the input props.
     *
     * @param {Component}   type        JSX component class
     * @param {string}      prefix      Cache ID prefix
     * @param {Function}    transform   Transform the input props to target props and
     *                                  its result is used to compute cache ID
     * @returns The original component type as defined in the `type` parameter.
     *          A cachable functional component is attached to the original component type,
     *          which uses the `transform` function and the component props to calculate the cache ID.
     *          The cache ID will be used to determine whether the same element with the exact same
     *          props has been created and cached. If so, the cached element will be returned.
     *          If the cache ID can be computed, a new element will be created use the
     *          `createElement` function of the inferno.js, then it will be cached and returned.
     *          If the `transform`ed props is empty (!transform(props)), the cachable functional component
     *          will also return null element when `createElement` is called on it.
     *          The `transform` function will also be attached as the `transform` property of the cachable
     *          component.
     */
    cacheComponent(type, prefix, transform) {
        const component = props => {
            const targetProps = transform(props);
            if (!targetProps) {
                return null;
            }
            const cacheId = prefix + '-' + computeHash(targetProps);
            if (!cacheId) {
                return createElement(type, targetProps);
            }
            if (!cache[cacheId]) {
                cache[cacheId] = createElement(type, targetProps);
            }
            return cache[cacheId];
        };
        component.transform = transform;
        type.Cachable = component;
        return type;
    }
};
