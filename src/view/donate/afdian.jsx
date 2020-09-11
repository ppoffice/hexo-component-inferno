/**
 * Afdian.net donation JSX component.
 * @module view/donate/afdian
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Afdian donation JSX component.
 *
 * @example
 * <Afdian
 *     title="******"
 *     url="/path/to/url" />
 */
class Afdian extends Component {
  render() {
    const { title, url } = this.props;
    if (!url) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>url</code> for Afdian. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    return (
      <a class="button donate" href={url} target="_blank" rel="noopener" data-type="afdian">
        <span class="icon is-small">
          <i class="fas fa-charging-station"></i>
        </span>
        <span>{title}</span>
      </a>
    );
  }
}

/**
 * Cacheable Afdian donation JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Afdian.Cacheable
 *     donate={{ type: 'afdian', url='******' }}
 *     helper={{
 *         __: function() {...},
 *         url_for: function() {...}
 *     }} />
 */
Afdian.Cacheable = cacheComponent(Afdian, 'donate.afdian', (props) => {
  const { donate, helper } = props;

  return {
    title: helper.__('donate.' + donate.type),
    url: helper.url_for(donate.url),
  };
});

module.exports = Afdian;
