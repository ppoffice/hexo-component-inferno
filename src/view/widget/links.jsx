/**
 * External links widget JSX component.
 * @module view/widget/links
 */
const { URL } = require('url');
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * External links widget JSX component.
 *
 * @example
 * <Links
 *     title="Widget title"
 *     links={{
 *         'Link Name 1': '/path/to/external/site',
 *         'Link Name 2': {
 *              'link': '/path/to/external/site',
 *              'hide_hostname': true,
 *        }
 *     }} />
 */
class Links extends Component {
  render() {
    const { title, links } = this.props;

    for (const name in links) {
      let link = links[name];

      if (typeof link === 'string') {
        link = { link };
        links[name] = link;
      }

      if (link.hide_hostname !== true) {
        try {
          link.hostname = new URL(link.link).hostname;
        } catch (e) {}
      }
    }

    return (
      <div class="card widget" data-type="links">
        <div class="card-content">
          <div class="menu">
            <h3 class="menu-label">{title}</h3>
            <ul class="menu-list">
              {Object.keys(links).map((i) => {
                return (
                  <li>
                    <a class="level is-mobile" href={links[i].link} target="_blank" rel="noopener">
                      <span class="level-left">
                        <span class="level-item">{i}</span>
                      </span>
                      {links[i].hostname ? (
                        <span class="level-right">
                          <span class="level-item tag">{links[i].hostname}</span>
                        </span>
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Cacheable external links widget JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Links.Cacheable
 *     links={{
 *         'Link Name 1': '/path/to/external/site',
 *         'Link Name 2': '/path/to/external/site'
 *     }}
 *     helper={{ __: function() {...} }} />
 */
Links.Cacheable = cacheComponent(Links, 'widget.links', (props) => {
  const { helper, widget } = props;
  if (!Object.keys(widget.links).length) {
    return null;
  }
  return {
    title: helper.__('widget.links'),
    links: widget.links,
  };
});

module.exports = Links;
