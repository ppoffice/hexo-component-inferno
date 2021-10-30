/**
 * Facebook comment JSX component.
 * @module view/comment/facebook
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Facebook comment JSX component.
 *
 * @see https://developers.facebook.com/docs/plugins/comments/
 * @example
 * <Facebook
 *     language="******"
 *     permalink="/page/permanent/path" />
 */
class Facebook extends Component {
  render() {
    const { language, permalink } = this.props;
    const fbLanguage = language.split('-').join('_');
    const js = `(function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/${fbLanguage}/sdk.js#xfbml=1&version=v12.0";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));`;
    return (
      <>
        <div class="fb-comments" data-width="100%" data-href={permalink} data-num-posts="5"></div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Facebook comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Facebook.Cacheable
 *     config={{ language: '*******' }}
 *     page={{
 *         lang: '******',
 *         language: '******',
 *         permalink: '/page/permanent/link'
 *     }} />
 */
Facebook.Cacheable = cacheComponent(Facebook, 'comment.facebook', (props) => {
  const { config, page } = props;

  return {
    language: page.lang || page.language || config.language || 'en',
    permalink: page.permalink,
  };
});

module.exports = Facebook;
