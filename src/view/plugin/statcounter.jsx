/**
 * Statcounter statistics plugin JSX component.
 * @module view/plugin/statcounter
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Statcounter statistics plugin JSX component.
 *
 * @see https://statcounter.com/
 * @example
 * <Statcounter project="******" security="******" />
 */
class Statcounter extends Component {
  render() {
    const { project, security } = this.props;

    const js = `
      var sc_project=${JSON.stringify(project)};
      var sc_invisible=1;
      var sc_security=${JSON.stringify(security)};
      var sc_https=1;
      var sc_remove_link=1;`;
    return (
      <>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
        <script src="https://www.statcounter.com/counter/counter.js" async></script>
        <noscript>
          <div class="statcounter">
            <img
              class="statcounter"
              src={`https://c.statcounter.com/${project}/0/${security}/1/`}
              alt="real time web analytics"
            />
          </div>
        </noscript>
      </>
    );
  }
}

/**
 * Cacheable Statcounter statistics plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Statcounter.Cacheable
 *     head={false}
 *     plugin={{ project: '******', security: '******' }} />
 */
Statcounter.Cacheable = cacheComponent(Statcounter, 'plugin.statcounter', (props) => {
  const { head, plugin } = props;
  const { project, security } = plugin;
  if (head || !project || !security) {
    return null;
  }
  return {
    project,
    security,
  };
});

module.exports = Statcounter.Cacheable;
