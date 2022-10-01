/**
 * Register custom Hexo tag {% tabs %}.
 * @module hexo/tag/tabs
 */

/**
 * Register custom Hexo tag {% tabs %}.
 * <p>
 * This tag is rendered as a Bulma tabs component.
 * <p>
 * Each individual tab must be wrapped with <code>&lt;!-- tab [...tab_param] --&gt;&lt;!-- endtab --&gt;</code>
 *
 * <h5>Tag Parameters:<h5>
 * <table class="params">
 * <tr>
 *     <th>Name</th>
 *     <th>Type</th>
 *     <th class="description">Description</th>
 * </tr>
 * <tr>
 *     <td class="name"><code>align</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] Alignment of the tabs. Available values are: left, centered, right, fullwidth. Default alignment is left.</td>
 * </tr>
 * <tr>
 *     <td class="name"><code>size</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] Size of the tabs. Available values are: small, medium, large. Default size is normal.</td>
 * </tr>
 * <tr>
 *     <td class="name"><code>style</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] Style of the tabs. Available values are: boxed, toggle, toggle-rounded. Default style is none.</td>
 * </tr>
 * </table>
 *
 * <h5>Tab Parameters:<h5>
 * <table class="params">
 * <tr>
 *     <th>Name</th>
 *     <th>Type</th>
 *     <th class="description">Description</th>
 * </tr>
 * <tr>
 *     <td class="name"><code>id</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] The ID of the current tab. This value must be unique on each page.</td>
 * </tr>
 * <tr>
 *     <td class="name"><code>active</code></td>
 *     <td class="type"><span class="param-type"><code>boolean</code></span></td>
 *     <td class="description">[Optional] Whether to show current tab by default. Only one of the tabs can be set to active.</td>
 * </tr>
 * <tr>
 *     <td class="name"><code>title</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] Title of the current tab.</td>
 * </tr>
 * <tr>
 *     <td class="name"><code>icon</code></td>
 *     <td class="type"><span class="param-type"><code>string</code></span></td>
 *     <td class="description">[Optional] Icon of the current tab. Use FontAwesome icon class name for this field.</td>
 * </tr>
 * </table>
 *
 * @see https://bulma.io/documentation/components/tabs/.
 *
 * @param {Hexo} hexo The Hexo instance.
 *
 * @example
 * {% tabs align:fullwidth size:small style:toggle-rounded %}
 * <!-- tab active id:tab_hello title:Hello -->
 * This is hello.
 * <!-- endtab -->
 * <!-- tab id:tab_info 'icon:fas fa-info' 'title:Info Tab' -->This is info.<!-- endtab -->
 * {% endtabs %}
 */
module.exports = function (hexo) {
  function splitTabOptions(s) {
    const options = [];
    const EOL = -1;

    let i = 0;
    let state = 1;
    let begin = 0;

    while (i <= s.length) {
      const c = i < s.length ? s.charAt(i) : '';
      switch (state) {
        case 1:
          if (c === ' ') {
            state = 1;
            begin = i + 1;
          } else if (c === '"') {
            state = 2;
            begin = i + 1;
          } else if (c === "'") {
            state = 4;
            begin = i + 1;
          } else if (c === '') {
            state = EOL;
          } else {
            state = 7;
          }
          break;
        case 2:
          if (c === '\\') {
            state = 3;
          } else if (c === '"') {
            state = 6;
          }
          break;
        case 3:
          state = 2;
          break;
        case 4:
          if (c === '\\') {
            state = 5;
          } else if (c === "'") {
            state = 6;
          }
          break;
        case 5:
          state = 4;
          break;
        case 6:
          options.push(s.substring(begin, i - 1));
          begin = i + 1;
          if (c === ' ') {
            state = 1;
          } else if (c === '') {
            state = EOL;
          } else {
            throw new Error(`malformatted tab options: ${s}`);
          }
          break;
        case 7:
          if (c === ' ') {
            options.push(s.substring(begin, i));
            begin = i + 1;
            state = 1;
          } else if (c === '') {
            options.push(s.substring(begin, i));
            begin = i + 1;
            state = EOL;
          }
          break;
      }
      i++;
    }

    if (state !== EOL) {
      throw new Error(`malformatted tab options: ${s}`);
    }

    return options;
  }

  function processTag(options, content) {
    let classes = '';

    for (const option of options) {
      const [key, value] = option.split(':');
      switch (key) {
        case 'align':
          classes += ` is-${value}`;
          break;
        case 'size':
          classes += ` is-${value}`;
          break;
        case 'style':
          if (value === 'toggle-rounded') {
            classes += ' is-toggle';
          }
          classes += ` is-${value}`;
          break;
      }
    }

    const pattern = /<!--\s*tab\s*(.*?)\s*-->([\s\S]*?)<!--\s*endtab\s*-->/g;

    let match;
    let tabElements = '';
    let contentElements = '';

    while ((match = pattern.exec(content)) !== null) {
      const [, tabOptions, tabContent] = match;

      let id = 'tab-' + Date.now() + ((Math.random() * 1000) | 0);
      let icon = '';
      let title = '';
      let active = false;

      for (const option of splitTabOptions(tabOptions)) {
        const [key, value] = option.split(':');
        switch (key) {
          case 'id':
            id = value;
            break;
          case 'active':
            active = true;
            break;
          case 'icon':
            icon = `<span class="icon is-small ml-0">
                <i class="${value}" aria-hidden="true"></i>
            </span>`;
            break;
          case 'title':
            title = value;
            break;
        }
      }

      tabElements += `<li${active ? ' class="is-active"' : ''}>
          <a href="#${id}">
              ${hexo.render.renderSync({ text: icon + title, engine: 'markdown' })}
          </a>
      </li>`;

      contentElements += `<div id="${id}" class="tab-content${active ? '' : ' is-hidden'}">
          ${hexo.render.renderSync({ text: tabContent, engine: 'markdown' })}
      </div>`;
    }

    return `<div class="tabs my-3${classes}">
        <ul class="mx-0 my-0">
            ${tabElements}
        </ul>
    </div>
    ${contentElements}`;
  }

  const script = `<script>
  (function () {
      function switchTab() {
          if (!location.hash) {
            return;
          }

          const id = '#' + CSS.escape(location.hash.substring(1));
          const $tabMenu = document.querySelector(\`.tabs a[href="\${id}"]\`);
          if (!$tabMenu) {
            return;
          }

          const $tabMenuContainer = $tabMenu.parentElement.parentElement;
          Array.from($tabMenuContainer.children).forEach($menu => $menu.classList.remove('is-active'));
          Array.from($tabMenuContainer.querySelectorAll('a'))
              .map($menu => document.getElementById($menu.getAttribute("href").substring(1)))
              .forEach($content => $content.classList.add('is-hidden'));

          if ($tabMenu) {
              $tabMenu.parentElement.classList.add('is-active');
          }
          const $activeTab = document.querySelector(id);
          if ($activeTab) {
              $activeTab.classList.remove('is-hidden');
          }
      }
      switchTab();
      window.addEventListener('hashchange', switchTab, false);
  })();
  </script>`;

  hexo.extend.injector.register('head_end', script);
  hexo.extend.tag.register('tabs', processTag, { ends: true });
};
