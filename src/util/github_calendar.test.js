const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { renderToStaticMarkup } = require('inferno-server');
const { createElement } = require('inferno-create-element');
const GithubCalendar = require('../view/widget/github_calendar');

test('Asset generator exports the calendar script and base styles', () => {
  let generator;
  require('../hexo/generator/assets')({
    theme_dir: path.resolve(__dirname, '../../fixture/site/themes/test'),
    extend: {
      generator: {
        register: (name, fn) => {
          generator = fn;
        },
      },
    },
  });
  const assets = generator({});
  for (const file of ['/js/github-calendar.js', '/css/github-calendar.css']) {
    expect(assets.find((asset) => asset.path === file).data).toBe(
      fs.readFileSync(path.resolve(__dirname, '../../asset' + file), 'utf8'),
    );
  }
});

const end = Date.parse('2026-10-24T00:00:00Z');
const contributions = Array.from({ length: 371 }, (_, i) => ({
  date: new Date(end - (370 - i) * 86400000).toISOString().slice(0, 10),
  count: i % 5,
  level: i % 5,
}));

function setup(response = { contributions }) {
  const html = renderToStaticMarkup(
    createElement(GithubCalendar, {
      username: 'octocat',
      title: 'GitHub Contributions',
      loading: 'Loading',
      error: 'Failed',
    }),
  );
  const dom = new JSDOM('<html lang="en"><body>' + html + '</body></html>', {
    runScripts: 'outside-only',
  });
  const { window } = dom;
  const observers = [];
  window.AbortController = global.AbortController;
  window.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => response });
  window.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.disconnect = jest.fn();
      observers.push(this);
    }
    observe() {}
  };
  window.SVGElement.prototype.getComputedTextLength = function () {
    return this.textContent.length * 6;
  };
  const chart = window.document.querySelector('.github-calendar-chart');
  let width = 361;
  Object.defineProperty(chart, 'clientWidth', { get: () => width });
  window.eval(
    fs.readFileSync(path.resolve(__dirname, '../../asset/js/github-calendar.js'), 'utf8'),
  );
  const init = async () => {
    window.HexoGithubCalendar.init();
    await new Promise((resolve) => setImmediate(resolve));
  };
  return {
    window,
    chart,
    observers,
    init,
    close: () => window.close(),
    resize: (value) => {
      width = value;
      observers[observers.length - 1].callback();
    },
  };
}

test('Render recent weeks with full month labels and fixed-size cells', async () => {
  const env = setup();
  try {
    await env.init();
    expect([...env.chart.querySelectorAll('text')].map((node) => node.textContent)).toContain(
      'May',
    );
    expect(env.chart.querySelectorAll('rect[data-date^="2026-05-"]')).toHaveLength(31);
    expect(env.chart.querySelector('rect').getAttribute('width')).toBe('11');
    expect(env.chart.querySelector('rect[data-date="2026-10-24"]').getAttribute('y')).toBe('102');
    const count = env.chart.querySelectorAll('rect').length;
    env.resize(230);
    expect(env.chart.querySelectorAll('rect').length).toBeLessThan(count);
    expect(env.window.fetch).toHaveBeenCalledTimes(1);
    expect(env.chart.textContent).not.toContain('octocat');
  } finally {
    env.close();
  }
});

test('Reinitialization disconnects old observers and reuses the cached request', async () => {
  const env = setup();
  try {
    await env.init();
    await env.init();
    expect(env.observers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(env.window.fetch).toHaveBeenCalledTimes(1);
    expect(env.chart.querySelectorAll('svg')).toHaveLength(1);
  } finally {
    env.close();
  }
});

test('Invalid responses show a fallback and can be retried', async () => {
  const env = setup({ contributions: [] });
  try {
    await env.init();
    expect(env.chart.querySelector('[role="status"]').textContent).toBe('Failed');
    expect(env.chart.querySelector('.github-calendar-link').textContent).toBe(
      'GitHub Contributions',
    );
    env.window.fetch.mockResolvedValue({ ok: true, json: async () => ({ contributions }) });
    await env.init();
    expect(env.window.fetch).toHaveBeenCalledTimes(2);
    expect(env.chart.querySelectorAll('rect').length).toBeGreaterThan(0);
  } finally {
    env.close();
  }
});
