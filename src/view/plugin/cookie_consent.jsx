/**
 * A JSX component for alerting users about the use of cookies.
 * @module view/plugin/cookie_consent
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');
const { toJs } = loadScripts;
const { consentRuntime } = require('../../util/consent');

/**
 * A JSX component for alerting users about the use of cookies.
 *
 * @see https://www.osano.com/cookieconsent/
 * @example
 * <CookieConsent
 *     head={true}
 *     type="info"
 *     theme="classic"
 *     static={false}
 *     position="bottom-left"
 *     policyLink="/path/to/cookie/policy"
 *     text={{
 *         message: 'This website uses cookies to improve your experience.',
 *         dismiss: 'Got it!',
 *         allow: 'Allow cookies',
 *         deny: 'Decline',
 *         link: 'Learn more',
 *         policy: 'Cookie Policy',
 *     }}
 *     cssUrl="/path/to/cookieconsent.css"
 *     jsUrl="/path/to/cookieconsent.js" />
 */
class CookieConsent extends Component {
  render() {
    const { head, text, jsUrl, cssUrl } = this.props;
    const { type, theme, position, policyLink } = this.props;
    const { message, dismiss, allow, deny, link, policy } = text;

    const gated = type === 'opt-in' || type === 'opt-out';
    const consentOptions = gated
      ? `revokeBtn: '<button type="button" class="cc-revoke {{classes}}">{{policy}}</button>',
         onStatusChange: function (status) { window.hexoComponentConsent.setStatus(status); },
         onRevokeChoice: function () { this.setStatus('deny'); },`
      : '';
    const js = `${gated ? consentRuntime(type) : ''}
      if (!window.hexoComponentCookieConsentPopup) {
      window.hexoComponentCookieConsentPopup = true;
      window.cookieconsent.initialise({
        type: ${toJs(type)},
        theme: ${toJs(theme)},
        static: ${toJs(this.props.static)},
        position: ${toJs(position)},
        ${consentOptions}
        content: {
          message: ${toJs(message)},
          dismiss: ${toJs(dismiss)},
          allow: ${toJs(allow)},
          deny: ${toJs(deny)},
          link: ${toJs(link)},
          policy: ${toJs(policy)},
          href: ${toJs(policyLink)},
        },
        palette: {
          popup: {
            background: "#edeff5",
            text: "#838391"
          },
          button: {
            background: "#4b81e8"
          },
        },
      }, function (popup) {
        window.hexoComponentCookieConsentPopup = popup;
        ${gated ? 'window.hexoComponentConsent.setPopup(popup);' : ''}
      });
      }`;

    if (head) {
      return <link rel="stylesheet" href={cssUrl} />;
    }
    return (
      <>
        <script dangerouslySetInnerHTML={{ __html: loadScripts(jsUrl, js) }}></script>
      </>
    );
  }
}

/**
 * Cacheable JSX component for alerting users about the use of cookies.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <CookieConsent.Cacheable
 *     head={true}
 *     plugin={{
 *         info: "info",
 *         theme: "classic",
 *         static: false,
 *         position: "bottom-left",
 *         policyLink: "/path/to/cookie/policy"
 *     }}
 *     helper={{
 *         __: function() {...},
 *         cdn: function() {...}
 *     }} />
 */
CookieConsent.Cacheable = cacheComponent(CookieConsent, 'plugin.cookieconsent', (props) => {
  const { head, plugin, helper } = props;
  const {
    type = 'info',
    theme = 'edgeless',
    position = 'bottom-left',
    policyLink = 'https://www.cookiesandyou.com/',
  } = plugin;

  return {
    head,
    type,
    theme,
    position,
    policyLink,
    static: plugin.static || false,
    text: {
      message: helper.__('plugin.cookie_consent.message'),
      dismiss: helper.__('plugin.cookie_consent.dismiss'),
      allow: helper.__('plugin.cookie_consent.allow'),
      deny: helper.__('plugin.cookie_consent.deny'),
      link: helper.__('plugin.cookie_consent.link'),
      policy: helper.__('plugin.cookie_consent.policy'),
    },
    cssUrl: helper.cdn('cookieconsent', '3.1.1', 'build/cookieconsent.min.css'),
    jsUrl: helper.cdn('cookieconsent', '3.1.1', 'build/cookieconsent.min.js'),
  };
});

module.exports = CookieConsent;
