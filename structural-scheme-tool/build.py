#!/usr/bin/env python3
"""Assemble src/ into a single offline index.html."""
import json, pathlib
here = pathlib.Path(__file__).parent
src = here / 'src'
sec = json.loads((src / 's355.json').read_text())
ub = [[r['n'], r['I'], round(r['Z'], 1)] for r in sec['ub'] if r['Z']]   # source column 'Z' holds Mcx (kNm)
uc = [[r['n'], r['I'], round(r['Z'], 1)] for r in sec['uc'] if r['Z']]
app = (src / 'app.js').read_text().replace('__UB355__', json.dumps(ub)).replace('__UC355__', json.dumps(uc))
html = (src / 'shell.html').read_text()
html = html.replace('__ENGINE_HEADER__', (src / 'header.js').read_text()).replace('__ENGINE__', (src / 'engine.js').read_text()).replace('__APP__', app)
(here / 'index.html').write_text(html)
print('index.html', len(html))
