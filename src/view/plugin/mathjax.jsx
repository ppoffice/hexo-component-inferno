/**
 * MathJax math renderer plugin JSX component.
 * @module view/plugin/katex
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * MathJax math renderer plugin JSX component.
 *
 * @see https://www.mathjax.org/
 * @example
 * <Mathjax jsUrl="/path/to/mathjax.js" />
 */
class Mathjax extends Component {
  render() {
    const { jsUrl } = this.props;

    const js = `MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']]
      },
      svg: {
        fontCache: 'global'
      },
      chtml: {
        matchFontHeight: false
      }
    };`;

    return (
      <>
        <script
          type="text/javascript"
          id="MathJax-script"
          async
          dangerouslySetInnerHTML={{ __html: js }}></script>
        <script src={jsUrl}></script>
      </>
    );
  }
}

/**
 * Cacheable Mathjax math renderer plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Mathjax.Cacheable
 *     head={true}
 *     helper={{ cdn: function() {...} }} />
 */
Mathjax.Cacheable = cacheComponent(Mathjax, 'plugin.mathjax', (props) => {
  const { head, helper } = props;
  if (head) {
    return null;
  }
  return {
    jsUrl: helper.cdn('mathjax', '3.2.2', 'es5/tex-mml-chtml.js'),
  };
});

module.exports = Mathjax;
