#!/usr/bin/env python3
"""
generate_index.py
-----------------
Generates index.json for the mutcd-svg GitHub repository.

Run AFTER normalize_mutcd_svgs.py has populated C:\shs\mutcd_signs\

Input:  C:\shs\mutcd_signs\   (flat folder of {CODE}.svg files)
        C:\shs\               (source folders for name extraction)
Output: C:\shs\index.json     (copy to repo root before pushing to GitHub)

Author: Chi-Yu Sheu (Superwhizy) — 2026-08-08
"""

import os
import re
import json
from pathlib import Path

SVG_DIR = Path(r"C:\shs\mutcd_signs")
SHS_ROOT = Path(r"C:\shs")
OUTPUT = SHS_ROOT / "index.json"

# ── Category from code prefix ─────────────────────────────────────────────────
def get_category(code):
    c = code.upper()
    # Strip leading zeros from numeric part for matching
    # e.g. R01-02BP → R-series = regulatory
    if re.match(r'^R\d', c):  return 'regulatory'
    if re.match(r'^W\d', c):  return 'warning'
    if re.match(r'^S\d', c):  return 'school'
    if re.match(r'^G\d', c):  return 'guide'
    if re.match(r'^D\d', c):  return 'guide'
    if re.match(r'^M\d', c):  return 'guide'
    if re.match(r'^I\d', c):  return 'guide'
    if re.match(r'^TC', c):   return 'ttc'
    if re.match(r'^OM', c):   return 'other'
    return 'other'

# ── Shape from code — known exceptions take priority ──────────────────────────
SHAPE_EXCEPTIONS = {
    'R01-01':  'octagon',   # STOP
    'R01-02':  'triangle',  # YIELD
    'R05-01':  'circle',
    'R05-01A': 'rectangle',
    'R05-02':  'circle',
    'R09-03':  'circle',
    'R09-13':  'circle',
    'R09-14':  'circle',
    'R15-01':  'crossbuck',
}

def get_shape(code):
    if code in SHAPE_EXCEPTIONS:
        return SHAPE_EXCEPTIONS[code]
    c = code.upper()
    if re.match(r'^W\d', c):  return 'diamond'
    if re.match(r'^S\d', c):  return 'pentagon'
    if re.match(r'^OM', c):   return 'diamond'
    return 'rectangle'

# ── Background from code ──────────────────────────────────────────────────────
BG_EXCEPTIONS = {
    'R01-01':  'red',
    'R01-02':  'red/white',
    'R05-01':  'red',
    'R05-01A': 'red',
}

def get_background(code):
    if code in BG_EXCEPTIONS:
        return BG_EXCEPTIONS[code]
    c = code.upper()
    if re.match(r'^R\d', c):  return 'white'
    if re.match(r'^W\d', c):  return 'yellow'
    if re.match(r'^S\d', c):  return 'fluorescent-yellow-green'
    if re.match(r'^G\d', c):  return 'green'
    if re.match(r'^D\d', c):  return 'green'
    if re.match(r'^M\d', c):  return 'brown'
    if re.match(r'^I\d', c):  return 'blue'
    if re.match(r'^TC', c):   return 'orange'
    return 'white'

# ── Name extraction from source folder names ──────────────────────────────────
# Folder names in C:\shs look like:
#   "R01-02bP To Traffic In Circle (Plaque)"
#   "W09-02a Merge Here Take Turns"
# Code is first token, rest is the sign name.
# We need to match the UPPERCASED code from mutcd_signs\ back to source folders.

def build_name_map():
    """
    Walk C:\shs\ (one level deep — flat structure from extraction).
    For each subfolder whose name starts with a MUTCD-like code,
    extract code + name. Key by UPPERCASED code to match normalize output.
    """
    names = {}
    # Pattern: code token (letters+digits+dash+letters) then space then name
    folder_re = re.compile(
        r'^([A-Za-z]{1,4}\d{1,2}-\d{1,3}[A-Za-z0-9]*(?:P|aP|bP)?)\s+(.+)',
    )

    for item in SHS_ROOT.iterdir():
        if not item.is_dir():
            continue
        if item.name == 'mutcd_signs':
            continue

        m = folder_re.match(item.name)
        if not m:
            continue

        raw_code = m.group(1)
        name     = m.group(2).strip()

        # Normalize code to uppercase to match what normalize_mutcd_svgs.py produced
        code_upper = raw_code.upper()

        # Strip trailing fabrication artifacts e.g. "2024 3-180"
        name = re.sub(r'\s+\d{4}\s+\d+-\d+$', '', name).strip()

        if code_upper not in names:
            names[code_upper] = name

    return names

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    if not SVG_DIR.exists():
        print(f"ERROR: SVG folder not found: {SVG_DIR}")
        print("Run normalize_mutcd_svgs.py first.")
        return

    svgs = sorted(SVG_DIR.glob("*.svg"))
    if not svgs:
        print(f"ERROR: No SVG files found in {SVG_DIR}")
        return

    print(f"Found {len(svgs)} SVGs in {SVG_DIR}")
    print("Building name map from source folders...")
    name_map = build_name_map()
    print(f"Extracted names for {len(name_map)} codes from source folders.")

    index = {}
    unnamed = []

    for svg in svgs:
        code = svg.stem  # already uppercased by normalize script
        name = name_map.get(code)
        if not name:
            # Fallback: use the code itself as name, flag for review
            name = code
            unnamed.append(code)

        index[code] = {
            "name":       name,
            "category":   get_category(code),
            "shape":      get_shape(code),
            "background": get_background(code),
            "svg":        f"svg/{code}.svg",
        }

    # Write output
    OUTPUT.write_text(
        json.dumps(index, indent=2, ensure_ascii=False),
        encoding='utf-8'
    )

    print(f"\nWrote {len(index)} entries → {OUTPUT}")

    if unnamed:
        print(f"\nWARNING: {len(unnamed)} codes had no name match (used code as name):")
        for c in unnamed:
            print(f"  {c}")
        print("These may need manual name entry in index.json.")

    print("\nNext step: copy index.json to your GitHub repo root before pushing.")

if __name__ == "__main__":
    main()
