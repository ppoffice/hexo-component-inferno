/**
 * Beaudar comment JSX component.
 * @module view/comment/beaudar
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { appendScript } = require('../../util/script');
const { isDark } = require('../../util/appearance');

/**
 * Beaudar comment JSX component.
 * <p>
 * Beaudar is a Chinese fork of Utterances that keeps comments in GitHub issues.
 *
 * @see https://github.com/beaudar/beaudar
 * @example
 * <Beaudar
 *     repo="******"
 *     branch="main"
 *     issueTerm="******"
 *     issueNumber={123}
 *     label="******"
 *     theme="******"
 *     darkTheme="******" />
 */
class Beaudar extends Component {
  render() {
    const { repo, branch, issueTerm, issueNumber, label, theme, darkTheme } = this.props;
    if (!repo || (!issueTerm && !issueNumber)) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>repo</code>, <code>issue_term</code>, or{' '}
          <code>issue_number</code> for Beaudar. Please set it in <code>_config.yml</code>.
        </div>
      );
    }
    const config = { repo };
    if (branch) {
      config.branch = branch;
    }
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
    const js = appendScript('#beaudar-thread', 'https://beaudar.lipk.org/client.js', config, {
      theme: `${isDark()} ? ${JSON.stringify(darkTheme || 'github-dark')} : ${JSON.stringify(
        theme || 'github-light',
      )}`,
    });
    return (
      <>
        <div id="beaudar-thread"></div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Beaudar comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Beaudar.Cacheable
 *     comment={{
 *         repo: "******",
 *         branch: "main",
 *         issue_term: "******",
 *         issue_number: {123},
 *         label: "******",
 *         theme: "******",
 *         dark_theme: "******"
 *     }} />
 */
Beaudar.Cacheable = cacheComponent(Beaudar, 'comment.beaudar', (props) => {
  const { repo, branch, issue_term, issue_number, label, theme, dark_theme } = props.comment;

  return {
    repo,
    branch,
    issueTerm: issue_term,
    issueNumber: issue_number,
    label,
    theme,
    darkTheme: dark_theme,
  };
});

module.exports = Beaudar;
