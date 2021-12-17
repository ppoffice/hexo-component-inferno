/**
 * KaTeX math renderer plugin JSX component.
 * @module view/plugin/katex
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * KaTeX math renderer plugin JSX component.
 *
 * @see https://katex.org/
 * @example
 * <KaTeX
 *     cssUrl="/path/to/katex.css"
 *     jsUrl="/path/to/katex.js"
 *     autoRenderUrl="/path/to/auto-render.js"
 *     mhchemUrl="/path/to/mhchem.js" />
 */
class KaTeX extends Component {
  render() {
    const { cssUrl, jsUrl, autoRenderUrl, mhchemUrl } = this.props;

    const js = `window.addEventListener("load", function() {
            document.querySelectorAll('[role="article"] > .content').forEach(function(element) {
                renderMathInElement(element);
            });
        });`;

    return (
      <>
        <link rel="stylesheet" href={cssUrl} />
        <script src={jsUrl} defer={true}></script>
        <script src={autoRenderUrl} defer={true}></script>
        <script src={mhchemUrl} defer={true}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable KaTeX math renderer plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <KaTeX.Cacheable
 *     head={true}
 *     helper={{ cdn: function() {...} }} />
 */
KaTeX.Cacheable = cacheComponent(KaTeX, 'plugin.katex', (props) => {
  const { head, helper } = props;
  if (head) {
    return null;
  }
  return {
    jsUrl: helper.cdn('katex', '0.15.1', 'dist/katex.min.js'),
    cssUrl: helper.cdn('katex', '0.15.1', 'dist/katex.min.css'),
    autoRenderUrl: helper.cdn('katex', '0.15.1', 'dist/contrib/auto-render.min.js'),
    mhchemUrl: helper.cdn('katex', '0.15.1', 'dist/contrib/mhchem.min.js'),
  };
});

module.exports = KaTeX;
