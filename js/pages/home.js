import { esc, picture, loadSetups, loadJSON, reveal } from '../util.js';
import { heroIntro, parallax, settleImages, slideIn, quoteIn } from '../motion.js';


export default async function ({ site, inv, dims }) {
  // "Our Rentals": the first three pieces in the inventory, each linking to its own page.
  document.getElementById('featured').innerHTML = inv.items.slice(0, 3).map((it, n) =>
    `<a class="tile" href="item.html?i=${esc(it.slug)}" data-reveal style="--d:${n * 80}ms"><div class="media r-45">${picture(it.image, it.alt, dims[it.image], { sizes: '(min-width: 40rem) 30vw, 100vw' })}${it.gallery?.[0] ? `<span class="card__alt" aria-hidden="true">${picture(it.gallery[0], '', dims[it.gallery[0]], { sizes: '(min-width: 40rem) 30vw, 100vw' })}</span>` : ''}</div><h3>${esc(it.name)}</h3><span class="tile__go">View piece →</span></a>`).join('');

  // Mobile slide: dots follow the scroll position and jump to a card when tapped.
  const grid = document.getElementById('featured'), cdots = document.getElementById('coll-dots');
  cdots.innerHTML = inv.items.slice(0, 3).map((it, n) => `<button type="button" data-c="${n}" aria-label="Show ${esc(it.name)}" aria-current="${n === 0}"></button>`).join('');
  const cIdx = () => Math.round(grid.scrollLeft / (grid.firstElementChild.getBoundingClientRect().width + 16));
  grid.addEventListener('scroll', () => [...cdots.children].forEach((d, n) => d.setAttribute('aria-current', n === Math.min(cIdx(), cdots.children.length - 1))), { passive: true });
  cdots.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) grid.children[b.dataset.c].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }); });

  // Signature setups: a slide carousel (native scroll-snap, so touch swipe works), with arrows and a counter.
  const { items } = await loadSetups();
  const track = document.getElementById('setups');
  track.innerHTML = items.map((s, n) => `
    <article class="slide" role="group" aria-roledescription="slide" aria-label="${n + 1} of ${items.length}">
      <div class="slide__figure media" ${s.placeholder ? 'data-placeholder' : ''}>${picture(s.image, s.alt, dims[s.image], { sizes: '(min-width: 62rem) 58vw, 100vw' })}</div>
      <div class="slide__text"><span class="setup__num">0${n + 1}</span><span class="label" style="display:block;margin-top:.5rem">${esc(s.type)} · ${esc(s.location)}</span><h3>${esc(s.title)}</h3><p>${esc(s.blurb)}</p><a class="arrow-link" href="project.html?p=${esc(s.slug)}">View this project →</a></div>
    </article>`).join('');
  const count = document.getElementById('slide-count'), idx = () => Math.round(track.scrollLeft / track.clientWidth);
  let shown = 0;
  const go = (i) => track.scrollTo({ left: ((i + items.length) % items.length) * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const sdots = document.getElementById('slide-dots');
  sdots.innerHTML = items.map((_, n) => `<button type="button" data-s="${n}" aria-label="Show setup ${n + 1}" aria-current="${n === 0}"></button>`).join('');
  sdots.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) go(Number(b.dataset.s)); });
  const paint = () => { const i = idx(); count.textContent = `0${i + 1} / 0${items.length}`; [...sdots.children].forEach((d, n) => d.setAttribute('aria-current', n === i)); if (i !== shown) { shown = i; slideIn(track.children[i]); } };
  track.addEventListener('scroll', paint, { passive: true });
  document.getElementById('slide-prev').addEventListener('click', () => go(idx() - 1));
  document.getElementById('slide-next').addEventListener('click', () => go(idx() + 1));
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); } });
  paint();

  // Testimonials: one quote at a time, crossfaded. Manual only, so nobody loses a line mid-read.
  const { items: quotes } = await loadJSON('data/testimonials.json');
  const stage = document.getElementById('testimonials'), tdots = document.getElementById('t-dots');
  stage.innerHTML = quotes.map((q, n) => `<figure class="tquote${n ? '' : ' is-active'}" role="group" aria-roledescription="slide" aria-label="${n + 1} of ${quotes.length}" ${n ? 'aria-hidden="true"' : ''}>
      <blockquote><p>“${esc(q.quote)}”</p></blockquote>
      <figcaption><span class="tquote__author">${esc(q.author)}</span><span class="label">${esc(q.event)}</span>${q.placeholder ? '<span class="ph-note">Placeholder: not a real client</span>' : ''}</figcaption>
    </figure>`).join('');
  tdots.innerHTML = quotes.map((_, n) => `<button type="button" data-t="${n}" aria-label="Show testimonial ${n + 1}" aria-current="${n === 0}"></button>`).join('');
  let tcur = 0;
  const tshow = (i) => {
    const next = (i + quotes.length) % quotes.length; if (next === tcur) return;
    const figs = [...stage.children], from = figs[tcur], to = figs[next];
    tcur = next;
    from.classList.remove('is-active'); from.setAttribute('aria-hidden', 'true');
    to.classList.add('is-active'); to.removeAttribute('aria-hidden');
    [...tdots.children].forEach((d, n) => d.setAttribute('aria-current', n === tcur));
    quoteIn(to);
  };
  document.getElementById('t-prev').addEventListener('click', () => tshow(tcur - 1));
  document.getElementById('t-next').addEventListener('click', () => tshow(tcur + 1));
  tdots.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) tshow(Number(b.dataset.t)); });
  stage.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') tshow(tcur + 1); if (e.key === 'ArrowLeft') tshow(tcur - 1); });

  reveal();
  heroIntro();
  settleImages('.tile .media');
  parallax('.about__figure .media', 6);
}
