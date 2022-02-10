/**
 * Register custom Hexo tag {% message %}.
 * @module hexo/tag/message
 */

/**
 * Register custom Hexo tag {% message %}.
 * <p>
 * This tag is rendered as a Bulma message box.
 *
 * <h5>Tag Parameters:<h5>
 * <table class="params">
 * <tr>
 *     <th>Name</th>
 *     <th>Type</th>
 *     <th class="description">Description</th>
 * </tr>
 * <tr>
 *     <td class="name"><code>color</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] Color of the message. Available values are: dark, primary, link, info, success, warning, danger.</td>
 * </tr>
 * <tr>
 *     <td class="name"><code>icon</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] Icon shown in the message header. Use FontAwesome icon class name for this field.</td>
 * </tr>
 * <tr>
 *     <td class="name"><code>title</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] Message title in the message header. Markdown is supported.</td>
 * </tr>
 * <tr>
 *     <td class="name"><code>size</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description last">[Optional] Size of the message box. Available values are: small, medium, large. Default size is normal.</td>
 * </tr>
 * </table>
 *
 * @see https://bulma.io/documentation/components/message/.
 *
 * @param {Hexo} hexo The Hexo instance.
 *
 * @example
 * {% message color:warning 'icon:fas fa-info-circle' 'title:*ATTENTION*' size:small %}
 *     **This is a warning message.**
 * {% endmessage %}
 */
module.exports = function (hexo) {
  function processTag(options, content) {
    let icon = '';
    let title = '';
    let classes = '';
    let header = '';

    for (const option of options) {
      const [key, value] = option.split(':');
      switch (key) {
        case 'size':
          classes += ` is-${value}`;
          break;
        case 'color':
          classes += ` is-${value}`;
          break;
        case 'icon':
          icon = `<i class="${value} mr-2"></i>`;
          break;
        case 'title':
          title = value;
          break;
      }
    }

    if (icon !== '' || title !== '') {
      const inner = hexo.render.renderSync({ text: icon + title, engine: 'markdown' });
      header = `<div class="message-header">${inner}</div>`;
    }

    return `<article class="message${classes}">
        ${header}
        <div class="message-body">
            ${hexo.render.renderSync({ text: content, engine: 'markdown' })}
        </div>
    </article>`;
  }

  hexo.extend.tag.register('message', processTag, { ends: true });
};
