/* global instantsearch, algoliasearch */
// eslint-disable-next-line no-unused-vars
function loadAlgolia(config, translation) {
  const $main = $('.searchbox');
  let search = null;
  const controller = window.loadSearchbox($main, {
    onDestroy: () => {
      // 4.3.1 mounts widgets before its first search, which can throw before started becomes true.
      // Its dispose() requires the index helper; a merely constructed instance has none.
      if (search && search.mainIndex.getHelper()) search.dispose();
    },
  });
  function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, (char) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  // Keep the <em> highlights of Algolia, and escape the rest, so that a record cannot add HTML. The
  // excerpt is indexed from HTML, so its tags are removed.
  function highlighted(html, stripTags) {
    html = html
      .replace(/<em>/gi, '[algolia-highlight]')
      .replace(/<\/em>/gi, '[/algolia-highlight]');
    if (stripTags) {
      html = html.replace(/<[^>]+>/g, '');
    }
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\[algolia-highlight\]/g, '<em>')
      .replace(/\[\/algolia-highlight\]/g, '</em>');
  }

  search = instantsearch({
    indexName: config.indexName,
    searchClient: algoliasearch(config.applicationId, config.apiKey),
  });

  search.addWidgets([
    instantsearch.widgets.configure({
      attributesToSnippet: [config.excerpt],
    }),
  ]);

  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#algolia-input',
      // Disposing removes the widget DOM, but callers may still hold its old input node.
      queryHook: (query, refine) => {
        if (controller.isCurrent()) refine(query);
      },
      placeholder: translation.hint,
      showReset: false,
      showSubmit: false,
      showLoadingIndicator: false,
      cssClasses: {
        root: 'searchbox-input-container',
        form: 'searchbox-input-container',
        input: 'searchbox-input',
      },
    }),
  );

  search.addWidget(
    instantsearch.widgets.poweredBy({
      container: '#algolia-poweredby',
    }),
  );

  search.addWidget(
    instantsearch.widgets.hits({
      container: '.searchbox-body',
      escapeHTML: false,
      cssClasses: {
        root: 'searchbox-result-container',
        emptyRoot: ['searchbox-result-item', 'disabled'],
      },
      templates: {
        empty: function (results) {
          return escapeHTML(translation.no_result + ': ' + results.query);
        },
        item: function (hit) {
          let title = instantsearch.highlight({ attribute: 'title', hit });
          let excerpt = instantsearch.highlight({ attribute: config.excerpt, hit });
          title = title ? highlighted(title, false) : escapeHTML(translation.untitled);
          excerpt = highlighted(excerpt, true);
          excerpt = excerpt ? excerpt : escapeHTML(translation.empty_preview);
          return `<section class="searchbox-result-section">
                        <a class="searchbox-result-item" href="${escapeHTML(hit.permalink)}">
                            <span class="searchbox-result-content">
                                <span class="searchbox-result-title">${title}</span>
                                <span class="searchbox-result-preview">${excerpt}</span>
                            </span>
                        </a>
                    </section>`;
        },
      },
    }),
  );

  search.addWidget(
    instantsearch.widgets.pagination({
      container: '.searchbox-footer',
      cssClasses: {
        list: 'searchbox-pagination',
        item: 'searchbox-pagination-item',
        link: 'searchbox-pagination-link',
        selectedItem: 'active',
        disabledItem: 'disabled',
      },
    }),
  );

  search.start();

  if (location.hash.trim() === '#algolia-search') {
    $('.searchbox').addClass('show');
  }
}
