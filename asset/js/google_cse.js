/* global google */
(function (document, $) {
  function debounce(func, wait, immediate) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  let opener = null;

  function open() {
    const $main = $('.searchbox');
    if (!$main.hasClass('show')) {
      opener = document.activeElement;
      $main.addClass('show');
    }
    $main.find('.searchbox-input').focus();
  }

  // Return the focus to the element that opened the search box, unless it moved elsewhere
  function close(restoreFocus = true) {
    $('.searchbox').removeClass('show');
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
      const main = $('.searchbox')[0];
      if (main && $(main).hasClass('show') && !main.contains(e.target)) {
        close(false);
      }
    })
    .on('keydown', (e) => {
      if (isSearchShortcut(e)) {
        e.preventDefault();
        open();
      } else if (e.keyCode === 27 && $('.searchbox').hasClass('show')) {
        close();
      }
    })
    .on(
      'keydown',
      '.searchbox-input',
      debounce(function () {
        const value = $(this).val();
        try {
          const element = google.search.cse.element.getElement('searchresults-only0');
          if (value.trim() === '') {
            element.clearAllResults();
          } else {
            element.execute(value);
          }
        } catch (e) {}
      }, 300),
    );
})(document, jQuery);
