/**
 * Utterances comment JSX component.
 * @module view/comment/utterances
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { appendScript } = require('../../util/script');
const { isDark } = require('../../util/appearance');

/**
 * Utterances comment JSX component.
 *
 * @see https://utteranc.es/
 * @example
 * <Utterances
 *     repo="******"
 *     issueTerm="******"
 *     issueNumber={123}
 *     label="******"
 *     theme="******"
 *     darkTheme="******" />
 */
class Utterances extends Component {
  render() {
    const { repo, issueTerm, issueNumber, label, theme, darkTheme } = this.props;
    if (!repo || (!issueTerm && !issueNumber)) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>repo</code>, <code>issue_term</code>, or{' '}
          <code>issue_number</code> for Utterances. Please set it in <code>_config.yml</code>.
        </div>
      );
    }
    const config = { repo };
    if (issueTerm) {
      config['issue-term'] = issueTerm;
    } else {
      config['issue-number'] = issueNumber;
    }
    if (label) {
      config.label = label;
    }
    config.crossorigin = 'anonymous';
    // Use the dark theme when the page looks dark
    const js = appendScript('#utterances-thread', 'https://utteranc.es/client.js', config, {
      theme: `${isDark()} ? ${JSON.stringify(darkTheme || 'github-dark')} : ${JSON.stringify(
        theme || 'github-light',
      )}`,
    });
    return (
      <>
        <div id="utterances-thread"></div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Utterances comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Utterances.Cacheable
 *     comment={{
 *         repo: "******",
 *         issue_term: "******"
 *         issue_number: {123}
 *         label: "******"
 *         theme: "******"
 *         dark_theme: "******"
 *     }} />
 */
Utterances.Cacheable = cacheComponent(Utterances, 'comment.utterances', (props) => {
  const { repo, issue_term, issue_number, label, theme, dark_theme } = props.comment;

  return {
    repo,
    issueTerm: issue_term,
    issueNumber: issue_number,
    label,
    theme,
    darkTheme: dark_theme,
  };
});

module.exports = Utterances;
