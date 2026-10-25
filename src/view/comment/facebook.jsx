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
    return (
      <div class="notification is-danger" role="status">
        Facebook discontinued its Comments plugin on February 10, 2026. Please configure another
        comment provider in <code>_config.yml</code>.
      </div>
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
