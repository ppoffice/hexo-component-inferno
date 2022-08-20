/**
 * Utterances comment JSX component.
 * @module view/comment/utterances
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

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
 *     theme="******" />
 */
class Utterances extends Component {
  render() {
    const { repo, issueTerm, issueNumber, label, theme } = this.props;
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
    if (theme) {
      config.theme = theme;
    }
    return (
      <script
        src="https://utteranc.es/client.js"
        {...config}
        crossorigin="anonymous"
        async={true}></script>
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
 *     }} />
 */
Utterances.Cacheable = cacheComponent(Utterances, 'comment.utterances', (props) => {
  const { repo, issue_term, issue_number, label, theme } = props.comment;

  return {
    repo,
    issueTerm: issue_term,
    issueNumber: issue_number,
    label,
    theme,
  };
});

module.exports = Utterances;
