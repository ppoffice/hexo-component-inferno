(function () {
  const DAY = 86400000;
  const CELL = 11;
  const GAP = 3;
  const NS = 'http://www.w3.org/2000/svg';
  const requests = new Map();
  let destroy = () => {};

  function load(username) {
    const cached = requests.get(username);
    if (cached && cached.expires > Date.now()) {
      return cached.promise;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const promise = fetch(
      'https://github-contributions-api.jogruber.de/v4/' + encodeURIComponent(username) + '?y=last',
      {
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Calendar request failed');
        }
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.contributions) || !data.contributions.length) {
          throw new Error('Missing contribution data');
        }
        return data.contributions
          .map((day) => {
            const time = Date.parse(day.date + 'T00:00:00Z');
            if (
              !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
              !Number.isFinite(time) ||
              !Number.isInteger(day.count) ||
              day.count < 0 ||
              !Number.isInteger(day.level) ||
              day.level < 0 ||
              day.level > 4
            ) {
              throw new Error('Invalid contribution data');
            }
            return { ...day, time };
          })
          .sort((a, b) => a.time - b.time);
      })
      .catch((error) => {
        requests.delete(username);
        throw error;
      })
      .finally(() => clearTimeout(timer));
    requests.set(username, { promise, expires: Date.now() + 3600000 });
    return promise;
  }

  function element(tag, attributes = {}, text) {
    const node = document.createElementNS(NS, tag);
    Object.keys(attributes).forEach((key) => node.setAttribute(key, attributes[key]));
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  }

  function draw(chart, days) {
    const width = chart.clientWidth;
    if (!width) {
      return;
    }
    const last = days[days.length - 1];
    const lastSunday = last.time - new Date(last.time).getUTCDay() * DAY;
    const firstSunday = days[0].time - new Date(days[0].time).getUTCDay() * DAY;
    const totalWeeks = Math.round((lastSunday - firstSunday) / (7 * DAY)) + 1;
    const weeks = Math.min(totalWeeks, Math.max(1, Math.floor((width + GAP) / (CELL + GAP))));
    const start = lastSunday - (weeks - 1) * 7 * DAY;
    const visible = days.filter((day) => day.time >= start);
    const locale = (document.documentElement.lang || 'en').replace(/^vn$/, 'vi');
    let monthFormat, dateFormat;
    try {
      monthFormat = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
      dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
    } catch (e) {
      monthFormat = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });
      dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });
    }
    const svg = element('svg', { width: weeks * (CELL + GAP) - GAP, height: 116, role: 'img' });
    const range = dateFormat.format(visible[0].time) + ' – ' + dateFormat.format(last.time);
    svg.setAttribute(
      'aria-label',
      chart.closest('.widget').querySelector('.menu-label').textContent + ': ' + range,
    );
    const monthLabels = [];
    let month = -1;
    visible.forEach((day) => {
      const week = Math.floor((day.time - start) / (7 * DAY));
      const x = week * (CELL + GAP);
      const date = new Date(day.time);
      if (date.getUTCMonth() !== month) {
        month = date.getUTCMonth();
        const label = element('text', { x, y: 10 }, monthFormat.format(date));
        svg.appendChild(label);
        monthLabels.push({
          label,
          x,
          partial: monthLabels.length === 0 && date.getUTCDate() !== 1,
        });
      }
      const rect = element('rect', {
        x,
        y: 18 + date.getUTCDay() * (CELL + GAP),
        width: CELL,
        height: CELL,
        rx: 2,
        'data-date': day.date,
        'data-level': day.level,
        class: 'github-calendar-level-' + day.level,
      });
      rect.appendChild(element('title', {}, dateFormat.format(date) + ': ' + day.count));
      svg.appendChild(rect);
    });
    chart.querySelector('.github-calendar-grid').replaceChildren(svg);
    // Measure in the document so labels use the actual theme font and locale. A partial
    // opening month must not suppress the next full month when both start in nearby weeks.
    let lastLabelEnd = -8;
    monthLabels.forEach(({ label, x, partial }, index) => {
      const end = x + label.getComputedTextLength();
      const next = monthLabels[index + 1];
      if (
        (partial && next && next.x < end + 8) ||
        x < lastLabelEnd + 8 ||
        end > Number(svg.getAttribute('width'))
      ) {
        label.remove();
      } else {
        lastLabelEnd = end;
      }
    });
  }

  window.HexoGithubCalendar = {
    init() {
      destroy();
      let active = true;
      const cleanups = [];
      destroy = () => {
        active = false;
        cleanups.forEach((cleanup) => cleanup());
      };
      document.querySelectorAll('.github-calendar-chart[data-username]').forEach((chart) => {
        const status = chart.querySelector('.github-calendar-status');
        load(chart.dataset.username)
          .then((days) => {
            if (!active || !chart.isConnected) {
              return;
            }
            status.hidden = true;
            draw(chart, days);
            if (typeof ResizeObserver !== 'undefined') {
              const observer = new ResizeObserver(() => draw(chart, days));
              observer.observe(chart);
              cleanups.push(() => observer.disconnect());
            } else {
              const resize = () => draw(chart, days);
              window.addEventListener('resize', resize);
              cleanups.push(() => window.removeEventListener('resize', resize));
            }
          })
          .catch(() => {
            if (active && chart.isConnected) {
              status.hidden = false;
              status.textContent = chart.dataset.error;
              chart.querySelector('.github-calendar-grid').textContent = chart
                .closest('.widget')
                .querySelector('.menu-label').textContent;
            }
          });
      });
    },
  };
})();
