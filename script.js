document.getElementById('year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

const usd = value => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(value);
const decimal = value => new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(value);
const svgNode = (name, attributes = {}) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
};

function renderResultCards(series) {
  const grid = document.getElementById('result-grid');
  grid.innerHTML = series.map(item => {
    const positive = item.net_pnl > 0;
    return `<article class="result-card reveal" style="--series-color:${item.color}">
      <div class="result-card-head"><span class="series-label"><i></i> LINHA ${item.id}</span><span class="status-pill ${positive ? 'positive' : ''}">${item.status}</span></div>
      <strong class="result-value">${usd(item.final_equity)}</strong><small>Saldo final simulado</small>
      <dl class="result-stats">
        <div><dt>Resultado líquido</dt><dd>${positive ? '+' : ''}${usd(item.net_pnl)}</dd></div>
        <div><dt>Profit factor</dt><dd>${decimal(item.profit_factor)}</dd></div>
        <div><dt>Operações</dt><dd>${item.trades.toLocaleString('pt-BR')}</dd></div>
        <div><dt>Acerto</dt><dd>${decimal(item.win_rate_pct)}%</dd></div>
        <div><dt>Expectativa</dt><dd>${decimal(item.expectancy_r)}R</dd></div>
        <div><dt>Janelas positivas</dt><dd>${item.positive_windows}/${item.total_windows}</dd></div>
        <div><dt>Drawdown máximo</dt><dd>${decimal(item.max_drawdown_r)}R</dd></div>
        <div><dt>Risco por entrada</dt><dd>1,00%</dd></div>
      </dl>
    </article>`;
  }).join('');
  grid.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

function renderChart(payload) {
  const svg = document.getElementById('equity-chart');
  const grid = document.getElementById('chart-grid');
  const lines = document.getElementById('chart-lines');
  const axis = document.getElementById('chart-axis');
  const pointer = document.getElementById('chart-pointer');
  const tooltip = document.getElementById('chart-tooltip');
  const bounds = { left: 64, right: 742, top: 20, bottom: 290 };
  const start = Date.parse(payload.period_start);
  const end = Date.parse(payload.period_end);
  const values = payload.series.flatMap(item => item.points.map(point => point.equity));
  const minValue = Math.floor(Math.min(...values) / 5000) * 5000;
  const maxValue = Math.ceil(Math.max(...values) / 25000) * 25000;
  const x = date => bounds.left + ((Date.parse(date) - start) / (end - start)) * (bounds.right - bounds.left);
  const y = value => bounds.bottom - ((value - minValue) / (maxValue - minValue)) * (bounds.bottom - bounds.top);

  for (let index = 0; index <= 4; index += 1) {
    const ypos = bounds.top + ((bounds.bottom - bounds.top) / 4) * index;
    grid.appendChild(svgNode('line', { x1: bounds.left, x2: bounds.right, y1: ypos, y2: ypos }));
    const value = maxValue - ((maxValue - minValue) / 4) * index;
    const label = svgNode('text', { x: bounds.left - 8, y: ypos + 4, 'text-anchor': 'end', class: 'chart-axis-label' });
    label.textContent = value >= 1000 ? `US$ ${Math.round(value / 1000)}k` : `US$ ${value}`;
    axis.appendChild(label);
  }
  [payload.period_start, '2024-09-01', '2025-09-01', payload.period_end].forEach((date, index) => {
    const xpos = x(date);
    grid.appendChild(svgNode('line', { x1: xpos, x2: xpos, y1: bounds.top, y2: bounds.bottom }));
    const label = svgNode('text', { x: xpos, y: 312, 'text-anchor': index === 0 ? 'start' : index === 3 ? 'end' : 'middle', class: 'chart-axis-label' });
    label.textContent = date.slice(0, 4);
    axis.appendChild(label);
  });

  payload.series.forEach(item => {
    const pathData = item.points.map((point, index) => `${index ? 'L' : 'M'}${x(point.date).toFixed(2)},${y(point.equity).toFixed(2)}`).join(' ');
    lines.appendChild(svgNode('path', { d: pathData, class: 'equity-line', stroke: item.color }));
    const hit = svgNode('path', { d: pathData, class: 'equity-hit', 'data-series': item.id });
    hit.addEventListener('pointermove', event => {
      const rect = svg.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * 760;
      const timestamp = start + ((svgX - bounds.left) / (bounds.right - bounds.left)) * (end - start);
      const nearest = item.points.reduce((best, point) => Math.abs(Date.parse(point.date) - timestamp) < Math.abs(Date.parse(best.date) - timestamp) ? point : best);
      const pointX = x(nearest.date);
      const pointY = y(nearest.equity);
      pointer.setAttribute('x1', pointX);
      pointer.setAttribute('x2', pointX);
      pointer.hidden = false;
      tooltip.innerHTML = `LINHA ${item.id} · ${new Date(nearest.date).toLocaleDateString('pt-BR')}<strong>${usd(nearest.equity)}</strong>`;
      tooltip.style.left = `${(pointX / 760) * 100}%`;
      tooltip.style.top = `${(pointY / 330) * 100}%`;
      tooltip.hidden = false;
    });
    hit.addEventListener('pointerleave', () => {
      pointer.hidden = true;
      tooltip.hidden = true;
    });
    lines.appendChild(hit);
  });

  document.getElementById('chart-legend').innerHTML = payload.series.map(item => `<span><i style="background:${item.color}"></i> Linha ${item.id} · ${usd(item.final_equity)}</span>`).join('');
  document.getElementById('best-equity').textContent = usd(Math.max(...payload.series.map(item => item.final_equity)));
}

fetch('/data/backtest-proof.json?v=2')
  .then(response => {
    if (!response.ok) throw new Error('Falha ao carregar evidências.');
    return response.json();
  })
  .then(payload => {
    renderChart(payload);
    renderResultCards(payload.series);
  })
  .catch(error => {
    document.getElementById('result-grid').innerHTML = `<p class="loading">${error.message}</p>`;
    document.getElementById('best-equity').textContent = 'Indisponível';
  });
