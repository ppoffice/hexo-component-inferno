/**
 * Patreon donation JSX component.
 * @module view/donate/patreon
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Patreon donation JSX component.
 *
 * @example
 * <Patreon
 *     title="******"
 *     url="/path/to/patreon/page" />
 */
class Patreon extends Component {
  render() {
    const { title, url } = this.props;
    if (!url) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>url</code> for Patreon. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    return (
      <a class="button donate" href={url} target="_blank" rel="noopener" data-type="patreon">
        <span class="icon is-small">
          <i class="fab fa-patreon"></i>
        </span>
        <span>{title}</span>
      </a>
    );
  }
}

/**
 * Cacheable Patreon donation JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Patreon.Cacheable
 *     donate={{ type: 'patreon', url='/path/to/patreon/page' }}
 *     helper={{
 *         __: function() {...},
 *         url_for: function() {...}
 *     }} />
 */
Patreon.Cacheable = cacheComponent(Patreon, 'donate.petreon', (props) => {
  const { donate, helper } = props;

  return {
    url: helper.url_for(donate.url),
    title: helper.__('donate.' + donate.type),
  };
});

module.exports = Patreon;
