const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

class Twikoo extends Component {
  render() {
    const {
      env_id,
      jsUrl,
    } = this.props;
    const js = `twikoo.init({
      env_id: '${env_id}'
    });`;
    return (
      <Fragment>
        <div id="twikoo" class="content twikoo"></div>
        <script src={jsUrl}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </Fragment>
    );
  }
}

Twikoo.Cacheable = cacheComponent(Twikoo, 'comment.twikoo', (props) => {
  const { comment } = props;
  return {
    env_id: comment.env_id,
    jsUrl: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/twikoo/1.4.18/twikoo.all.min.js',
  };
});

module.exports = Twikoo;
