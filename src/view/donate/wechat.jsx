/**
 * Wechat donation JSX component.
 * @module view/donate/alipay
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Wechat donation JSX component.
 *
 * @example
 * <Wechat
 *     title="******"
 *     qrcode="/path/to/qrcode" />
 */
class Wechat extends Component {
  render() {
    const { title, qrcode } = this.props;
    if (!qrcode) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>qrcode</code> for Wechat. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    return (
      <a class="button donate" data-type="wechat">
        <span class="icon is-small">
          <i class="fab fa-weixin"></i>
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
 * Cacheable Wechat donation JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Wechat.Cacheable
 *     donate={{ type: 'wechat', qrcode='******' }}
 *     helper={{
 *         __: function() {...},
 *         url_for: function() {...}
 *     }} />
 */
Wechat.Cacheable = cacheComponent(Wechat, 'donate.wechat', (props) => {
  const { donate, helper } = props;

  return {
    qrcode: helper.url_for(donate.qrcode),
    title: helper.__('donate.' + donate.type),
  };
});

module.exports = Wechat;
