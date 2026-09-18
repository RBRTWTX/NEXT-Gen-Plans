#!/usr/bin/env python3
"""
normalize_mutcd_svgs.py
-----------------------
Flattens the FHWA 2024 Standard Highway Signs release folder structure
into a single directory of SVGs keyed by MUTCD code.

Input:  C:\shs\  — one or more unzipped SHS release folders
Output: C:\shs\mutcd_signs\  — flat folder, one SVG per MUTCD code

Naming convention in FHWA releases:
  Subfolder: "{CODE} {Full Sign Name}"  e.g. "W02-03a Intersection Warning..."
  Files:     "{CODE}{variant} {Full Sign Name} {size}.svg"
             variant = L, R, or blank (orientation)
             size    = e.g. 24x24, 30x30, 36x36 (inches)

Strategy:
  - For each sign code, collect all .svg files across all size/orientation variants
  - Pick the SMALLEST file as the canonical map icon (lowest fabrication size = simplest geometry)
  - Write to output as {CODE}.svg  (e.g. W02-03a.svg, R1-1.svg)
  - If a code already exists in output (from an earlier release), keep whichever file is smaller
  - Log all decisions to normalize_log.txt alongside the output folder

Author: Chi-Yu Sheu (Superwhizy) — generated 2026-08-03
"""

import os
import re
import shutil
import sys
from pathlib import Path
from collections import defaultdict

# ── Configuration ──────────────────────────────────────────────────────────────
INPUT_ROOT  = Path(r"C:\shs")
OUTPUT_DIR  = INPUT_ROOT / "mutcd_signs"
LOG_FILE    = INPUT_ROOT / "normalize_log.txt"

# Regex: MUTCD code is the first token of the folder name
# Matches codes like: R1-1, W02-03a, S1-1, G1-1P, OM1-1, TC-1, etc.
CODE_RE = re.compile(r'^([A-Z]{1,4}\d{1,2}-\d{1,3}[a-zA-Z0-9]*(?:P|aP|bP)?)', re.IGNORECASE)

# ── Helpers ────────────────────────────────────────────────────────────────────
def extract_code(folder_name: str) -> str | None:
    """Extract MUTCD code from folder name. Returns None if no match."""
    m = CODE_RE.match(folder_name.strip())
    return m.group(1).upper() if m else None

def find_svgs(folder: Path) -> list[Path]:
    """Return all .svg files directly inside a folder (non-recursive)."""
    return [f for f in folder.iterdir() if f.suffix.lower() == '.svg' and f.is_file()]

def pick_smallest(svgs: list[Path]) -> Path:
    """Return the SVG with the smallest file size."""
    return min(svgs, key=lambda f: f.stat().st_size)

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    if not INPUT_ROOT.exists():
        print(f"ERROR: Input root not found: {INPUT_ROOT}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # candidate[code] = Path of best SVG found so far
    candidates: dict[str, Path] = {}
    # stats
    folders_scanned = 0
    folders_matched = 0
    folders_no_svg  = 0
    folders_skipped = 0  # no code match
    conflicts       = 0  # code seen in multiple releases

    log_lines = [
        "MUTCD SVG Normalization Log",
        f"Input:  {INPUT_ROOT}",
        f"Output: {OUTPUT_DIR}",
        "=" * 70,
        ""
    ]

    # Walk every subdirectory of INPUT_ROOT (release folders and their children)
    for dirpath, dirnames, filenames in os.walk(INPUT_ROOT):
        # Skip the output directory itself
        if Path(dirpath) == OUTPUT_DIR:
            dirnames.clear()
            continue

        folder = Path(dirpath)
        folder_name = folder.name

        # Only process leaf-level folders that look like sign folders
        # (they contain files, not just more subdirectories)
        svgs = find_svgs(folder)
        if not svgs and not any(f.endswith('.svg') for f in filenames):
            continue  # no SVGs here, keep walking

        folders_scanned += 1
        code = extract_code(folder_name)

        if code is None:
            folders_skipped += 1
            log_lines.append(f"SKIP  (no code): {folder.relative_to(INPUT_ROOT)}")
            continue

        if not svgs:
            folders_no_svg += 1
            log_lines.append(f"WARN  (no SVGs): {folder.relative_to(INPUT_ROOT)}  [{code}]")
            continue

        folders_matched += 1
        best = pick_smallest(svgs)

        if code in candidates:
            conflicts += 1
            existing = candidates[code]
            if best.stat().st_size < existing.stat().st_size:
                log_lines.append(
                    f"REPLACE [{code}]: {existing.name} ({existing.stat().st_size}B) "
                    f"→ {best.name} ({best.stat().st_size}B)"
                )
                candidates[code] = best
            else:
                log_lines.append(
                    f"KEEP    [{code}]: {existing.name} ({existing.stat().st_size}B) "
                    f"over {best.name} ({best.stat().st_size}B)"
                )
        else:
            candidates[code] = best
            log_lines.append(f"ADD     [{code}]: {best.name} ({best.stat().st_size}B)")

    # ── Copy winners to output ─────────────────────────────────────────────────
    log_lines += ["", "=" * 70, "COPYING TO OUTPUT", "=" * 70, ""]
    copied = 0
    for code, src in sorted(candidates.items()):
        dst = OUTPUT_DIR / f"{code}.svg"
        try:
            shutil.copy2(src, dst)
            copied += 1
        except Exception as e:
            log_lines.append(f"ERROR copying {code}: {e}")

    # ── Summary ────────────────────────────────────────────────────────────────
    summary = [
        "",
        "=" * 70,
        "SUMMARY",
        "=" * 70,
        f"  Folders scanned : {folders_scanned}",
        f"  Codes matched   : {folders_matched}",
        f"  No SVGs found   : {folders_no_svg}",
        f"  No code match   : {folders_skipped}",
        f"  Cross-release   : {conflicts}",
        f"  SVGs copied     : {copied}",
        f"  Output folder   : {OUTPUT_DIR}",
        "",
    ]
    log_lines += summary

    # Write log
    LOG_FILE.write_text("\n".join(log_lines), encoding="utf-8")

    # Print summary to console
    print("\n".join(summary))
    print(f"Log written to: {LOG_FILE}")

if __name__ == "__main__":
    main()
