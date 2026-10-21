/**
 * Umami analytics plugin JSX component.
 * @module view/plugin/umami
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Umami analytics plugin JSX component.
 * <p>
 * Umami also tracks the pages that are switched to with the History API, such as by PJAX.
 *
 * @see https://umami.is/docs/tracker-configuration
 * @example
 * <Umami
 *     websiteId="******"
 *     scriptUrl="https://cloud.umami.is/script.js"
 *     domains="example.com,www.example.com" />
 */
class Umami extends Component {
  render() {
    const { websiteId, scriptUrl, domains } = this.props;

    return (
      <script src={scriptUrl} data-website-id={websiteId} data-domains={domains} defer></script>
    );
  }
}

/**
 * Cacheable Umami analytics plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Umami.Cacheable
 *     head={true}
 *     plugin={{
 *         website_id: '******',
 *         script_url: 'https://cloud.umami.is/script.js',
 *         domains: 'example.com,www.example.com'
 *     }} />
 */
Umami.Cacheable = cacheComponent(Umami, 'plugin.umami', (props) => {
  const { head, plugin } = props;
  if (!head || !plugin.website_id) {
    return null;
  }
  return {
    websiteId: plugin.website_id,
    scriptUrl: plugin.script_url || 'https://cloud.umami.is/script.js',
    domains: plugin.domains,
  };
});

module.exports = Umami;
