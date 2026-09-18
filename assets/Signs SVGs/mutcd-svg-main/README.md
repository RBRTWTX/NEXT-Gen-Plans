# mutcd-svg

**The FHWA MUTCD 11th Edition sign graphics, repackaged as a flat SVG library with JSON manifest.**

One SVG per sign code. Free. Public domain. Ready for web use.

---

## What This Is

The [Manual on Uniform Traffic Control Devices (MUTCD)](https://mutcd.fhwa.dot.gov/) is the federal standard governing every traffic sign in the United States. The Federal Highway Administration publishes official vector sign layouts as part of the [2024 Standard Highway Signs (SHS)](https://mutcd.fhwa.dot.gov/kno-shs_2024-release-status/index.htm) publication — but only as multi-gigabyte ZIP archives with nested folders, multiple size variants, and three format copies per sign.

This repository liberates those files into a single flat directory: **one SVG per MUTCD code**, named by code, ready to drop into any web project.

---

## Contents

```
/svg/           One .svg file per MUTCD code  (e.g. R1-1.svg, W2-3a.svg)
/index.json     Machine-readable manifest — code → name, category, shape, background, release
README.md       This file
LICENSE         CC0 public domain dedication
```

---

## Quick Start

### CDN (no install)

```html
<img src="https://cdn.jsdelivr.net/gh/whizy76/mutcd-svg/svg/R1-1.svg" width="48" height="48">
```

### npm

```bash
npm install mutcd-svg
```

```js
import stopSign from 'mutcd-svg/svg/R1-1.svg';
```

### Direct download

Download the [flat SVG zip](../../releases/latest) — drop the `svg/` folder next to your project.

### JSON manifest

```js
fetch('https://cdn.jsdelivr.net/gh/whizy76/mutcd-svg/index.json')
  .then(r => r.json())
  .then(index => {
    const sign = index['R1-1'];
    // { name: "Stop", category: "regulatory", shape: "octagon",
    //   background: "red", svg: "svg/R1-1.svg", release: 3 }
  });
```

---

## Sign Categories & Prefixes

| Prefix | Category | Shape | Background |
|--------|----------|-------|------------|
| R | Regulatory | Varies (rectangle, octagon, triangle) | White, Red |
| W | Warning | Diamond | Yellow |
| S | School | Pentagon, Diamond | Fluorescent Yellow-Green |
| G, D, M, I | Guide | Rectangle | Green, Blue, Brown |
| TC / TTC | Temporary Traffic Control | Diamond, Rectangle | Orange |
| OM | Object Markers | Various | Yellow, Orange |

---

## Coverage

Sourced from all six phased releases of the 2024 SHS publication:

| Release | Date | Contents |
|---------|------|----------|
| 1 | June 2024 | New Warning Signs |
| 2 | September 2024 | New Regulatory, TTC, School Signs |
| 3 | December 2024 | Regulatory, Warning, TTC, School Signs |
| 4 | March 2025 | Regulatory, Warning, TTC, School Signs |
| 5 | August 2025 | Guide Signs |
| 6 | February 2026 | Regulatory and Guide Signs (final release) |

Signs not yet in the 2024 SHS phased releases (legacy signs carried from the 2004 SHS and 2012 Supplement) are not included in this initial release. PRs welcome.

---

## Source & License

All sign graphics originate from the FHWA MUTCD 11th Edition Standard Highway Signs publication. Per MUTCD page I-1:

> *"Any traffic control device design or application provision contained in this Manual shall be considered to be in the public domain. Traffic control devices contained in this Manual shall not be protected by a patent, trademark, or copyright, except for the Interstate Shield and any other items owned by FHWA."*

This repository is dedicated to the public domain under [CC0 1.0](LICENSE). No rights reserved.

The Interstate Shield is excluded from this repository.

---

## How It Was Built

1. Downloaded all six FHWA SHS phased release ZIP archives from `mutcd.fhwa.dot.gov`
2. Extracted to a flat working directory
3. Ran [`normalize_mutcd_svgs.py`](tools/normalize_mutcd_svgs.py) — walks all release folders, extracts MUTCD code from folder name, selects smallest SVG per code (lowest fabrication size = cleanest geometry for web icons), copies to `svg/`
4. Generated `index.json` from FHWA status tables + folder metadata

Tools available in `/tools/` for reproducibility.

---

## Use Cases

- **GIS / web mapping** — render sign inventory layers with actual sign graphics at field zoom
- **AI agents** — queryable sign knowledge base for transportation planning tasks
- **Sign design software** — reference assets for plan production
- **Education** — interactive MUTCD reference tools
- **Any project** that needs a machine-readable US traffic sign library

---

## Contributing

- Found a sign that's missing or incorrect? Open an issue with the MUTCD code.
- Have the 2004 SHS legacy signs in SVG format? PRs welcome.
- Know of a state supplement that should be included? Let's talk.

---

## Built By

[Chi-Yu Sheu](https://chisheu.com) — Maintenance Manager, FDOT District 4 · Florida CBC #CBC1250237 · TX PE #148909

Part of the [chisheu.com](https://chisheu.com) open transportation tools platform.

Browse signs interactively at **[mutcd.chisheu.com](https://mutcd.chisheu.com)**
