/**
 * Hotjar user feedback plugin JSX component.
 * @module view/plugin/hotjar
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Hotjar user feedback plugin JSX component.
 *
 * @see https://help.hotjar.com/hc/en-us/sections/115002608787-Installation-Guides
 * @example
 * <Hotjar siteId="******" />
 */
class Hotjar extends Component {
  render() {
    const { siteId } = this.props;

    const js = `(function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${siteId},hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`;

    return (
      <>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Hotjar user feedback plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Hotjar.Cacheable
 *     head={true}
 *     plugin={{ site_id: '*******' }} />
 */
Hotjar.Cacheable = cacheComponent(Hotjar, 'plugin.hotjar', (props) => {
  const { head, plugin } = props;
  if (!head || !plugin.site_id) {
    return null;
  }
  return {
    siteId: plugin.site_id,
  };
});

module.exports = Hotjar;
