/**
 * Inline installer shared by the search components. Keep it self-contained: components can be used
 * without the Hexo asset generator, and PJAX may execute this script more than once.
 * @module util/searchbox
 */
function installSearchbox(window) {
  if (window.loadSearchbox) return;

  const document = window.document;
  let current;
  window.loadSearchbox = function ($main, options) {
    const $ = window.jQuery;
    options = options || {};
    // Preserve focus state only when replacing the controller for the same open DOM element.
    let opener = current ? current.destroy($main[0]) : null;
    let touch = false;
    const $document = $(document);
    const namespace = '.hexoSearchbox';
    const controller = {
      isCurrent: function () {
        return current === controller && document.contains($main[0]);
      },
      destroy: function (nextMain) {
        if (current !== controller) return null;
        const nextOpener = nextMain === $main[0] && $main.hasClass('show') ? opener : null;
        $document.off(namespace);
        opener = null;
        current = null;
        if (options.onDestroy) options.onDestroy();
        return nextOpener;
      },
    };
    current = controller;

    function open() {
      if (!controller.isCurrent()) return;
      if (!$main.hasClass('show')) {
        opener = document.activeElement;
        $main.addClass('show');
      }
      $main.find('.searchbox-input').focus();
    }

    function close(restoreFocus) {
      $main.removeClass('show');
      if (restoreFocus !== false && opener && document.contains(opener)) opener.focus();
      opener = null;
    }

    function isSearchShortcut(e) {
      if (e.altKey) return false;
      if (e.ctrlKey || e.metaKey) {
        return !e.shiftKey && typeof e.key === 'string' && e.key.toLowerCase() === 'k';
      }
      // e.key already accounts for the keyboard layout (including Shift).
      const target = e.target;
      const typing = target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName);
      return e.key === '/' && !typing;
    }

    $document
      .on('click' + namespace, '.navbar-main .search', open)
      .on(
        'click' + namespace + (options.touch ? ' touchend' + namespace : ''),
        '.searchbox-close, .searchbox .searchbox-mask',
        (e) => {
          if (!controller.isCurrent()) return;
          if (e.type !== 'click' && !touch) return;
          if (options.touch) {
            $('.navbar-main').css('pointer-events', 'none');
            setTimeout(() => {
              $('.navbar-main').css('pointer-events', 'auto');
            }, 400);
          }
          close();
          touch = false;
        },
      )
      .on('focusin' + namespace, (e) => {
        if (controller.isCurrent() && $main.hasClass('show') && !$main[0].contains(e.target)) {
          close(false);
        }
      })
      .on('keydown' + namespace, (e) => {
        if (!controller.isCurrent()) return;
        if (isSearchShortcut(e)) {
          e.preventDefault();
          open();
          return;
        }
        if (!$main.hasClass('show')) return;
        if (e.keyCode === 27) close();
        else if (options.onKeyDown) options.onKeyDown(e);
      })
      .on('touchstart' + namespace, () => {
        touch = true;
      })
      .on('touchmove' + namespace, () => {
        touch = false;
      });

    return controller;
  };
}

module.exports = '(' + installSearchbox.toString() + ')(window);';
