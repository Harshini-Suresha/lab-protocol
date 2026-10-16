# LabCheck

A static checker for liquid-handling protocols. It simulates a protocol in software before the robot runs it, tracking liquid in every tube and well and listing steps that can't work as written.

Live site: single-page app in `index.html` (no build step, no dependencies — just open it or serve it statically).

## What it checks

| Code | Fails when |
|---|---|
| `PIPETTE_RANGE` | volume outside pipette min–max (default 20–300 µL, P300) |
| `REAGENT_EMPTY` | source stock goes below 0 |
| `WELL_OVERFLOW` | well ends up over capacity (default 200 µL) |
| `WELL_MISSING` | well doesn't exist on the plate (e.g. no I1 on a 96-well plate) |
| `CONTROL_MISSING` | negative / positive control well never filled |
| `DEAD_VOLUME` | (opt-in) source left below unreachable dead volume |

Each failure is reported with step number, rule code, and a one-line reason.

## Protocol format (JSON)

```json
{
  "plate": 96,
  "reagents": {"buffer": 1000, "dye": 40, "sample": 120},
  "pipette": {"min": 20, "max": 300},
  "well_capacity": 200,
  "dead_volume": 0,
  "controls": {"A1": "negative", "A12": "positive"},
  "steps": [
    {"from": "buffer", "to": "A1", "ul": 100},
    {"from": "dye", "to": "B1", "ul": 20}
  ]
}
```

## Pages (all in `index.html`)

- **Notes (home):** overview + animated 96-well plate simulator. Press Play, or inject one random mistake to see what gets reported.
- **Build:** click wells to compose a protocol; the checker runs after every click. Send to Try it to export JSON.
- **Try it:** paste protocol JSON and validate locally in the browser. Nothing leaves the browser.
- **Data:** 9+ hand-written sample protocols (validated live on page load), Opentrons OT-2 pipette ranges, 96/384 plate reference.
- **Analysis:** charts drawn in-browser by the same checker — reagent levels, plate state, transfer sizes, limit sensitivity, timing.
- **Atlas:** full figure gallery (volumes, stability across seeds, boundary tests, error taxonomy, reagents, wells, methods).
- **Method:** simulation algorithm (O(S) time), rule trigger conditions, evaluation design, Wilson 95% CIs, threats to validity.
- **Results:** benchmark — inject one known error per generated protocol, measure detection rate per error type, multi-error detection, false alarms on clean protocols.
- **Report:** abstract, LAP background, methodology, plan/log.
- **Glossary:** lab terms.

## How it works

1. **Parse** reagents, volumes, labware, steps (LAP-inspired format).
2. **Simulate** each transfer, updating source stocks and well volumes.
3. **Check** every rule after each step (+ controls at the end).
4. **Report** step, rule, and reason.

## Evaluation

- Benchmark protocols are generated randomly (8–24 steps, buffer/sample/dye stocks) subject to all constraints.
- One known mistake injected per protocol; detection = corresponding rule fires. Two injection types (`WRONG_REAGENT`, `WRONG_WELL`) have no dedicated rule — any detection is incidental.
- Same seed + count replays the same tables bit-for-bit (independent RNG streams per fault type).
- Browser reference implementation validates typical workflows (≤25 steps) in under ~2 ms.

Based on the Laboratory Automation Protocol format from [ACS Synth. Biol. 2023](https://pubs.acs.org/doi/10.1021/acssynbio.3c00397).

## Limitations

Knows nothing about viscosity, evaporation, deck collisions, timing, or biology. A pass means the protocol agrees with itself w.r.t. the six rules — the assay can still fail. Benchmark numbers are from generated protocols + synthesised faults, not real lab data.

## Run it

```bash
# any static server, e.g.
python3 -m http.server -d .
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser.
