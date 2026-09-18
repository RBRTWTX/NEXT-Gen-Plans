NXT Gen Plans R3 — MUTCD SVG Integration
=========================================

R3 is coded to use this relative folder when it is present:

  assets/Signs SVGs/mutcd-svg-main/
    index.json
    svg/*.svg

The RBRTWTX/NEXT-Gen-Plans GitHub working folder already contains the full 1,054-sign library. Extract/copy R3 over that local repository root and DO NOT delete the existing mutcd-svg-main folder. The R3 Traffic palette will load it automatically.

A standalone R3 folder without that large asset set remains usable and falls back to the internal 179-sign plan-reference catalog plus Texas/TxDOT references and traffic-control devices.

The full external sign set is intentionally not duplicated in this R3 update archive because the project repository already holds it; this avoids creating two divergent copies of the same 1,054 SVG assets.
