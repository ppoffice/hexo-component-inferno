/**
 * Insight search plugin
 * @author PPOffice { @link https://github.com/ppoffice }
 */
// eslint-disable-next-line no-unused-vars
function loadInsight(config, translation) {
  const search = window.searchInsight;
  const $main = $('.searchbox');
  let $input, $container;
  const controller = window.loadSearchbox($main, {
    touch: true,
    onDestroy: () => {
      $(document).off('.insightSearch');
      $input.off('.insightSearch');
    },
    onKeyDown: (e) => {
      switch (e.keyCode) {
        case 38: // UP
          selectItemByDiff(-1);
          break;
        case 40: // DOWN
          selectItemByDiff(1);
          break;
        case 13: // ENTER
          gotoLink($container.find('.searchbox-result-item.active').eq(0));
          break;
      }
    },
  });

  // Replacing the controller disposes the previous engine, which may remove its input widget.
  // Both search views keep this header container; Insight owns a plain text input inside it.
  $input = $main.find('.searchbox-input');
  if (!$input.length) {
    $input = $('<input>').attr({
      type: 'text',
      class: 'searchbox-input',
      placeholder: translation.hint,
    });
    $main.find('.searchbox-header .searchbox-input-container').first().append($input);
  }
  $container = $main.find('.searchbox-body');
  if ($main.hasClass('show')) $input.focus();

  function section(title) {
    return $('<section>').addClass('searchbox-result-section').append($('<header>').text(title));
  }

  function merge(ranges) {
    let last;
    const result = [];

    ranges.forEach((r) => {
      if (!last || r[0] > last[1]) {
        result.push((last = r));
      } else if (r[1] > last[1]) {
        last[1] = r[1];
      }
    });

    return result;
  }

  // The search content is plain text, so escape it before showing it as HTML
  function escapeHTML(text) {
    return text.replace(/[&<>"']/g, (char) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function findAndHighlight(text, matches, maxlen) {
    if (!text) {
      return text;
    }
    if (!Array.isArray(matches) || !matches.length) {
      return escapeHTML(maxlen ? text.slice(0, maxlen) : text);
    }
    const indices = matches
      .map((match) => {
        // Match the original text case-insensitively, as the lowercase of some characters, such as
        // "İ", is longer, and its indices would not fit the original text
        const found = match ? new RegExp(escapeRegExp(match), 'i').exec(text) : null;
        if (!found) {
          return null;
        }
        return [found.index, found.index + found[0].length];
      })
      .filter((match) => {
        return match !== null;
      })
      .sort((a, b) => {
        return a[0] - b[0] || a[1] - b[1];
      });

    if (!indices.length) {
      return escapeHTML(maxlen ? text.slice(0, maxlen) : text);
    }

    let result = '';
    let last = 0;
    const ranges = merge(indices);
    const sumRange = [ranges[0][0], ranges[ranges.length - 1][1]];
    if (maxlen && maxlen < sumRange[1]) {
      last = sumRange[0];
    }

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      result += escapeHTML(
        text.slice(last, maxlen ? Math.min(range[0], sumRange[0] + maxlen) : range[0]),
      );
      if (maxlen && range[0] >= sumRange[0] + maxlen) {
        break;
      }
      result += '<em>' + escapeHTML(text.slice(range[0], range[1])) + '</em>';
      last = range[1];
      if (i === ranges.length - 1) {
        if (maxlen) {
          result += escapeHTML(
            text.slice(range[1], Math.min(text.length, sumRange[0] + maxlen + 1)),
          );
        } else {
          result += escapeHTML(text.slice(range[1]));
        }
      }
    }

    return result;
  }

  function searchItem(icon, title, slug, preview, url) {
    title = title != null && title !== '' ? title : escapeHTML(translation.untitled);
    const subtitle = slug
      ? '<span class="searchbox-result-title-secondary">(' + slug + ')</span>'
      : '';

    return `<a class="searchbox-result-item" href="${escapeHTML(url)}">
            <span class="searchbox-result-icon">
                <i class="fa fa-${icon}"></i>
            </span>
            <span class="searchbox-result-content">
                <span class="searchbox-result-title">
                    ${title}
                    ${subtitle}
                </span>
                ${preview ? '<span class="searchbox-result-preview">' + preview + '</span>' : ''}
            </span>
        </a>`;
  }

  function sectionFactory(keywords, type, array) {
    let $searchItems;
    if (array.length === 0) return null;
    const sectionTitle = translation[type.toLowerCase()];
    switch (type) {
      case 'POSTS':
      case 'PAGES':
        $searchItems = array.map((item) => {
          const title = findAndHighlight(item.title, keywords);
          const text = findAndHighlight(item.text, keywords, 100);
          return searchItem('file', title, null, text, item.link);
        });
        break;
      case 'CATEGORIES':
      case 'TAGS':
        $searchItems = array.map((item) => {
          const name = findAndHighlight(item.name, keywords);
          const slug = findAndHighlight(item.slug, keywords);
          return searchItem(type === 'CATEGORIES' ? 'folder' : 'tag', name, slug, null, item.link);
        });
        break;
      default:
        return null;
    }
    return section(sectionTitle).append($searchItems);
  }

  function searchResultToDOM(keywords, searchResult) {
    $container.empty();
    for (const key in searchResult) {
      $container.append(sectionFactory(keywords, key.toUpperCase(), searchResult[key]));
    }
  }

  function scrollTo($item) {
    if ($item.length === 0) return;
    const wrapperHeight = $container[0].clientHeight;
    const itemTop = $item.position().top - $container.scrollTop();
    const itemBottom = $item[0].clientHeight + $item.position().top;
    if (itemBottom > wrapperHeight + $container.scrollTop()) {
      $container.scrollTop(itemBottom - $container[0].clientHeight);
    }
    if (itemTop < 0) {
      $container.scrollTop($item.position().top);
    }
  }

  function selectItemByDiff(value) {
    const $items = $.makeArray($container.find('.searchbox-result-item'));
    let prevPosition = -1;
    $items.forEach((item, index) => {
      if ($(item).hasClass('active')) {
        prevPosition = index;
      }
    });
    const nextPosition = ($items.length + prevPosition + value) % $items.length;
    $($items[prevPosition]).removeClass('active');
    $($items[nextPosition]).addClass('active');
    scrollTo($($items[nextPosition]));
  }

  function gotoLink($item) {
    if ($item && $item.length) {
      location.href = $item.attr('href');
    }
  }

  $.getJSON(config.contentUrl, (json) => {
    if (!controller.isCurrent()) return;
    if (location.hash.trim() === '#insight-search') {
      $main.addClass('show');
    }
    $input.on('input.insightSearch', function () {
      const result = search(json, $(this).val());
      searchResultToDOM(result.keywords, result.results);
    });
    $input.trigger('input');
  });

  let touch = false;
  $(document)
    .on('click.insightSearch touchend.insightSearch', '.searchbox-result-item', function (e) {
      if (!controller.isCurrent()) return;
      if (e.type !== 'click' && !touch) {
        return;
      }
      gotoLink($(this));
      touch = false;
    })
    .on('touchstart.insightSearch', () => {
      touch = true;
    })
    .on('touchmove.insightSearch', () => {
      touch = false;
    });
}
