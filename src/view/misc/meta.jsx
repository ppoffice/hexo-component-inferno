/**
 * A JSX component that renders &lt;meta&gt; tags.
 * @module view/misc/meta
 */
const { Component } = require('inferno');

function trim(str) {
  return str
    .trim()
    .replace(/^"(.*)"$/, '$1')
    .replace(/^'(.*)'$/, '$1');
}

function split(str, sep) {
  const result = [];
  let matched = null;
  while ((matched = sep.exec(str)) !== null) {
    result.push(matched[0]);
  }
  return result;
}

/**
 * A JSX component that renders &lt;meta&gt; tags.
 *
 * @name Meta
 * @example
 * <Meta meta={[
 *     'name="generator";content="Hexo 4.2.0"'
 *     'property="article:author";content="PPOffice"'
 * ]} />
 */
module.exports = class extends Component {
  render() {
    let { meta = [] } = this.props;
    if (!Array.isArray(meta)) {
      meta = [meta];
    }
    const tags = meta
      .filter((entry) => typeof entry === 'string')
      .map((entry) => {
        const props = split(entry, /(?:[^\\;]+|\\.)+/g)
          .map((property) => {
            const entry = split(property, /(?:[^\\=]+|\\.)+/g);
            if (entry.length < 2) {
              return null;
            }
            return { [trim(entry[0])]: trim(entry[1]) };
          })
          .filter((property) => {
            return property !== null;
          })
          .reduce((prev, current) => {
            return Object.assign(prev, current);
          }, {});
        return <meta {...props} />;
      });

    return <>{tags}</>;
  }
};
