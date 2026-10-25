/* global google */
(function (document, $) {
  const controller = window.loadSearchbox($('.searchbox'), {
    onDestroy: () => $(document).off('.googleSearch'),
  });
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

  $(document).on(
    'input.googleSearch',
    '.searchbox-input',
    debounce(function () {
      if (!controller.isCurrent()) return;
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
