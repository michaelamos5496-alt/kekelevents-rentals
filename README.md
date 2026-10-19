# Kekel Rentals: website

Static HTML5 / CSS3 / vanilla JS (ES modules). No build step.

## Run
`python3 -m http.server 8000` in this folder, then open http://localhost:8000 (modules need HTTP, not file://).

## Structure
- `index.html`, `collections.html` (filterable, `?c=seating`), `item.html?i=<slug>`: built.
- `enquire.html`: built (form + cart summary + WhatsApp). `about.html`: built (copy is placeholder). `services.html`, `portfolio.html`: marked stubs, next phase.
- `data/inventory.json` (items + categories), `data/setups.json`, `data/site.json` (name, copy, WhatsApp, placeholder tags).
- `js/enquiry.js`: the enquiry list (localStorage, no prices, no personal data; a request for a quote, not a reservation).

## Add an item
Drop a JPEG in `assets/images/raw/<id>.jpg`, run `python3 scripts/make-images.py` (needs Pillow), then copy an entry in `data/inventory.json`.

## Placeholder checklist
- All photographs are Pexels stock (ids = file names in `assets/images/raw/`), tagged "Placeholder" on screen. Replace with real photography.
- Whole inventory (names, quantities, dimensions) is placeholder. Testimonial and intro copy are placeholder.
- Enquiry delivery: `data/site.json` → `enquiry.endpoint` (a form service URL that accepts a JSON POST, e.g. a Formspree form). While empty, submitting opens WhatsApp with the full enquiry pre-filled. Budget ranges and event types are in the same block.
- WhatsApp number: `data/site.json` → `whatsapp.number` (e.g. 233XXXXXXXXX). Empty for now.
- Domain: `kekelrentals.example` is used in meta tags, `sitemap.xml`, `robots.txt`. Replace before launch.
- No address or phone is published. Set `showPlaceholderTags` to false when real content is in.

## Image credits
Photographs from Pexels (https://www.pexels.com), each at https://www.pexels.com/photo/<id>/. Ids: 1082024 112811 1128783 11433914 11450795 12059389 14513890 17584116 18331431 18823645 1907784 19457029 20371072 2104568 2306282 2442899 2649771 26975888 27333845 27522843 27535928 2788490 28059307 28059316 291767 30298624 30742026 3434517 35639589 35985252 38348659 38534517 4913367 4992827 5040767 5864498 5997975 6004129 6162805 6479604 6805522 6805524 7191403 7335989 8113036 8217492 8251778 9120344 
