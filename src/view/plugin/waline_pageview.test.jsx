/* eslint-env browser */
const { renderToString } = require('inferno-server');
const WalinePageview = require('./waline_pageview');

test('delayed pageview imports do not increment the page that PJAX has already left', async () => {
  const root = document.createElement('div');
  root.innerHTML = renderToString(
    <WalinePageview serverURL="https://views.example.com" jsUrl="/pageview.js" />,
  );
  const listeners = [];
  const addListener = jest
    .spyOn(document, 'addEventListener')
    .mockImplementation((name, handler) => {
      if (name === 'pjax:complete') listeners.push(handler);
    });
  const loads = [];
  const count = jest.fn(() => jest.fn());
  history.replaceState(null, '', '/old/');
  try {
    // eslint-disable-next-line no-new-func
    new Function('load', root.querySelector('script').textContent.replace('import(', 'load('))(
      () => new Promise((resolve) => loads.push(resolve)),
    );
    history.replaceState(null, '', '/new/');
    listeners[0]();
    // Returning to the same path before the first import resolves must not count it twice.
    history.replaceState(null, '', '/old/');
    listeners[0]();
    loads.forEach((resolve) => resolve({ pageviewCount: count }));
    await Promise.resolve();
    expect(count).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledWith({ serverURL: 'https://views.example.com', path: '/old/' });
  } finally {
    addListener.mockRestore();
    history.replaceState(null, '', '/');
  }
});
