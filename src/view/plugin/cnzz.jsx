/**
 * CNZZ statistics plugin JSX component.
 * @module view/plugin/cnzz
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * CNZZ statistics plugin JSX component.
 *
 * @see https://developer.umeng.com/docs/67963/detail/68609
 * @example
 * <Cnzz id="******" webId="******" />
 */
class Cnzz extends Component {
  render() {
    const { id, webId } = this.props;
    return (
      <script src={`https://s9.cnzz.com/z_stat.php?id=${id}&web_id=${webId}`} async={true}></script>
    );
  }
}

/**
 * Cacheable CNZZ statistics plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Cnzz.Cacheable
 *     head={false}
 *     plugin={{ id: '******', web_id: '******' }} />
 */
Cnzz.Cacheable = cacheComponent(Cnzz, 'plugin.cnzz', (props) => {
  const { head, plugin } = props;
  if (head || !plugin.id || !plugin.web_id) {
    return null;
  }
  return {
    id: plugin.id,
    webId: plugin.web_id,
  };
});

module.exports = Cnzz.Cacheable;
