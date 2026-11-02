import { esc, byCategory, reveal, stocked, setPageMeta } from '../util.js';
import { card, bindAdd } from './shared.js';

/** Lower-case and strip accents so "decor" finds "décor". */
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function ({ inv, dims }) {
  const grid = document.getElementById('catalogue'), filters = document.getElementById('filters'), count = document.getElementById('count'), blurb = document.getElementById('blurb');
  const search = document.getElementById('search');
  const params = new URLSearchParams(location.search);
  const cats = stocked(inv);
  let current = cats.some((c) => c.id === params.get('c')) ? params.get('c') : 'all';
  let query = params.get('q') || '';
  search.value = query;

  // Everything a visitor might type for a piece: its name, description, material, category and option names (e.g. colours).
  const haystack = new Map(inv.items.map((i) => [i, fold([i.name, i.note, i.material, byCategory(inv, i.category)?.name, ...(i.options?.choices.map((c) => c.name) || [])].join(' '))]));
  const matches = (i) => fold(query).split(/\s+/).filter(Boolean).every((w) => haystack.get(i).includes(w));

  filters.innerHTML = [{ id: 'all', name: 'All' }, ...cats].map((c) => `<button class="filter" type="button" data-cat="${c.id}" aria-pressed="false">${esc(c.name)}</button>`).join('');

  function render(push) {
    const items = inv.items.filter((i) => (current === 'all' || i.category === current) && matches(i));
    filters.querySelectorAll('.filter').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === current));
    const cat = byCategory(inv, current);
    blurb.textContent = cat ? cat.blurb : 'Seating, tablescape, glassware, décor, lounge and lighting, available to hire for events of every scale.';
    if (cat) setPageMeta({ title: `${cat.name} Hire in Accra · Event Rentals · Kekel`, description: `${cat.name} for hire in Accra, Ghana: ${cat.blurb}`, path: `/collections.html?c=${cat.id}` });
    else setPageMeta({ title: 'Event Rentals Accra: Chairs, Tables & Décor Hire · Kekel', description: 'Browse 80+ event rental pieces in Accra: chairs, tables, tablecloths, glassware, décor, lounge and lighting. Add them to your cart and get a quote on WhatsApp.', path: '/collections.html' });
    count.textContent = `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} ${query.trim() ? 'found' : 'to hire'}`;
    grid.innerHTML = items.length
      ? items.map((it, i) => card(it, byCategory(inv, it.category), dims, (i % 3) * 80)).join('')
      : query.trim()
        ? `<div class="state"><p class="lede">Nothing matches “${esc(query.trim())}”${cat ? ` in ${esc(cat.name)}` : ''}.</p><p>Try another word, or <button class="link" type="button" data-clear-search>clear the search</button>.</p></div>`
        : '<div class="state"><p class="lede">Nothing here yet.</p></div>';
    reveal(grid);
    if (push) {
      const u = new URL(location);
      current === 'all' ? u.searchParams.delete('c') : u.searchParams.set('c', current);
      query.trim() ? u.searchParams.set('q', query.trim()) : u.searchParams.delete('q');
      history.replaceState(null, '', u);
    }
  }
  filters.addEventListener('click', (e) => { const b = e.target.closest('.filter'); if (b) { current = b.dataset.cat; render(true); } });
  search.addEventListener('input', () => { query = search.value; render(true); });
  search.form.addEventListener('submit', (e) => { e.preventDefault(); search.blur(); });
  grid.addEventListener('click', (e) => { if (e.target.closest('[data-clear-search]')) { query = search.value = ''; render(true); search.focus(); } });
  bindAdd(grid);
  render(false);
}
