/* Shared constants and helpers used by the geometry engine */
const DEFAULT_PARAMS = { rc:12, rcT:10, rcCant:6, pt:20, ptT:15, ptCant:8, st:18, stT:12, stCant:7, truss:12, trussCant:6, storeyTruss:8, rcWall:6, plate:6, plateMin:4, inclMax:0.25, cantMax:6, beamCont:15, dlRC:10, dlST:6, fosUp:1.1, goodN:50, rockNear:10 };
const ZONE_NAME = {void:'Atrium / void',dbl:'Double height',colfree:'Column-free zone',core:'Core',footprint:'Building extent',outside:'No building',keep:'Columns kept'};
const EPS=1e-6, TOL=0.05, DQ=0.01;
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num = v => { if (v === null || v === undefined) return null; const n = parseFloat(String(v).trim()); return Number.isFinite(n) ? n : null; };
const f = (x, d=2) => (x === null || x === undefined || !Number.isFinite(x)) ? '–' : x.toFixed(d);
const rng=(n,fn)=>Array.from({length:n},(_,i)=>fn(i));
