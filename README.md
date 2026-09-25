# mediatastelibrary.page

Source for **The Taste Library** — a page about an experiment: AI agents swept
the Awwwards Site of the Year and Site of the Month winners from 2018–2026,
opened each one, wrote down what it actually does, clustered the results into
aesthetic families, verified the extracted code constants, and compiled the
whole thing into a design skill.

The site is a static page. `node build.mjs` generates `dist/` from `data/`;
`node bin/sync-data.mjs` refreshes `data/` from `~/taste-library` first (run it
after every skill rebuild there).

## Every number is generated

`data/provenance.json` is produced from the dataset by the library's own
`bin/build-provenance.mjs`. Nothing on the page is hand-typed — the counts of
award rows, families, live-vs-offline sites and validated constants all come
from the data. If a number here is wrong, the dataset is wrong.

## Attribution

Every site studied belongs to its authors. Each entry links to the original
work and to its Awwwards page, and says whether the awarded design is still
live. This page studies those sites and claims none of them. Sites marked
`offline` are ones whose *awarded design* is gone — sometimes the domain still
answers with a later rebuild, which is not the same thing and is not counted
as live.

## How the design was chosen

The page was designed by an AI agent using the skill the experiment produced —
the skill applied to itself. Its family is `swiss-grid-lab`, selected because
that family is for "documentation, design systems, editorial explainers —
where the method is the content and the reader agreed to be taught."

The family's axis of variation runs from a *toggled depiction* of a grid to a
*load-bearing* one. This page takes the load-bearing pole: the eight columns
you can toggle in the header are the actual CSS Grid the page is laid out on,
not a picture of one. A page arguing for verification should not fake its own
apparatus.

Constants (`#F1F1F1`/`#010101`, accent `#FAFF00`, the `#B2B2B2 → #606060 →
#2C2C2C` ramp, the 10/14/31/86px type scale with no 16px rank, structural
0.8px rules lighter than ornamental 1px) are cited from the skill. Where the
skill carried no prior, the value is marked `DECISION` in `src/styles.css` and
is the designer's, not a borrowed number.

Motion follows the family's measured rule: stock easings only, zero
`cubic-bezier`. There is no `requestAnimationFrame` loop anywhere — the
skill's honesty gate requires reduced-motion to stop the loop itself, and the
cheapest way to satisfy that is not to open one.

## Build and deploy

```bash
node bin/sync-data.mjs         # data/ <- ~/taste-library (after every skill rebuild there)
node build.mjs                 # -> dist/
./verify.sh                    # motion QA; needs dist/ served on 127.0.0.1:8811
npx wrangler deploy            # dist/ -> https://mediatastelibrary.page (Cloudflare)
node bin/inline-preview.mjs    # single-file copy, for preview surfaces only
```

Hosting: Cloudflare Workers static assets on a Workers Custom Domain
(`wrangler.jsonc`), which creates the apex DNS record itself. The domain's DNS
is on Cloudflare because R2 media lives on `media.mediatastelibrary.page`.
Before 2026-09-24 the page was deployed to Vercel, but the apex never had a
record pointing there, so it did not resolve; the Vercel project is now unused.
Check a deploy by loading the public URL, not by the CLI's success message.

## Layout

```
build.mjs        generator: data + templates -> dist/
data/            generated from the taste-library dataset
src/             styles.css, app.js
dist/            build output (committed, so the deploy is inspectable)
```
