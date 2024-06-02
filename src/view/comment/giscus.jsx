/**
 * Giscus comment JSX component.
 * @module view/comment/giscus
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Giscus comment JSX component.
 *
 * @see https://giscus.app/
 * @example
 * <Giscus
 *     repo="usr/repo"
 *     repoId="X_xxxxxxxxxx"
 *     category="******"
 *     categoryId="XXX_xxxxxxxxxxxxxxxx"
 *     mapping="******"
 *     strict={0}
 *     reactionsEnabled={0}
 *     emitMetadata={0}
 *     inputPosition="******"
 *     theme="******"
 *     lang="******"
 *     lazy="******" />
 */
class Giscus extends Component {
  render() {
    const {
      repo,
      repoId,
      category,
      categoryId,
      mapping,
      term,
      strict,
      reactionsEnabled,
      emitMetadata,
      inputPosition,
      theme,
      customThemeCss,
      lang,
      lazy,
    } = this.props;
    if (!repo || !repoId || !categoryId) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>repo</code>, <code>repoId</code>, or <code>categoryId</code>{' '}
          for Giscus. Please set it in <code>_config.yml</code>.
        </div>
      );
    }
    if ((mapping === 'specific' || mapping === 'number') && !term) {
      return (
        <div class="notification is-danger">
          You set <code>mapping</code> to <code>specific</code> or <code>number</code>, but did not
          set <code>term</code> for Giscus. Please set <code>term</code> in <code>_config.yml</code>
          .
        </div>
      );
    }
    const config = { repo };
    if (category) {
      config['data-category'] = category;
    } else {
      config['data-category'] = 'Announcements';
    }
    if (mapping) {
      config['data-mapping'] = mapping;
    } else {
      config['data-mapping'] = 'pathname';
    }
    if (strict) {
      config['data-strict'] = 1;
    } else {
      config['data-strict'] = 0;
    }
    if (reactionsEnabled) {
      config['data-reactions-enabled'] = 1;
    } else {
      config['data-reactions-enabled'] = 0;
    }
    if (emitMetadata) {
      config['data-emit-metadata'] = 1;
    } else {
      config['data-emit-metadata'] = 0;
    }
    if (inputPosition) {
      config['data-input-position'] = inputPosition;
    } else {
      config['data-input-position'] = 'top';
    }
    if (theme) {
      if (theme === 'custom') {
        if (customThemeCss) {
          config['data-theme'] = customThemeCss;
        } else {
          return (
            <div class="notification is-danger">
              You set <code>theme</code> to <code>custom</code>, but did not apply a{' '}
              <code>customThemeCss</code> for Giscus. Please set it in <code>_config.yml</code>.
            </div>
          );
        }
      } else {
        config['data-theme'] = theme;
      }
    } else {
      config['data-theme'] = 'noborder_light';
    }
    if (lang) {
      config['data-lang'] = lang;
    } else {
      config['data-lang'] = 'en';
    }
    if (lazy) {
      config['data-loading'] = 'lazy';
    }
    return (
      <script
        src="https://giscus.app/client.js"
        {...config}
        crossorigin="anonymous"
        async={true}></script>
    );
  }
}

/**
 * Cacheable Giscus comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Giscus.Cacheable
 *     comment={{
 *         repo: "usr/repo"
 *         repoId: "X_xxxxxxxxxx"
 *         category: "******"
 *         categoryId: "XXX_xxxxxxxxxxxxxxxx"
 *         mapping: "******"
 *         strict: {false}
 *         reactionsEnabled: {false}
 *         emitMetadata: {false}
 *         inputPosition: "******"
 *         theme: "******"
 *         lang: "******"
 *         lazy: "******"
 *     }} />
 */
Giscus.Cacheable = cacheComponent(Giscus, 'comment.giscus', (props) => {
  const {
    repo,
    repoId,
    category,
    categoryId,
    mapping,
    term,
    strict,
    reactionsEnabled,
    emitMetadata,
    inputPosition,
    theme,
    customThemeCss,
    lang,
    lazy,
  } = props.comment;

  return {
    repo,
    repoId,
    category,
    categoryId,
    mapping,
    term,
    strict,
    reactionsEnabled,
    emitMetadata,
    inputPosition,
    theme,
    customThemeCss,
    lang,
    lazy,
  };
});

module.exports = Giscus;
