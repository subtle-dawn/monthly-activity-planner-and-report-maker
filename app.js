(() => {
  'use strict';
  const KEY = 'monthly-activity-maker-v1';
  const row = (name, actual = '', target = '', unit = '', type = 'number', checked = false) => ({ name, actual, target, unit, type, checked });
  const currentYear = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Tokyo' }).format(new Date());
  const initial = { year: currentYear, month: '11月', mode: 'report', sections: [
    { title: '仕事', items: [row('Skeb', '10', '14', '件')] },
    { title: '勉強', items: [row('Coloso.', '20', '20', '授業'), row('AI美大', '20', '20', '課題')] },
    { title: '趣味', items: [row('落書き', '25', '20', '枚'), row('上風学園 本編', '', '', '第4話 プロット', 'check'), row('スリムトゥーンの描き方', '', '', '服', 'check'), row('漢字しりとり絵', '', '', '辞書確認中絵', 'check'), row('Vtuber', '', '', 'リボンの描き方２', 'check'), row('魔境アパート トレーラー', '1', '2', 'カット')] }
  ] };
  const valid = x => x && typeof x.month === 'string' && ['goal', 'report'].includes(x.mode) && Array.isArray(x.sections) && x.sections.length <= 50 && x.month.length <= 24 && x.sections.every(s => s && typeof s.title === 'string' && s.title.length <= 60 && Array.isArray(s.items) && s.items.length <= 100 && s.items.every(i => i && ['number', 'check'].includes(i.type) && ['name', 'actual', 'target', 'unit'].every(k => typeof i[k] === 'string' && i[k].length <= 120) && typeof i.checked === 'boolean'));
  let state = structuredClone(initial);
  const validYear = data => data.year === undefined || (typeof data.year === 'string' && /^(?:[1-9]\d{0,3})?$/.test(data.year));
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (valid(saved) && validYear(saved)) state = { ...saved, year: saved.year ?? currentYear }; } catch {}
  const $ = id => document.getElementById(id);
  function isBelowTarget(item) {
    const actual = Number(item.actual);
    const target = Number(item.target);
    return item.type === 'number' && item.actual.trim() !== '' && item.target.trim() !== ''
      && Number.isFinite(actual) && Number.isFinite(target) && actual < target;
  }
  function updateActualColors() {
    document.querySelectorAll('.activity-row').forEach(line => {
      line.classList.toggle('below-target', isBelowTarget(line.activityItem));
    });
  }
  function updateMode() {
    state.mode = state.sections.some(section => section.items.some(item =>
      item.type === 'check' ? item.checked : item.actual.trim() !== ''
    )) ? 'report' : 'goal';
    $('mode-label').textContent = state.mode === 'report' ? '報告' : '目標';
  }
  function save() {
    updateMode();
    updateActualColors();
    try { localStorage.setItem(KEY, JSON.stringify(state)); $('message').textContent = ''; }
    catch { $('message').textContent = '自動保存できません。データを書き出してください'; }
  }
  function input(value, placeholder, onInput, options = {}) {
    const el = document.createElement('input');
    el.type = 'text'; el.value = value; el.placeholder = placeholder; el.maxLength = 120;
    el.setAttribute('aria-label', placeholder);
    Object.assign(el, options);
    el.addEventListener('input', () => { onInput(el.value); save(); });
    return el;
  }
  function button(text, className, label, action) {
    const el = document.createElement('button'); el.type = 'button'; el.textContent = text; el.className = className;
    el.setAttribute('aria-label', label); el.addEventListener('click', action); return el;
  }
  function dragHandle(node, container, selector, label, commit) {
    const handle = button('≡', 'drag-handle', `${label}を並び替え（上下キーでも移動できます）`, () => {});
    handle.title = 'ドラッグして並び替え';
    let drag = null;
    const siblings = () => [...container.children].filter(el => el.matches(selector));
    function moveAt(y) {
      const others = siblings().filter(el => el !== node);
      const next = others.find(el => {
        const rect = el.getBoundingClientRect();
        return y < rect.top + rect.height / 2;
      });
      const anchor = next || (others.length ? others.at(-1).nextSibling : node.nextSibling);
      if (anchor !== node && anchor !== node.nextSibling) {
        container.insertBefore(node, anchor);
        if (drag) handle.setPointerCapture(drag.id);
      }
    }
    function scroll() {
      if (!drag?.active) return;
      const edge = 64;
      const amount = drag.y < edge ? -12 : drag.y > window.innerHeight - edge ? 12 : 0;
      if (amount) { window.scrollBy(0, amount); moveAt(drag.y); }
      drag.frame = requestAnimationFrame(scroll);
    }
    function finish(event, cancelled = false) {
      if (!drag || event.pointerId !== drag.id) return;
      const active = drag.active;
      cancelAnimationFrame(drag.frame);
      drag = null;
      node.classList.remove('is-dragging');
      document.body.classList.remove('is-sorting');
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      if (!active) return;
      if (!cancelled) { commit(siblings()); save(); }
      render();
    }
    handle.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      handle.focus();
      drag = { id: event.pointerId, startY: event.clientY, y: event.clientY, active: false };
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      drag.y = event.clientY;
      if (!drag.active && Math.abs(drag.y - drag.startY) < 5) return;
      if (!drag.active) {
        drag.active = true;
        node.classList.add('is-dragging');
        document.body.classList.add('is-sorting');
        drag.frame = requestAnimationFrame(scroll);
      }
      moveAt(drag.y);
    });
    handle.addEventListener('pointerup', event => finish(event));
    handle.addEventListener('pointercancel', event => finish(event, true));
    handle.addEventListener('lostpointercapture', event => finish(event, true));
    handle.addEventListener('keydown', event => {
      if (event.key === 'Escape' && drag) { finish({ pointerId: drag.id }, true); return; }
      if (!['ArrowUp', 'ArrowDown'].includes(event.key) || drag) return;
      event.preventDefault();
      const list = siblings();
      const index = list.indexOf(node);
      const nextIndex = index + (event.key === 'ArrowUp' ? -1 : 1);
      if (nextIndex < 0 || nextIndex >= list.length) return;
      const target = list[nextIndex];
      container.insertBefore(node, event.key === 'ArrowUp' ? target : target.nextSibling);
      const parentSection = node.closest('.category')?.activitySection;
      commit(siblings()); save(); render();
      const handles = selector === '.category'
        ? $('sections').querySelectorAll('.category-header > .drag-handle')
        : [...$('sections').children].find(card => card.activitySection === parentSection)?.querySelectorAll('.activity-row > .drag-handle');
      handles?.[nextIndex]?.focus();
    });
    return handle;
  }
  function render() {
    updateMode();
    $('year').value = state.year;
    $('month').replaceChildren();
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    // 以前保存した独自の月表記も読み込み時に保持する。
    if (!months.includes(state.month)) months.unshift(state.month);
    months.forEach(month => {
      const option = document.createElement('option'); option.value = month; option.textContent = month.replace(/月$/, '');
      $('month').append(option);
    });
    $('month').value = state.month;
    $('sections').replaceChildren();
    state.sections.forEach((section, si) => {
      const card = document.createElement('div'); card.className = 'panel category';
      card.activitySection = section;
      const header = document.createElement('div'); header.className = 'category-header';
      header.append(dragHandle(card, $('sections'), '.category', '見出しグループ', cards => {
        state.sections = cards.map(el => el.activitySection);
      }));
      header.append(input(section.title, '見出し', v => section.title = v, { maxLength: 60 }), button('×', 'icon-button', `${section.title}の見出しを削除`, () => {
        if (section.items.length && !confirm(`「${section.title}」と、その中の${section.items.length}項目を削除しますか？`)) return;
        state.sections.splice(si, 1); save(); render();
      }));
      card.append(header);
      section.items.forEach((item, ii) => {
        const line = document.createElement('div'); line.className = `activity-row${item.type === 'check' ? ' check-row' : ''}`;
        line.activityItem = item;
        line.append(dragHandle(line, card, '.activity-row', '項目', lines => {
          section.items = lines.map(el => el.activityItem);
        }));
        const select = document.createElement('select'); select.setAttribute('aria-label', '項目の形式');
        [['number', '数値'], ['check', 'チェック']].forEach(([value, name]) => { const o = document.createElement('option'); o.value = value; o.textContent = name; select.append(o); });
        select.value = item.type; select.addEventListener('change', () => { item.type = select.value; save(); render(); });
        let actual;
        if (item.type === 'check') { actual = document.createElement('input'); actual.type = 'checkbox'; actual.checked = item.checked; actual.setAttribute('aria-label', `${item.name}の完了`); actual.addEventListener('change', () => { item.checked = actual.checked; save(); }); }
        else actual = input(item.actual, '実績', v => item.actual = v, { inputMode: 'decimal' });
        actual.className = 'actual-input';
        line.append(input(item.name, '項目名', v => item.name = v), select, actual);
        if (item.type === 'number') {
          const slash = document.createElement('span'); slash.className = 'value-separator'; slash.textContent = '／';
          line.append(slash, input(item.target, '目標', v => item.target = v, { inputMode: 'decimal' }));
        }
        const unit = input(item.unit, item.type === 'number' ? '単位' : '内容', v => item.unit = v); unit.className = 'unit-input';
        line.append(unit,
          button('×', 'icon-button', `${item.name || '項目'}を削除`, () => { section.items.splice(ii, 1); save(); render(); }));
        card.append(line);
      });
      card.append(button('＋ 項目を追加', 'row-add', '項目を追加', () => { if(section.items.length >= 100) return; section.items.push(row('')); save(); render(); }));
      $('sections').append(card);
    });
    updateActualColors();
  }
  function draw() {
    const canvas = document.createElement('canvas');
    const width = 960;
    const pagePadding = 24;
    const cardPadding = 22;
    const headerHeight = 76;
    const cardWidth = width - pagePadding * 2;
    const ctx = canvas.getContext('2d');
    const rootStyle = getComputedStyle(document.documentElement);
    const cardStyle = document.querySelector('.category')
      ? getComputedStyle(document.querySelector('.category')) : null;
    const colors = {
      background: rootStyle.backgroundColor,
      text: rootStyle.color,
      card: cardStyle?.backgroundColor || '#fff',
      border: cardStyle?.borderTopColor || '#e1e7df',
      accent: '#7a9f87',
      muted: '#65786c',
      green: '#34745d'
    };
    const fontFamily = rootStyle.fontFamily;
    function font(size, weight = 400) {
      ctx.font = `${weight} ${size}px ${fontFamily}`;
    }
    // Wrap long entries so downloaded images keep every character readable.
    function wrap(text, maxWidth, size, weight = 400) {
      font(size, weight);
      const lines = [];
      let line = '';
      for (const character of text) {
        if (character === '\n') { lines.push(line); line = ''; continue; }
        if (line && ctx.measureText(line + character).width > maxWidth) {
          lines.push(line); line = '';
        }
        line += character;
      }
      lines.push(line);
      return lines;
    }
    const cards = state.sections.map(section => {
      const title = wrap(section.title, cardWidth - cardPadding * 2 - 18, 18, 700);
      const rows = section.items.map((item, index) => {
        const columns = item.type === 'check'
          ? [wrap(item.name, 430, 16), [], [], wrap(item.unit, 320, 16)]
          : [wrap(item.name, 430, 16), wrap(item.actual, 72, 16), wrap(item.target, 72, 16), wrap(item.unit, 156, 16)];
        const contentHeight = Math.max(...columns.map(lines => lines.length)) * 25;
        const height = index === section.items.length - 1 ? contentHeight : Math.max(42, contentHeight + 12);
        return { item, columns, height };
      });
      return { title, rows, height: cardPadding * 2 + title.length * 27 + 17 + rows.reduce((sum, row) => sum + row.height, 0) };
    });
    const height = headerHeight + 26 + cards.reduce((sum, card) => sum + card.height + 16, 0) + 19;
    // Stay within browser canvas dimensions even with many activities.
    const scale = Math.min(2, 16000 / height);
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    ctx.scale(scale, scale);
    ctx.textBaseline = 'top';
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    function text(lines, x, y, size = 16, weight = 400, color = colors.text, align = 'left') {
      font(size, weight); ctx.fillStyle = color; ctx.textAlign = align;
      lines.forEach((line, index) => ctx.fillText(line, x, y + index * 25));
    }
    function roundedRect(x, y, w, h, radius, fill, stroke) {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
      ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, headerHeight);
    ctx.fillStyle = '#e2e8e1'; ctx.fillRect(0, headerHeight - 1, width, 1);
    text([`${state.year ? state.year + '年' : ''}${state.month}活動${state.mode === 'goal' ? '目標' : '報告'}`], pagePadding, 24, 24, 600);
    let y = headerHeight + 26;
    for (const card of cards) {
      roundedRect(pagePadding, y, cardWidth, card.height, 12, colors.card, colors.border);
      const x = pagePadding + cardPadding;
      roundedRect(x, y + cardPadding + 3, 4, 19, 2, colors.accent);
      text(card.title, x + 18, y + cardPadding, 18, 700);
      let rowY = y + cardPadding + card.title.length * 27 + 17;
      for (const [index, { item, columns, height: rowHeight }] of card.rows.entries()) {
        text(columns[0], x + 8, rowY);
        if (item.type === 'check') {
          if (state.mode === 'report') {
            text([item.checked ? '✓' : '—'], x + 486, rowY, 19, 600, item.checked ? colors.green : '#d33c3c', 'center');
          }
          text(columns[3], x + (state.mode === 'goal' ? 450 : 510), rowY);
        } else if (state.mode === 'goal') {
          text(columns[2], x + 486, rowY, 16, 400, colors.text, 'center');
          text(columns[3], x + 540, rowY);
        } else {
          text(columns[1], x + 486, rowY, 16, 400, isBelowTarget(item) ? '#d33c3c' : colors.text, 'center');
          text(['／'], x + 530, rowY, 16, 400, colors.muted);
          text(columns[2], x + 596, rowY, 16, 400, colors.text, 'center');
          text(columns[3], x + 650, rowY);
        }
        if (index < card.rows.length - 1) {
          const lineCount = Math.max(...columns.map(lines => lines.length));
          // Center the divider between the visible text, excluding trailing line spacing.
          const textHeight = (lineCount - 1) * 25 + 16;
          const lineY = rowY + (textHeight + rowHeight) / 2;
          ctx.beginPath();
          ctx.moveTo(x, lineY);
          ctx.lineTo(x + cardWidth - cardPadding * 2, lineY);
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        rowY += rowHeight;
      }
      y += card.height + 16;
    }
    return canvas;
  }
  $('month').addEventListener('change', e => { state.month = e.target.value; save(); });
  $('year').addEventListener('input', e => {
    if (!e.target.validity.valid) return;
    state.year = e.target.value; save();
  });
  $('add-section').addEventListener('click', () => { if(state.sections.length >= 50) return; state.sections.push({ title: '', items: [row('')] }); save(); render(); });
  function download(blob, name) {
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const filename = () => `${state.year ? state.year + '年' : ''}${state.month}活動${state.mode === 'goal' ? '目標' : '報告'}`.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  $('download').addEventListener('click', async () => {
    if (document.fonts) await document.fonts.ready;
    draw().toBlob(blob => { if(blob) download(blob, filename() + '.png'); else $('message').textContent = '画像を保存できませんでした。'; }, 'image/png');
  });
  $('export-data').addEventListener('click', () => download(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), filename() + '.json'));
  $('import-data').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 2000000) throw Error();
      const data = JSON.parse(await file.text()); if (!valid(data) || !validYear(data)) throw Error();
      if (!confirm('読み込んだデータで現在の内容を置き換えますか？')) return;
      state = { ...data, year: data.year ?? currentYear }; save(); render(); $('message').textContent = 'データを読み込みました。';
    } catch { $('message').textContent = 'このデータは読み込めません。書き出したJSONファイルを選んでください。'; }
    finally { e.target.value = ''; }
  });
  render();
})();
