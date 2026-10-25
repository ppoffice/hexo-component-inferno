/**
 * Retired Share.js configuration entry.
 * @module view/share/sharejs
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { deprecate } = require('../../util/deprecate');

class ShareJs extends Component {
  render() {
    deprecate('share.sharejs', 'Retired; select web_share or addtoany.');
    return (
      <div class="notification is-danger">
        Share.js is retired. Set <code>share.type</code> to <code>web_share</code> or{' '}
        <code>addtoany</code>.
      </div>
    );
  }
}

ShareJs.Cacheable = cacheComponent(ShareJs, 'share.sharejs', () => ({}));
module.exports = ShareJs;
