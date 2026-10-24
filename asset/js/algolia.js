/* global instantsearch */
// eslint-disable-next-line no-unused-vars
function loadAlgolia(config, translation) {
  const $main = $('.searchbox');
  let search = null;
  const controller = window.loadSearchbox($main, {
    onDestroy: () => {
      // Widget initialization can fail before start completes. Dispose only initialized indices.
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
    searchClient: window['algoliasearch/lite'].liteClient(config.applicationId, config.apiKey),
    // Preserve search-only behavior; do not enable automatic Insights tracking after upgrading.
    insights: false,
  });

  search.addWidgets([
    instantsearch.widgets.configure({
      attributesToSnippet: [config.excerpt],
    }),
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
    instantsearch.widgets.poweredBy({
      container: '#algolia-poweredby',
    }),
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
  ]);

  search.start();

  if (location.hash.trim() === '#algolia-search') {
    $('.searchbox').addClass('show');
  }
}
