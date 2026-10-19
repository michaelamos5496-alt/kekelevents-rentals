import { esc, byCategory, reveal } from '../util.js';
import { card, bindAdd } from './shared.js';

export default function ({ inv, dims }) {
  const grid = document.getElementById('catalogue'), filters = document.getElementById('filters'), count = document.getElementById('count'), blurb = document.getElementById('blurb');
  const params = new URLSearchParams(location.search);
  let current = inv.categories.some((c) => c.id === params.get('c')) ? params.get('c') : 'all';

  filters.innerHTML = [{ id: 'all', name: 'All' }, ...inv.categories].map((c) => `<button class="filter" type="button" data-cat="${c.id}" aria-pressed="false">${esc(c.name)}</button>`).join('');

  function render(push) {
    const items = inv.items.filter((i) => current === 'all' || i.category === current);
    filters.querySelectorAll('.filter').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === current));
    const cat = byCategory(inv, current);
    blurb.textContent = cat ? cat.blurb : 'Seating, tablescape, glassware, décor, lounge and lighting, available to hire for events of every scale.';
    document.title = `${cat ? cat.name + ' · ' : ''}Rentals · Kekel Rentals`;
    count.textContent = `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} to hire`;
    grid.innerHTML = items.length ? items.map((it, i) => card(it, byCategory(inv, it.category), dims, (i % 3) * 80)).join('') : '<div class="state"><p class="lede">Nothing here yet.</p></div>';
    reveal(grid);
    if (push) { const u = new URL(location); current === 'all' ? u.searchParams.delete('c') : u.searchParams.set('c', current); history.replaceState(null, '', u); }
  }
  filters.addEventListener('click', (e) => { const b = e.target.closest('.filter'); if (b) { current = b.dataset.cat; render(true); } });
  bindAdd(grid);
  render(false);
}
