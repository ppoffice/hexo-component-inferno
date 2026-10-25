/**
 * MathJax math renderer plugin JSX component.
 * @module view/plugin/mathjax
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * MathJax math renderer plugin JSX component.
 *
 * @see https://www.mathjax.org/
 * @example
 * <Mathjax jsUrl="/mathjax/tex-mml-chtml.js" fontPath="/mathjax-newcm-font" />
 */
class Mathjax extends Component {
  render() {
    const { jsUrl, fontPath } = this.props;

    const js = `window.MathJax = window.MathJax || {
      tex: {
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']]
      },
      output: {
        font: 'mathjax-newcm',
        ${fontPath ? `fontPath: ${JSON.stringify(fontPath).replace(/</g, '\\u003c')}` : ''}
      }
    };`;

    return (
      <>
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: js }}></script>
        <script id="MathJax-script" defer src={jsUrl}></script>
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
    jsUrl: helper.cdn('mathjax', '4.1.3', 'tex-mml-chtml.js'),
    fontPath: helper
      .cdn('@mathjax/mathjax-newcm-font', '4.1.3', 'chtml.js')
      .replace(/\/chtml\.js$/, ''),
  };
});

module.exports = Mathjax;
