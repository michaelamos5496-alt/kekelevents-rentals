import { esc, picture, loadSetups, loadJSON, byCategory, reveal } from '../util.js';
import { heroIntro, parallax, settleImages, slideIn, quoteIn } from '../motion.js';

const FEATURED = [
  ['lounge', 'ref-chair', 'A pale upholstered armchair with a timber frame'],
  ['lighting', 'ref-lamp', 'A matte dome pendant light'],
  ['decor', 'ref-vase', 'A sculptural stoneware vase'],
];

export default async function ({ site, inv, dims }) {
  // "Our Collection": three categories, each with a quiet, neutral photograph.
  document.getElementById('featured').innerHTML = FEATURED.map(([id, img, alt], n) => {
    const cat = byCategory(inv, id);
    return `<a class="tile" href="collections.html?c=${id}" data-reveal style="--d:${n * 80}ms"><div class="media" data-placeholder>${picture(img, alt, dims[img], { sizes: '(min-width: 40rem) 30vw, 100vw' })}</div><h3>${esc(cat.name)}</h3><span class="tile__go">View rentals →</span></a>`;
  }).join('');

  // Signature setups: a slide carousel (native scroll-snap, so touch swipe works), with arrows and a counter.
  const { items } = await loadSetups();
  const track = document.getElementById('setups');
  track.innerHTML = items.map((s, n) => `
    <article class="slide" role="group" aria-roledescription="slide" aria-label="${n + 1} of ${items.length}">
      <div class="slide__figure media" ${s.placeholder ? 'data-placeholder' : ''}>${picture(s.image, s.alt, dims[s.image], { sizes: '(min-width: 62rem) 58vw, 100vw' })}</div>
      <div class="slide__text"><span class="setup__num">0${n + 1}</span><span class="label" style="display:block;margin-top:.5rem">${esc(s.type)} · ${esc(s.location)}</span><h3>${esc(s.title)}</h3><p>${esc(s.blurb)}</p><a class="arrow-link" href="portfolio.html">View the portfolio →</a></div>
    </article>`).join('');
  const count = document.getElementById('slide-count'), idx = () => Math.round(track.scrollLeft / track.clientWidth);
  let shown = 0;
  const go = (i) => track.scrollTo({ left: ((i + items.length) % items.length) * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const paint = () => { const i = idx(); count.textContent = `0${i + 1} / 0${items.length}`; if (i !== shown) { shown = i; slideIn(track.children[i]); } };
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
