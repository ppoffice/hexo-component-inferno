/**
 * A JSX component for alerting users about the use of cookies.
 * @module view/plugin/cookie_consent
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

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

    const js = `window.addEventListener("load", () => {
      window.cookieconsent.initialise({
        type: ${JSON.stringify(type)},
        theme: ${JSON.stringify(theme)},
        static: ${JSON.stringify(this.props.static)},
        position: ${JSON.stringify(position)},
        content: {
          message: ${JSON.stringify(message)},
          dismiss: ${JSON.stringify(dismiss)},
          allow: ${JSON.stringify(allow)},
          deny: ${JSON.stringify(deny)},
          link: ${JSON.stringify(link)},
          policy: ${JSON.stringify(policy)},
          href: ${JSON.stringify(policyLink)},
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
      });
    });`;

    if (head) {
      return <link rel="stylesheet" href={cssUrl} />;
    }
    return (
      <>
        <script src={jsUrl} defer={true}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
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
