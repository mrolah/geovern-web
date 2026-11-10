/* GEOVERN — „Hány fa fér el az utcában?” szabálymotor.
   Ugyanez a fájl fut a böngészőben (window.FH) és az adat-előkészítő Node-szkriptben (module.exports),
   így a térképen látott számok és a koppintásra adott vizsgálat mindig ugyanabból a számításból jön.
   Koordináták: helyi méter (x kelet, y észak) az adatcsomag középpontjához képest. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FH = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---- geometria ---- */
  function dSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var qx = ax + dx * t, qy = ay + dy * t;
    return { d: Math.hypot(px - qx, py - qy), x: qx, y: qy, t: t };
  }
  /* legkisebb távolság vonalak halmazától; a legközelebbi pontot is visszaadja */
  function dLines(lines, px, py, maxD) {
    var best = { d: maxD == null ? 1e9 : maxD, x: 0, y: 0, hit: false };
    for (var i = 0; i < lines.length; i++) {
      var L = lines[i], bb = L.bb;
      if (bb && (px < bb[0] - best.d || px > bb[2] + best.d || py < bb[1] - best.d || py > bb[3] + best.d)) continue;
      var p = L.p || L;
      for (var k = 0; k + 1 < p.length; k++) {
        var r = dSeg(px, py, p[k][0], p[k][1], p[k + 1][0], p[k + 1][1]);
        if (r.d < best.d) { best.d = r.d; best.x = r.x; best.y = r.y; best.hit = true; }
      }
    }
    return best;
  }
  function dPoints(pts, px, py, maxD) {
    var best = { d: maxD == null ? 1e9 : maxD, x: 0, y: 0, hit: false };
    for (var i = 0; i < pts.length; i++) { var d = Math.hypot(px - pts[i][0], py - pts[i][1]); if (d < best.d) { best.d = d; best.x = pts[i][0]; best.y = pts[i][1]; best.hit = true; } }
    return best;
  }
  function inPoly(px, py, ring) {
    var c = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function dPolys(polys, px, py, maxD) { /* 0, ha belül van */
    var best = { d: maxD == null ? 1e9 : maxD, x: 0, y: 0, hit: false, inside: false };
    for (var i = 0; i < polys.length; i++) {
      var P = polys[i], bb = P.bb, p = P.p || P;
      if (bb && (px < bb[0] - best.d || px > bb[2] + best.d || py < bb[1] - best.d || py > bb[3] + best.d)) continue;
      if (inPoly(px, py, p)) return { d: 0, x: px, y: py, hit: true, inside: true };
      for (var k = 0; k + 1 < p.length; k++) { var r = dSeg(px, py, p[k][0], p[k][1], p[k + 1][0], p[k + 1][1]); if (r.d < best.d) { best.d = r.d; best.x = r.x; best.y = r.y; best.hit = true; } }
    }
    return best;
  }
  function withBB(lines) {
    return lines.map(function (p) {
      var a = 1e9, b = 1e9, c = -1e9, d = -1e9;
      for (var i = 0; i < p.length; i++) { if (p[i][0] < a) a = p[i][0]; if (p[i][0] > c) c = p[i][0]; if (p[i][1] < b) b = p[i][1]; if (p[i][1] > d) d = p[i][1]; }
      return { p: p, bb: [a, b, c, d] };
    });
  }

  /* ---- utca-koordináták: s = méter a tengely mentén (DNy → ÉK), t = oldalirányú távolság (+ = bal, ÉNy-i oldal) ---- */
  function Axis(pts) {
    var cum = [0]; for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var L = cum[cum.length - 1];
    function st(x, y) {
      var best = { d: 1e9, s: 0, t: 0 };
      for (var i = 0; i + 1 < pts.length; i++) {
        var ax = pts[i][0], ay = pts[i][1], bx = pts[i + 1][0], by = pts[i + 1][1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
        var u = ((x - ax) * dx + (y - ay) * dy) / l2, uc = u < 0 ? 0 : u > 1 ? 1 : u;
        /* a két végen a tengely egyenesen folytatódik, hogy a túllógó pontok is értelmes s-t kapjanak */
        if (i === 0 && u < 0) uc = u; if (i === pts.length - 2 && u > 1) uc = u;
        var qx = ax + dx * uc, qy = ay + dy * uc, d = Math.hypot(x - qx, y - qy);
        if (d < best.d) { var cr = dx * (y - ay) - dy * (x - ax); best = { d: d, s: cum[i] + uc * Math.sqrt(l2), t: (cr >= 0 ? 1 : -1) * d }; }
      }
      return best;
    }
    function xy(s, t) {
      var i = 0; while (i < pts.length - 2 && cum[i + 1] < s) i++;
      var ax = pts[i][0], ay = pts[i][1], bx = pts[i + 1][0], by = pts[i + 1][1], l = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / l, uy = (by - ay) / l, u = s - cum[i];
      return [ax + ux * u - uy * t, ay + uy * u + ux * t];
    }
    return { pts: pts, cum: cum, L: L, st: st, xy: xy };
  }

  var CROWN = ['', 'kis', 'közepes', 'nagy'];           /* 1..3 */
  var CROWN_M2 = [0, 12, 38, 113];                      /* kifejlett koronavetület, m² (r = 2 / 3,5 / 6 m) */

  /* ---- előkészítés: a nyers adatcsomagból (JSON) keresőszerkezetek ---- */
  function prepare(D) {
    var f = D.f, P = { D: D, axis: Axis(D.axis), rules: {}, f: {} };
    D.rules.forEach(function (r) { P.rules[r.id] = r; });
    ['bld', 'park', 'grass'].forEach(function (k) { P.f[k] = withBB(f[k] || []); });
    ['fence', 'drive', 'walk', 'cross', 'wire', 'drain', 'culv', 'gas', 'water', 'sewer', 'cable', 'tel', 'ohp', 'side'].forEach(function (k) { P.f[k] = withBB(f[k] || []); });
    ['pole', 'lamp', 'tree', 'manhole', 'junc'].forEach(function (k) { P.f[k] = f[k] || []; });
    P.lim = D.lim; /* a közterületi sáv külső határa oldalanként, méterenként: {L:[…], R:[…]} */
    return P;
  }
  function limAt(P, s, side) {
    var a = P.lim[side], i = Math.round(s / P.D.meta.limStep);
    if (i < 0) i = 0; if (i >= a.length) i = a.length - 1;
    return a[i];
  }

  /* ---- egy pont vizsgálata ----
     Visszaad: { s, t, side, inStrip, checks:[{id, stage, d, need, res:'ok'|'K'|'L', cap}], kill:{id,stage}|null, crown:0..3, flags:{park,tel} }
     A küszöbök a D.rules táblából jönnek (d:[kis, közepes, nagy]); 'K' = kizáró a legkisebb koronára is, 'L' = csak a koronát korlátozza. */
  function evalPoint(P, x, y) {
    var q = P.axis.st(x, y), side = q.t >= 0 ? 'L' : 'R', at = Math.abs(q.t), M = P.D.meta, R = P.rules;
    var out = { s: q.s, t: q.t, side: side, inStrip: true, checks: [], kill: null, crown: 3, flags: {} };
    if (q.s < 0 || q.s > P.axis.L) { out.inStrip = false; out.why = 'vege'; out.crown = 0; return out; }
    if (at > limAt(P, q.s, side)) { out.inStrip = false; out.why = 'telek'; out.crown = 0; return out; }

    function chk(id, d, hitPt) {
      var r = R[id]; if (!r) return;
      var c = { id: id, stage: r.stage, d: d, need: r.d[0], res: 'ok', cap: 3, pt: hitPt };
      if (r.w === 'K' && d < r.d[0]) { c.res = 'K'; c.cap = 0; }
      else if (r.w === 'L' && d < r.d[0]) { c.res = 'L'; c.cap = r.cap != null ? r.cap : 1; c.need = r.d[0]; }
      else if (d < r.d[1]) { c.res = 'L'; c.cap = 1; c.need = r.d[1]; }
      else if (d < r.d[2]) { c.res = 'L'; c.cap = 2; c.need = r.d[2]; }
      out.checks.push(c);
      if (c.res === 'K') { if (!out.kill || r.stage < out.kill.stage || (r.stage === out.kill.stage && (r.d[0] - d) > out.kill.miss)) out.kill = { id: id, stage: r.stage, miss: r.d[0] - d }; }
      if (c.cap < out.crown) out.crown = c.cap;
    }
    var far = 30, r;
    /* 1 · közlekedés */
    chk('road', at - M.half, null);
    r = dLines(P.f.side, x, y, far); if (r.hit) chk('sideroad', r.d - M.half, [r.x, r.y]);
    r = dLines(P.f.drive, x, y, far); if (r.hit) chk('drive', r.d - M.driveHalf, [r.x, r.y]);
    r = dPoints(P.f.junc, x, y, 60); if (r.hit) chk('junc', r.d, [r.x, r.y]);
    r = dLines(P.f.cross, x, y, far); if (r.hit) chk('cross', r.d, [r.x, r.y]);
    r = dLines(P.f.walk, x, y, far); if (r.hit) chk('walk', r.d - M.walkHalf, [r.x, r.y]);
    /* 2 · telek és felszín */
    r = dLines(P.f.fence, x, y, far); if (r.hit) chk('fence', r.d, [r.x, r.y]);
    r = dPolys(P.f.bld, x, y, far); if (r.hit) chk('bld', r.d, [r.x, r.y]);
    r = dPoints(P.f.tree, x, y, far); if (r.hit) chk('tree', r.d, [r.x, r.y]);
    r = dLines(P.f.drain, x, y, far); if (r.hit) chk('drain', r.d, [r.x, r.y]);
    /* 3 · föld fölött */
    var w1 = dLines(P.f.wire, x, y, far), w2 = dLines(P.f.ohp, x, y, far); r = w1.d <= w2.d ? w1 : w2; if (r.hit) chk('wire', r.d, [r.x, r.y]);
    r = dPoints(P.f.pole, x, y, far); if (r.hit) chk('pole', r.d, [r.x, r.y]);
    r = dPoints(P.f.lamp, x, y, far); if (r.hit) chk('lamp', r.d, [r.x, r.y]);
    /* 4 · föld alatt (e-közmű lakossági térkép alapján) */
    r = dLines(P.f.gas, x, y, far); if (r.hit) chk('gas', r.d, [r.x, r.y]);
    r = dLines(P.f.water, x, y, far); if (r.hit) chk('water', r.d, [r.x, r.y]);
    r = dLines(P.f.sewer, x, y, far); if (r.hit) chk('sewer', r.d, [r.x, r.y]);
    r = dLines(P.f.cable, x, y, far); if (r.hit) chk('cable', r.d, [r.x, r.y]);
    r = dLines(P.f.tel, x, y, far); if (r.hit) chk('tel', r.d, [r.x, r.y]);
    r = dPoints(P.f.manhole, x, y, far); if (r.hit) chk('manhole', r.d, [r.x, r.y]);
    r = dLines(P.f.culv, x, y, far); if (r.hit) chk('culv', r.d, [r.x, r.y]);

    if (out.kill) out.crown = 0;
    out.flags.park = dPolys(P.f.park, x, y, 0.01).inside;
    out.flags.grass = dPolys(P.f.grass, x, y, 0.01).inside;
    return out;
  }
  /* a pont állapota egy adott lépcsőig: csak az addig „ismert” szabályok számítanak */
  function stateAt(ev, stage) {
    if (!ev.inStrip) return { alive: false, crown: 0, by: null };
    var crown = 3, by = null, miss = -1;
    for (var i = 0; i < ev.checks.length; i++) { var c = ev.checks[i]; if (c.stage > stage) continue;
      if (c.res === 'K') { if (!by || c.stage < by.stage || (c.stage === by.stage && c.need - c.d > miss)) { by = c; miss = c.need - c.d; } }
      else if (c.cap < crown) crown = c.cap; }
    return { alive: !by, crown: by ? 0 : crown, by: by };
  }

  return { dSeg: dSeg, dLines: dLines, dPoints: dPoints, dPolys: dPolys, inPoly: inPoly, withBB: withBB, Axis: Axis, prepare: prepare, limAt: limAt,
    evalPoint: evalPoint, stateAt: stateAt, CROWN: CROWN, CROWN_M2: CROWN_M2, VERSION: 1 };
});
