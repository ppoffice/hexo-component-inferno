/**
 * "Buy me a coffee" donation JSX component.
 * @module view/donate/buymeacoffee
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * "Buy me a coffee" donation JSX component.
 *
 * @example
 * <BuyMeACoffee
 *     title="******"
 *     url="/path/to/buymeacoffee/page" />
 */
class BuyMeACoffee extends Component {
  render() {
    const { title, url } = this.props;
    if (!url) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>url</code> for &quot;Buy me a coffee&quot;. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    return (
      <a class="button donate" href={url} target="_blank" rel="noopener" data-type="buymeacoffee">
        <span class="icon is-small">
          <i class="fas fa-coffee"></i>
        </span>
        <span>{title}</span>
      </a>
    );
  }
}

/**
 * Cacheable "Buy me a coffee" donation JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <BuyMeACoffee.Cacheable
 *     donate={{ type: 'buymeacoffee', url='/path/to/buymeacoffee/page' }}
 *     helper={{
 *         __: function() {...},
 *         url_for: function() {...}
 *     }} />
 */
BuyMeACoffee.Cacheable = cacheComponent(BuyMeACoffee, 'donate.buymeacoffee', (props) => {
  const { donate, helper } = props;

  return {
    url: helper.url_for(donate.url),
    title: helper.__('donate.' + donate.type),
  };
});

module.exports = BuyMeACoffee;
