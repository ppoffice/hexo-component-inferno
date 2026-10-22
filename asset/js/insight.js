/**
 * Insight search plugin
 * @author PPOffice { @link https://github.com/ppoffice }
 */
// eslint-disable-next-line no-unused-vars
function loadInsight(config, translation) {
  const $main = $('.searchbox');
  const $input = $main.find('.searchbox-input');
  const $container = $main.find('.searchbox-body');

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

  function parseKeywords(keywords) {
    return keywords
      .split(' ')
      .filter((keyword) => {
        return !!keyword;
      })
      .map((keyword) => {
        return keyword.toLowerCase();
      });
  }

  /**
   * Judge if a given post/page/category/tag contains all of the keywords.
   * @param Object            obj     Object to be weighted
   * @param Array<String>     fields  Object's fields to find matches
   */
  function filter(keywords, obj, fields) {
    const keywordArray = parseKeywords(keywords);
    const containKeywords = keywordArray.filter((keyword) => {
      const containFields = fields.filter((field) => {
        if (!Object.prototype.hasOwnProperty.call(obj, field)) {
          return false;
        }
        if (obj[field].toLowerCase().indexOf(keyword) > -1) {
          return true;
        }
        return false;
      });
      if (containFields.length > 0) {
        return true;
      }
      return false;
    });
    return containKeywords.length === keywordArray.length;
  }

  function filterFactory(keywords) {
    return {
      post: function (obj) {
        return filter(keywords, obj, ['title', 'text']);
      },
      page: function (obj) {
        return filter(keywords, obj, ['title', 'text']);
      },
      category: function (obj) {
        return filter(keywords, obj, ['name', 'slug']);
      },
      tag: function (obj) {
        return filter(keywords, obj, ['name', 'slug']);
      },
    };
  }

  /**
   * Calculate the weight of a matched post/page/category/tag.
   * @param Object            obj     Object to be weighted
   * @param Array<String>     fields  Object's fields to find matches
   * @param Array<Integer>    weights Weight of every field
   */
  function weight(keywords, obj, fields, weights) {
    let value = 0;
    parseKeywords(keywords).forEach((keyword) => {
      fields.forEach((field, index) => {
        if (Object.prototype.hasOwnProperty.call(obj, field)) {
          value += countMatches(obj[field].toLowerCase(), keyword) * weights[index];
        }
      });
    });
    return value;
  }

  // Count the occurrences of a lowercase keyword, which is plain text, not a regular expression
  function countMatches(text, keyword) {
    let count = 0;
    for (let i = text.indexOf(keyword); i !== -1; i = text.indexOf(keyword, i + keyword.length)) {
      count++;
    }
    return count;
  }

  function weightFactory(keywords) {
    return {
      post: function (obj) {
        return weight(keywords, obj, ['title', 'text'], [3, 1]);
      },
      page: function (obj) {
        return weight(keywords, obj, ['title', 'text'], [3, 1]);
      },
      category: function (obj) {
        return weight(keywords, obj, ['name', 'slug'], [1, 1]);
      },
      tag: function (obj) {
        return weight(keywords, obj, ['name', 'slug'], [1, 1]);
      },
    };
  }

  // Weigh each matching item once, instead of in every comparison of the sort
  function topItems(items, filter, weigh) {
    return items
      .filter(filter)
      .map((item) => {
        return { item, weight: weigh(item) };
      })
      .sort((a, b) => {
        return b.weight - a.weight;
      })
      .slice(0, 5)
      .map((result) => {
        return result.item;
      });
  }

  function search(json, keywords) {
    const weights = weightFactory(keywords);
    const filters = filterFactory(keywords);
    return {
      posts: topItems(json.posts, filters.post, weights.post),
      pages: topItems(json.pages, filters.page, weights.page),
      categories: topItems(json.categories, filters.category, weights.category),
      tags: topItems(json.tags, filters.tag, weights.tag),
    };
  }

  function searchResultToDOM(keywords, searchResult) {
    $container.empty();
    for (const key in searchResult) {
      $container.append(
        sectionFactory(parseKeywords(keywords), key.toUpperCase(), searchResult[key]),
      );
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

  let opener = null;

  function open() {
    if (!$main.hasClass('show')) {
      opener = document.activeElement;
      $main.addClass('show');
    }
    $input.focus();
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

  function gotoLink($item) {
    if ($item && $item.length) {
      location.href = $item.attr('href');
    }
  }

  $.getJSON(config.contentUrl, (json) => {
    if (location.hash.trim() === '#insight-search') {
      $main.addClass('show');
    }
    $input.on('input', function () {
      const keywords = $(this).val();
      searchResultToDOM(keywords, search(json, keywords));
    });
    $input.trigger('input');
  });

  let touch = false;
  $(document)
    .on('click', '.navbar-main .search', open)
    .on('click touchend', '.searchbox-result-item', function (e) {
      if (e.type !== 'click' && !touch) {
        return;
      }
      gotoLink($(this));
      touch = false;
    })
    .on('click touchend', '.searchbox-close', (e) => {
      if (e.type !== 'click' && !touch) {
        return;
      }
      $('.navbar-main').css('pointer-events', 'none');
      setTimeout(() => {
        $('.navbar-main').css('pointer-events', 'auto');
      }, 400);
      close();
      touch = false;
    })
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
        return;
      }
      if (!$main.hasClass('show')) return;
      switch (e.keyCode) {
        case 27: // ESC
          close();
          break;
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
    })
    .on('touchstart', (e) => {
      touch = true;
    })
    .on('touchmove', (e) => {
      touch = false;
    });
}
