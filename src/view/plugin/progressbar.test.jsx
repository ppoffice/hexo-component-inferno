/* eslint-env browser */
const { renderToString } = require('inferno-server');
const ProgressBar = require('./progressbar');

let starts, stops, listenerSpy;

beforeEach(() => {
  starts = jest.fn();
  stops = jest.fn();
  window.Pace = { restart: starts, stop: stops };
  window.paceOptions = { minTime: 100 };
  listenerSpy = jest.spyOn(document, 'addEventListener');
  document.body.innerHTML = renderToString(<ProgressBar jsUrl="/pace.js" />);
  // eslint-disable-next-line no-eval
  window.eval(document.querySelector('script:not([src])').textContent);
});

afterEach(() => {
  listenerSpy.mock.calls.forEach(([event, listener]) => {
    if (event.startsWith('pjax:')) document.removeEventListener(event, listener);
  });
  listenerSpy.mockRestore();
  delete window.Pace;
  delete window.paceOptions;
  document.body.innerHTML = '';
});

test('scroll-state updates and background requests do not automatically restart progress', () => {
  expect(window.paceOptions).toMatchObject({
    minTime: 100,
    restartOnPushState: false,
    restartOnRequestAfter: false,
  });
  const scripts = [...document.scripts];
  expect(scripts[0].src).toBe('');
  expect(scripts[1].getAttribute('src')).toBe('/pace.js');
  history.replaceState(history.state, '', location.href);
  window.dispatchEvent(new Event('scroll'));
  expect(starts).not.toHaveBeenCalled();
});

test('PJAX starts progress but completion leaves native minimum display time intact', () => {
  document.dispatchEvent(new Event('pjax:send'));
  expect(starts).toHaveBeenCalledTimes(1);
  document.dispatchEvent(new Event('pjax:complete'));
  expect(stops).not.toHaveBeenCalled();
});
