/**
 * Paypal donation JSX component.
 * @module view/donate/paypal
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Paypal donation JSX component.
 *
 * @see https://www.paypal.com/donate/buttons
 * @example
 * <Paypal
 *     title="******"
 *     business="******"
 *     currencyCode="******" />
 */
class Paypal extends Component {
  render() {
    const { title, business, currencyCode } = this.props;
    if (!business || !currencyCode) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>business</code> or <code>currency_code</code> for Paypal.
          Please set it in <code>_config.yml</code>.
        </div>
      );
    }
    return (
      <>
        <a
          class="button donate"
          data-type="paypal"
          onclick="document.getElementById('paypal-donate-form').submit()">
          <span class="icon is-small">
            <i class="fab fa-paypal"></i>
          </span>
          <span>{title}</span>
        </a>
        <form
          action="https://www.paypal.com/cgi-bin/webscr"
          method="post"
          target="_blank"
          rel="noopener"
          id="paypal-donate-form">
          <input type="hidden" name="cmd" value="_donations" />
          <input type="hidden" name="business" value={business} />
          <input type="hidden" name="currency_code" value={currencyCode} />
        </form>
      </>
    );
  }
}

/**
 * Cacheable Paypal donation JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Paypal.Cacheable
 *     donate={{ type: 'paypal', business: '******' currency_code: '******' }}
 *     helper={{ __: function() {...} }} />
 */
Paypal.Cacheable = cacheComponent(Paypal, 'donate.paypal', (props) => {
  const { donate, helper } = props;

  return {
    business: donate.business,
    currencyCode: donate.currency_code,
    title: helper.__('donate.' + donate.type),
  };
});

module.exports = Paypal;
