/**
 * Alipay donation JSX component.
 * @module view/donate/alipay
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Alipay donation JSX component.
 *
 * @example
 * <Alipay
 *     title="******"
 *     qrcode="/path/to/qrcode" />
 */
class Alipay extends Component {
  render() {
    const { title, qrcode } = this.props;
    if (!qrcode) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>qrcode</code> for Alipay. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    return (
      <a class="button donate" data-type="alipay">
        <span class="icon is-small">
          <i class="fab fa-alipay"></i>
        </span>
        <span>{title}</span>
        <span class="qrcode">
          <img src={qrcode} alt={title} />
        </span>
      </a>
    );
  }
}

/**
 * Cacheable Alipay donation JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Alipay.Cacheable
 *     donate={{ type: 'alipay', qrcode='******' }}
 *     helper={{
 *         __: function() {...},
 *         url_for: function() {...}
 *     }} />
 */
Alipay.Cacheable = cacheComponent(Alipay, 'donate.alipay', (props) => {
  const { donate, helper } = props;

  return {
    title: helper.__('donate.' + donate.type),
    qrcode: helper.url_for(donate.qrcode),
  };
});

module.exports = Alipay;
