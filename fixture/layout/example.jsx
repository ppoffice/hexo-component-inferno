const { Component } = require('inferno');

module.exports = class extends Component {
  render() {
    return <div>{'Hello ' + this.props.subject}</div>;
  }
};
