/* global instantsearch, algoliasearch */
// eslint-disable-next-line no-unused-vars
function loadAlgolia(config, translation) {
  const search = instantsearch({
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
          return translation.no_result + ': ' + results.query;
        },
        item: function (hit) {
          let title = instantsearch.highlight({ attribute: 'title', hit });
          let excerpt = instantsearch.highlight({ attribute: config.excerpt, hit });
          title = title ? title : translation.untitled;
          excerpt = excerpt
            .replace(new RegExp('<em>', 'ig'), '[algolia-highlight]')
            .replace(new RegExp('</em>', 'ig'), '[/algolia-highlight]')
            .replace(/(<([^>]+)>)/gi, '')
            .replace(/(\[algolia-highlight\])/gi, '<em>')
            .replace(/(\[\/algolia-highlight\])/gi, '</em>');
          excerpt = excerpt ? excerpt : translation.empty_preview;
          return `<section class="searchbox-result-section">
                        <a class="searchbox-result-item" href="${hit.permalink}">
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

  const $main = $('.searchbox');
  let opener = null;

  function open() {
    if (!$main.hasClass('show')) {
      opener = document.activeElement;
      $main.addClass('show');
    }
    $main.find('.searchbox-input').focus();
  }

  // Return the focus to the element that opened the search box, unless it moved elsewhere
  function close(restoreFocus = true) {
    $main.removeClass('show');
    if (restoreFocus && opener && document.contains(opener)) {
      opener.focus();
    }
    opener = null;
  }

  // Open the search box with "/" (unless typing in a field) or Ctrl/Cmd+K
  function isSearchShortcut(e) {
    if (e.altKey) {
      return false;
    }
    if (e.ctrlKey || e.metaKey) {
      return !e.shiftKey && typeof e.key === 'string' && e.key.toLowerCase() === 'k';
    }
    // e.key is "/" whatever keys type it on the keyboard layout, so do not check e.shiftKey
    const target = e.target;
    const typing = target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName);
    return e.key === '/' && !typing;
  }

  $(document)
    .on('click', '.navbar-main .search', open)
    .on('click', '.searchbox .searchbox-mask', () => close())
    .on('click', '.searchbox-close', () => close())
    .on('focusin', (e) => {
      // Close the search box when the focus moves to the rest of the page, e.g., by Tab
      if ($main.hasClass('show') && !$main[0].contains(e.target)) {
        close(false);
      }
    })
    .on('keydown', (e) => {
      if (isSearchShortcut(e)) {
        e.preventDefault();
        open();
      } else if (e.keyCode === 27 && $main.hasClass('show')) {
        close();
      }
    });
}
