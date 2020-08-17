/**
 * Busuanzi visitor counter plugin JSX component.
 * @module view/plugin/baidu_analytics
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Busuanzi visitor counter plugin JSX component.
 *
 * @see https://busuanzi.ibruce.info/
 * @example
 * <Busuanzi />
 */
class Busuanzi extends Component {
  render() {
    return (
      <script src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js" defer={true}></script>
    );
  }
}

/**
 * Cacheable Busuanzi visitor counter plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Busuanzi.Cacheable head={true} />
 */
Busuanzi.Cacheable = cacheComponent(Busuanzi, 'plugin.busuanzi', (props) => {
  if (!props.head) {
    return null;
  }
  return {};
});

module.exports = Busuanzi;
