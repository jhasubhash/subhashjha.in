/* Origami Studio — paper-piece composer */
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const PALETTE = [
    '#f8c8c0', '#f2a99e', '#e87b6a', '#c45a3f', '#8a3a2a',
    '#fde2a1', '#f5c66b', '#e0a23a', '#a87324', '#5e3f1a',
    '#cfe0a8', '#9bbf6a', '#5d8a3a', '#345f1f', '#1d3a14',
    '#bfd9e6', '#7eb1cc', '#3f7da1', '#1f4f70', '#0d2c45',
    '#e0c8e0', '#b69bc0', '#8765a0', '#5a3870', '#fafaf6',
    '#e8e4dc', '#c8c2b6', '#7c736a', '#2a2622', '#000000',
  ];

  /* ===================== State ===================== */
  const state = {
    pieces: [],          // ordered back→front
    selected: new Set(),
    nextId: 1,
    history: [],
    future: [],
    drag: null,
    clipboard: null,    // array of piece snapshots
    viewport: { x: 0, y: 0, scale: 1 },  // pan offset (canvas-space px) + zoom
  };
  const ZOOM_MIN = 0.1, ZOOM_MAX = 10;
  let worldGroup = null;
  let marqueeDiv = null;

  /* ===================== DOM ===================== */
  const canvas = document.getElementById('canvas');
  const svg = document.getElementById('paperSvg');
  const defs = document.getElementById('svgDefs');
  const selLayer = document.getElementById('selectionLayer');
  const floatingControls = document.getElementById('floatingControls');
  const statusToast = document.getElementById('statusToast');

  /* ===================== Filters (texture + shadow) ===================== */
  function installFilters() {
    // Shadow steps: 0 (none) through 5 (deepest)
    // Each rises both blur and offset to mimic stacked paper depth.
    const steps = [
      { dx: 0, dy: 0,  blur: 0,   alpha: 0.0 },
      { dx: 1, dy: 1,  blur: 1.5, alpha: 0.28 },
      { dx: 2, dy: 3,  blur: 3,   alpha: 0.32 },
      { dx: 3, dy: 5,  blur: 5,   alpha: 0.34 },
      { dx: 4, dy: 8,  blur: 8,   alpha: 0.36 },
      { dx: 6, dy: 12, blur: 12,  alpha: 0.38 },
    ];

    steps.forEach((s, i) => {
      const f = document.createElementNS(SVG_NS, 'filter');
      f.setAttribute('id', `paper-shadow-${i}`);
      // Generous region so deep shadows (offset + 3·stdDev ≈ 48px at depth 5) never clip,
      // even for small pieces. 300% margin on each side.
      f.setAttribute('x', '-300%');
      f.setAttribute('y', '-300%');
      f.setAttribute('width', '700%');
      f.setAttribute('height', '700%');
      f.setAttribute('primitiveUnits', 'userSpaceOnUse');

      // Paper texture overlay: tinted noise multiplied onto the source.
      f.innerHTML = `
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${3 + i}" result="noise"/>
        <feColorMatrix in="noise" type="matrix" values="
          0 0 0 0 0
          0 0 0 0 0
          0 0 0 0 0
          0 0 0 0.22 0" result="noiseA"/>
        <feComposite in="noiseA" in2="SourceAlpha" operator="in" result="maskedNoise"/>
        <feBlend in="SourceGraphic" in2="maskedNoise" mode="multiply" result="textured"/>

        <feGaussianBlur in="SourceAlpha" stdDeviation="${s.blur}" result="blur"/>
        <feOffset in="blur" dx="${s.dx}" dy="${s.dy}" result="offsetBlur"/>
        <feComponentTransfer in="offsetBlur" result="shadow">
          <feFuncA type="linear" slope="${s.alpha}"/>
        </feComponentTransfer>

        <feMerge>
          <feMergeNode in="shadow"/>
          <feMergeNode in="textured"/>
        </feMerge>
      `;
      defs.appendChild(f);
    });
  }

  /* ===================== Piece model ===================== */
  function newPiece(type, opts = {}) {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const size = 120;
    return {
      id: state.nextId++,
      type,                                      // 'circle' | 'rectangle' | 'triangle' | 'merged'
      x: opts.x ?? (cw / 2 - size / 2),
      y: opts.y ?? (ch / 2 - size / 2),
      w: opts.w ?? size,
      h: opts.h ?? size,
      rotation: opts.rotation ?? 0,
      color: opts.color ?? randomPaperColor(),
      shadow: opts.shadow ?? 2,
      children: opts.children ?? null,           // populated only for 'merged'
    };
  }

  function randomPaperColor() {
    return PALETTE[Math.floor(Math.random() * 24)]; // skip neutrals
  }

  function addPiece(type) {
    pushHistory();
    const offset = state.pieces.length * 8;
    const p = newPiece(type, {
      x: canvas.clientWidth / 2 - 60 + offset,
      y: canvas.clientHeight / 2 - 60 + offset,
    });
    state.pieces.push(p);
    selectOnly(p.id);
    render();
  }

  /* ===================== History ===================== */
  function snapshot() {
    return JSON.stringify(state.pieces);
  }
  function pushHistory() {
    state.history.push(snapshot());
    if (state.history.length > 100) state.history.shift();
    state.future.length = 0;
  }
  function undo() {
    if (!state.history.length) return;
    state.future.push(snapshot());
    state.pieces = JSON.parse(state.history.pop());
    pruneSelection();
    render();
  }
  function redo() {
    if (!state.future.length) return;
    state.history.push(snapshot());
    state.pieces = JSON.parse(state.future.pop());
    pruneSelection();
    render();
  }
  function pruneSelection() {
    const ids = new Set(state.pieces.map(p => p.id));
    [...state.selected].forEach(id => { if (!ids.has(id)) state.selected.delete(id); });
  }

  /* ===================== Selection ===================== */
  function selectOnly(id) { state.selected.clear(); if (id != null) state.selected.add(id); render(); }
  function toggleSelect(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    render();
  }
  function clearSelection() { state.selected.clear(); render(); }

  function getSelectedPieces() {
    return state.pieces.filter(p => state.selected.has(p.id));
  }

  /* ===================== Geometry ===================== */
  function rot(px, py, cx, cy, deg) {
    const r = deg * Math.PI / 180;
    const c = Math.cos(r), s = Math.sin(r);
    const dx = px - cx, dy = py - cy;
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
  }
  function corners(p) {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    return {
      nw: rot(p.x, p.y, cx, cy, p.rotation),
      ne: rot(p.x + p.w, p.y, cx, cy, p.rotation),
      sw: rot(p.x, p.y + p.h, cx, cy, p.rotation),
      se: rot(p.x + p.w, p.y + p.h, cx, cy, p.rotation),
      n:  rot(p.x + p.w / 2, p.y, cx, cy, p.rotation),
      s:  rot(p.x + p.w / 2, p.y + p.h, cx, cy, p.rotation),
      e:  rot(p.x + p.w, p.y + p.h / 2, cx, cy, p.rotation),
      w:  rot(p.x, p.y + p.h / 2, cx, cy, p.rotation),
      c:  { x: cx, y: cy },
    };
  }
  function aabbOf(p) {
    const c = corners(p);
    const xs = [c.nw.x, c.ne.x, c.sw.x, c.se.x];
    const ys = [c.nw.y, c.ne.y, c.sw.y, c.se.y];
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  }
  function aabbUnion(pieces) {
    const boxes = pieces.map(aabbOf);
    return {
      minX: Math.min(...boxes.map(b => b.minX)),
      minY: Math.min(...boxes.map(b => b.minY)),
      maxX: Math.max(...boxes.map(b => b.maxX)),
      maxY: Math.max(...boxes.map(b => b.maxY)),
    };
  }

  /* ===================== Merge / Unmerge ===================== */
  function mergeSelected() {
    const sel = getSelectedPieces();
    if (sel.length < 2) { flashStatus('Select 2 or more pieces to merge.'); return; }
    pushHistory();

    const box = aabbUnion(sel);
    const W = box.maxX - box.minX;
    const H = box.maxY - box.minY;

    // Flatten any merged children among selection so we don't nest deeply.
    const children = [];
    sel.forEach(p => {
      if (p.type === 'merged' && p.children) {
        // Convert each child to absolute, then to relative against new box.
        p.children.forEach(ch => {
          const abs = childToWorld(ch, p);
          children.push(worldToChild(abs, box));
        });
      } else {
        const abs = { x: p.x, y: p.y, w: p.w, h: p.h, rotation: p.rotation, color: p.color, type: p.type };
        children.push(worldToChild(abs, box));
      }
    });

    // Remove originals, add merged piece on top.
    const selIds = new Set(sel.map(s => s.id));
    state.pieces = state.pieces.filter(p => !selIds.has(p.id));
    const merged = newPiece('merged', {
      x: box.minX, y: box.minY, w: W, h: H, rotation: 0,
      shadow: Math.max(...sel.map(p => p.shadow)),
      children,
    });
    state.pieces.push(merged);
    selectOnly(merged.id);
    render();
  }

  function unmergeSelected() {
    const sel = getSelectedPieces();
    if (sel.length !== 1 || sel[0].type !== 'merged') {
      flashStatus('Select one merged piece to unmerge.');
      return;
    }
    pushHistory();
    const m = sel[0];
    const newPieces = m.children.map(ch => {
      const abs = childToWorld(ch, m);
      return newPiece(abs.type, {
        x: abs.x, y: abs.y, w: abs.w, h: abs.h,
        rotation: abs.rotation, color: abs.color,
        shadow: m.shadow,
      });
    });
    const idx = state.pieces.indexOf(m);
    state.pieces.splice(idx, 1, ...newPieces);
    state.selected = new Set(newPieces.map(p => p.id));
    render();
  }

  // World coords -> child stored relative to merged piece's local box.
  function worldToChild(abs, box) {
    const W = box.maxX - box.minX;
    const H = box.maxY - box.minY;
    return {
      type: abs.type,
      // Store as fractions so merged piece resize scales children proportionally.
      fx: (abs.x - box.minX) / W,
      fy: (abs.y - box.minY) / H,
      fw: abs.w / W,
      fh: abs.h / H,
      rotation: abs.rotation,
      color: abs.color,
    };
  }
  function childToWorld(ch, merged) {
    // Apply merged's local frame including its rotation.
    const localX = ch.fx * merged.w;
    const localY = ch.fy * merged.h;
    const localW = ch.fw * merged.w;
    const localH = ch.fh * merged.h;
    // Translate into world (account for merged.rotation around merged center).
    const mcx = merged.x + merged.w / 2;
    const mcy = merged.y + merged.h / 2;
    const childCenterLocalX = merged.x + localX + localW / 2;
    const childCenterLocalY = merged.y + localY + localH / 2;
    const rotated = rot(childCenterLocalX, childCenterLocalY, mcx, mcy, merged.rotation);
    return {
      type: ch.type,
      x: rotated.x - localW / 2,
      y: rotated.y - localH / 2,
      w: localW,
      h: localH,
      rotation: ch.rotation + merged.rotation,
      color: ch.color,
    };
  }

  /* ===================== Rendering ===================== */
  function shapeElementFor(type, w, h, color) {
    let el;
    if (type === 'circle') {
      el = document.createElementNS(SVG_NS, 'ellipse');
      el.setAttribute('cx', w / 2);
      el.setAttribute('cy', h / 2);
      el.setAttribute('rx', w / 2);
      el.setAttribute('ry', h / 2);
    } else if (type === 'rectangle') {
      el = document.createElementNS(SVG_NS, 'rect');
      el.setAttribute('x', 0);
      el.setAttribute('y', 0);
      el.setAttribute('width', w);
      el.setAttribute('height', h);
    } else if (type === 'triangle') {
      el = document.createElementNS(SVG_NS, 'polygon');
      el.setAttribute('points', `${w / 2},0 ${w},${h} 0,${h}`);
    }
    el.setAttribute('fill', color);
    return el;
  }

  function pieceGroup(p) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-id', p.id);
    g.classList.add('piece-shape');
    const cx = p.w / 2, cy = p.h / 2;
    g.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${p.rotation} ${cx} ${cy})`);
    g.setAttribute('filter', `url(#paper-shadow-${p.shadow})`);

    if (p.type === 'merged' && p.children) {
      p.children.forEach(ch => {
        const cw = ch.fw * p.w, chh = ch.fh * p.h;
        const cx2 = ch.fx * p.w + cw / 2;
        const cy2 = ch.fy * p.h + chh / 2;
        const inner = document.createElementNS(SVG_NS, 'g');
        inner.setAttribute('transform', `translate(${ch.fx * p.w},${ch.fy * p.h}) rotate(${ch.rotation} ${cw / 2} ${chh / 2})`);
        inner.appendChild(shapeElementFor(ch.type, cw, chh, ch.color));
        g.appendChild(inner);
      });
    } else {
      g.appendChild(shapeElementFor(p.type, p.w, p.h, p.color));
    }
    return g;
  }

  function render() {
    if (!worldGroup) {
      worldGroup = document.createElementNS(SVG_NS, 'g');
      worldGroup.classList.add('world');
      svg.appendChild(worldGroup);
    }
    worldGroup.setAttribute('transform', `translate(${state.viewport.x}, ${state.viewport.y}) scale(${state.viewport.scale})`);
    [...worldGroup.children].forEach(n => n.remove());
    state.pieces.forEach(p => worldGroup.appendChild(pieceGroup(p)));

    // Selection layer renders in canvas space (computed positions) so handles stay constant size.
    selLayer.style.transform = '';

    renderSelection();
    updateFloatingControls();
  }

  function worldToCanvas(wx, wy) {
    return { x: wx * state.viewport.scale + state.viewport.x, y: wy * state.viewport.scale + state.viewport.y };
  }
  function canvasToWorld(cx, cy) {
    return { x: (cx - state.viewport.x) / state.viewport.scale, y: (cy - state.viewport.y) / state.viewport.scale };
  }

  function renderSelection() {
    selLayer.innerHTML = '';
    const sel = getSelectedPieces();
    if (!sel.length) return;

    const s = state.viewport.scale;

    if (sel.length === 1) {
      drawRotatedSelectionBox(sel[0], s);
    } else {
      const box = aabbUnion(sel);
      const tl = worldToCanvas(box.minX, box.minY);
      const div = document.createElement('div');
      div.className = 'selection-box';
      div.style.left = tl.x + 'px';
      div.style.top = tl.y + 'px';
      div.style.width = (box.maxX - box.minX) * s + 'px';
      div.style.height = (box.maxY - box.minY) * s + 'px';
      selLayer.appendChild(div);
    }
  }

  function drawRotatedSelectionBox(p, s) {
    const c = corners(p); // world
    // Convert each handle anchor + center to canvas.
    const toC = (pt) => worldToCanvas(pt.x, pt.y);
    const cnC = toC(c.n);

    const tl = worldToCanvas(p.x, p.y);
    const box = document.createElement('div');
    box.className = 'selection-box';
    box.style.left = tl.x + 'px';
    box.style.top = tl.y + 'px';
    box.style.width = (p.w * s) + 'px';
    box.style.height = (p.h * s) + 'px';
    box.style.transformOrigin = `${(p.w * s) / 2}px ${(p.h * s) / 2}px`;
    box.style.transform = `rotate(${p.rotation}deg)`;
    selLayer.appendChild(box);

    const handles = [
      ['nw', c.nw], ['n', c.n], ['ne', c.ne],
      ['e',  c.e],  ['se', c.se],
      ['s',  c.s],  ['sw', c.sw], ['w', c.w],
    ];
    handles.forEach(([dir, pt]) => {
      const cp = toC(pt);
      const h = document.createElement('div');
      h.className = `handle ${dir}`;
      h.style.left = cp.x + 'px';
      h.style.top = cp.y + 'px';
      h.dataset.role = 'resize';
      h.dataset.dir = dir;
      h.dataset.id = p.id;
      selLayer.appendChild(h);
    });

    // Rotate handle: 22 canvas-px above the n edge, along the piece's up direction.
    // In world: shift by 22/s in -y direction relative to piece, then rotate by piece rotation.
    const upWorld = rot(p.x + p.w / 2, p.y - 22 / s, p.x + p.w / 2, p.y + p.h / 2, p.rotation);
    const upC = toC(upWorld);
    const rh = document.createElement('div');
    rh.className = 'handle rotate';
    rh.style.left = upC.x + 'px';
    rh.style.top = upC.y + 'px';
    rh.dataset.role = 'rotate';
    rh.dataset.id = p.id;
    selLayer.appendChild(rh);

    // Line from n-canvas to up-canvas.
    const line = document.createElement('div');
    line.className = 'rotate-line';
    const dx = upC.x - cnC.x, dy = upC.y - cnC.y;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    line.style.left = cnC.x + 'px';
    line.style.top = cnC.y + 'px';
    line.style.height = len + 'px';
    line.style.transform = `rotate(${ang - 90}deg)`;
    selLayer.appendChild(line);
  }

  function flashStatus(msg) {
    statusToast.textContent = msg;
    statusToast.classList.add('show');
    clearTimeout(flashStatus._t);
    flashStatus._t = setTimeout(() => statusToast.classList.remove('show'), 1400);
  }

  /* ===================== Hit testing ===================== */
  function findPieceAtScreen(sx, sy) {
    // sx, sy are canvas-space; convert to world (subtract pan, divide by zoom).
    const w = canvasToWorld(sx, sy);
    sx = w.x; sy = w.y;
    // Iterate back→front (top draws last) for hit test.
    for (let i = state.pieces.length - 1; i >= 0; i--) {
      const p = state.pieces[i];
      // Convert (sx,sy) into local (unrotated) coords of piece.
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      const local = rot(sx, sy, cx, cy, -p.rotation);
      const lx = local.x - p.x, ly = local.y - p.y;
      if (lx < 0 || ly < 0 || lx > p.w || ly > p.h) continue;
      if (p.type === 'merged') return p; // bbox hit is fine for merged groups
      if (p.type === 'rectangle') return p;
      if (p.type === 'circle') {
        const nx = (lx - p.w / 2) / (p.w / 2);
        const ny = (ly - p.h / 2) / (p.h / 2);
        if (nx * nx + ny * ny <= 1) return p;
      } else if (p.type === 'triangle') {
        // Triangle: (w/2, 0), (w, h), (0, h)
        if (pointInTri(lx, ly, p.w / 2, 0, p.w, p.h, 0, p.h)) return p;
      }
    }
    return null;
  }
  function pointInTri(px, py, ax, ay, bx, by, cx, cy) {
    const s = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
    const t = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    if ((s < 0) !== (t < 0) && s !== 0 && t !== 0) return false;
    const d = (cx - bx) * (py - by) - (cy - by) * (px - bx);
    return d === 0 || (d < 0) === (s + t <= 0);
  }

  /* ===================== Mouse interactions ===================== */
  function getCanvasPoint(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  canvas.addEventListener('mousedown', (ev) => {
    if (ev.button !== 0) return;
    const target = ev.target.closest('[data-role]');
    const pt = getCanvasPoint(ev);

    if (target && target.dataset.role === 'resize') {
      startResize(target.dataset.id, target.dataset.dir, pt);
      ev.preventDefault();
      return;
    }
    if (target && target.dataset.role === 'rotate') {
      startRotate(target.dataset.id, pt);
      ev.preventDefault();
      return;
    }

    const hit = findPieceAtScreen(pt.x, pt.y);
    if (!hit) {
      if (ev.shiftKey) {
        startPan(pt);
      } else {
        clearSelection();
        startMarquee(pt);
      }
      ev.preventDefault();
      return;
    }
    if (ev.shiftKey) {
      toggleSelect(hit.id);
      ev.preventDefault();
      return;
    }
    if (!state.selected.has(hit.id)) selectOnly(hit.id);
    startMove(pt);
    ev.preventDefault();
  });

  function startMove(startPt) {
    pushHistory();
    const sel = getSelectedPieces().map(p => ({ id: p.id, ox: p.x, oy: p.y }));
    const scale0 = state.viewport.scale;
    state.drag = {
      kind: 'move',
      startPt,
      onMove: (cur) => {
        const dx = (cur.x - startPt.x) / scale0;
        const dy = (cur.y - startPt.y) / scale0;
        sel.forEach(s => {
          const p = state.pieces.find(pp => pp.id === s.id);
          p.x = s.ox + dx;
          p.y = s.oy + dy;
        });
        render();
      },
    };
  }

  function startResize(id, dir, startPt) {
    id = Number(id);
    const p = state.pieces.find(pp => pp.id === id);
    if (!p) return;
    pushHistory();
    const orig = { x: p.x, y: p.y, w: p.w, h: p.h, rotation: p.rotation };
    const cx0 = orig.x + orig.w / 2, cy0 = orig.y + orig.h / 2;
    // Initial local anchor coords (opposite of dragged corner).
    const anchorLocal = anchorForDir(dir, orig.w, orig.h);
    // World anchor stays fixed during resize.
    const anchorWorld = rot(orig.x + anchorLocal.x, orig.y + anchorLocal.y, cx0, cy0, orig.rotation);
    // Snapshot viewport so converting canvas→world is consistent for the gesture.
    const vp = { x: state.viewport.x, y: state.viewport.y, scale: state.viewport.scale };
    const wStart = { x: (startPt.x - vp.x) / vp.scale, y: (startPt.y - vp.y) / vp.scale };

    state.drag = {
      kind: 'resize',
      startPt,
      onMove: (cur, ev) => {
        const uniform = !!(ev && ev.shiftKey);
        const wCur = { x: (cur.x - vp.x) / vp.scale, y: (cur.y - vp.y) / vp.scale };
        // Mouse position in local (unrotated) frame.
        const localMouse = rot(wCur.x, wCur.y, cx0, cy0, -orig.rotation);
        const localStart = rot(wStart.x, wStart.y, cx0, cy0, -orig.rotation);
        const dxL = localMouse.x - localStart.x;
        const dyL = localMouse.y - localStart.y;

        if (uniform) {
          // Uniform scale around center: all four corners move proportionally.
          // Project mouse delta onto vector from center to this handle.
          const handleLocal = localOfDir(dir, orig.w, orig.h);
          const Vx = handleLocal.x - orig.w / 2;
          const Vy = handleLocal.y - orig.h / 2;
          const denom = Vx * Vx + Vy * Vy;
          let scale = 1 + (denom > 0 ? (dxL * Vx + dyL * Vy) / denom : 0);
          // Keep both dimensions ≥ 1px.
          const minScale = Math.max(1 / orig.w, 1 / orig.h);
          scale = Math.max(minScale, scale);
          p.w = orig.w * scale;
          p.h = orig.h * scale;
          p.x = cx0 - p.w / 2;
          p.y = cy0 - p.h / 2;
        } else {
          // Opposite corner/edge stays anchored in world space.
          let nw = orig.w, nh = orig.h;
          if (dir.includes('e')) nw = Math.max(1, orig.w + dxL);
          if (dir.includes('w')) nw = Math.max(1, orig.w - dxL);
          if (dir.includes('s')) nh = Math.max(1, orig.h + dyL);
          if (dir.includes('n')) nh = Math.max(1, orig.h - dyL);
          if (dir === 'n' || dir === 's') nw = orig.w;
          if (dir === 'e' || dir === 'w') nh = orig.h;

          const anchorLocalNew = anchorForDir(dir, nw, nh);
          const dxFromCenter = anchorLocalNew.x - nw / 2;
          const dyFromCenter = anchorLocalNew.y - nh / 2;
          const rotated = rot(dxFromCenter, dyFromCenter, 0, 0, orig.rotation);
          const newCx = anchorWorld.x - rotated.x;
          const newCy = anchorWorld.y - rotated.y;
          p.w = nw;
          p.h = nh;
          p.x = newCx - nw / 2;
          p.y = newCy - nh / 2;
        }
        render();
      },
    };
  }
  function anchorForDir(dir, w, h) {
    // Return the *opposite* corner/edge midpoint, which stays fixed when dragging this handle.
    const map = {
      nw: { x: w, y: h }, ne: { x: 0, y: h }, sw: { x: w, y: 0 }, se: { x: 0, y: 0 },
      n:  { x: w / 2, y: h }, s: { x: w / 2, y: 0 },
      e:  { x: 0, y: h / 2 }, w: { x: w, y: h / 2 },
    };
    return map[dir];
  }
  function localOfDir(dir, w, h) {
    // Where this handle sits in the piece's local (top-left = 0,0) frame.
    const map = {
      nw: { x: 0, y: 0 }, ne: { x: w, y: 0 }, sw: { x: 0, y: h }, se: { x: w, y: h },
      n:  { x: w / 2, y: 0 }, s: { x: w / 2, y: h },
      e:  { x: w, y: h / 2 }, w: { x: 0, y: h / 2 },
    };
    return map[dir];
  }

  function startRotate(id, startPt) {
    id = Number(id);
    const p = state.pieces.find(pp => pp.id === id);
    if (!p) return;
    pushHistory();
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const vp = { x: state.viewport.x, y: state.viewport.y, scale: state.viewport.scale };
    const wStart = { x: (startPt.x - vp.x) / vp.scale, y: (startPt.y - vp.y) / vp.scale };
    const startAng = Math.atan2(wStart.y - cy, wStart.x - cx) * 180 / Math.PI;
    const origRot = p.rotation;
    state.drag = {
      kind: 'rotate',
      startPt,
      onMove: (cur) => {
        const wx = (cur.x - vp.x) / vp.scale, wy = (cur.y - vp.y) / vp.scale;
        const ang = Math.atan2(wy - cy, wx - cx) * 180 / Math.PI;
        let delta = ang - startAng;
        let r = origRot + delta;
        // wrap to [-180, 180]
        while (r > 180) r -= 360;
        while (r < -180) r += 360;
        p.rotation = r;
        render();
      },
    };
  }

  window.addEventListener('mousemove', (ev) => {
    if (!state.drag) return;
    state.drag.onMove(getCanvasPoint(ev), ev);
  });
  window.addEventListener('mouseup', () => {
    if (state.drag && state.drag.onEnd) state.drag.onEnd();
    state.drag = null;
  });

  /* ===================== Pan ===================== */
  function startPan(startPt) {
    const ox = state.viewport.x, oy = state.viewport.y;
    canvas.classList.add('panning');
    document.body.classList.add('panning');
    state.drag = {
      kind: 'pan',
      startPt,
      onMove: (cur) => {
        state.viewport.x = ox + (cur.x - startPt.x);
        state.viewport.y = oy + (cur.y - startPt.y);
        render();
      },
      onEnd: () => {
        canvas.classList.remove('panning');
        document.body.classList.remove('panning');
      },
    };
  }

  /* ===================== Zoom ===================== */
  function zoomAt(pt, factor) {
    const oldScale = state.viewport.scale;
    const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldScale * factor));
    if (newScale === oldScale) return;
    const f = newScale / oldScale;
    // Keep world point under cursor (pt is in canvas-space) fixed.
    state.viewport.x = pt.x - (pt.x - state.viewport.x) * f;
    state.viewport.y = pt.y - (pt.y - state.viewport.y) * f;
    state.viewport.scale = newScale;
    render();
    flashStatus(`Zoom ${Math.round(newScale * 100)}%`);
  }
  function resetView() {
    state.viewport.x = 0; state.viewport.y = 0; state.viewport.scale = 1;
    render();
    flashStatus('View reset.');
  }

  // Trackpad pinch on macOS Chrome/Firefox/Edge fires wheel with ctrlKey=true.
  // Ctrl/Cmd+scroll on Windows works the same. Plain scroll is ignored (the canvas isn't scrollable).
  canvas.addEventListener('wheel', (ev) => {
    if (ev.ctrlKey || ev.metaKey) {
      ev.preventDefault();
      const pt = getCanvasPoint(ev);
      // deltaY > 0 = pinch in / zoom out; negate so factor>1 when zooming in.
      const factor = Math.exp(-ev.deltaY * 0.01);
      zoomAt(pt, factor);
    }
  }, { passive: false });

  // Safari macOS pinch.
  let gestureBaseScale = 1;
  canvas.addEventListener('gesturestart', (ev) => {
    ev.preventDefault();
    gestureBaseScale = state.viewport.scale;
  });
  canvas.addEventListener('gesturechange', (ev) => {
    ev.preventDefault();
    const pt = getCanvasPoint(ev);
    const target = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, gestureBaseScale * ev.scale));
    zoomAt(pt, target / state.viewport.scale);
  });
  canvas.addEventListener('gestureend', (ev) => { ev.preventDefault(); });

  /* ===================== Marquee select ===================== */
  function startMarquee(startPt) {
    const baseSelection = new Set(state.selected);
    marqueeDiv = document.createElement('div');
    marqueeDiv.className = 'marquee-box';
    canvas.appendChild(marqueeDiv);
    state.drag = {
      kind: 'marquee',
      startPt,
      onMove: (cur) => {
        const x = Math.min(startPt.x, cur.x);
        const y = Math.min(startPt.y, cur.y);
        const w = Math.abs(cur.x - startPt.x);
        const h = Math.abs(cur.y - startPt.y);
        marqueeDiv.style.left = x + 'px';
        marqueeDiv.style.top = y + 'px';
        marqueeDiv.style.width = w + 'px';
        marqueeDiv.style.height = h + 'px';
        // Marquee in world coords for piece-AABB intersection.
        const wTL = canvasToWorld(x, y);
        const wBR = canvasToWorld(x + w, y + h);
        const m = { minX: wTL.x, minY: wTL.y, maxX: wBR.x, maxY: wBR.y };
        const hit = new Set(baseSelection);
        state.pieces.forEach(p => {
          const a = aabbOf(p);
          if (!(a.maxX < m.minX || m.maxX < a.minX || a.maxY < m.minY || m.maxY < a.minY)) {
            hit.add(p.id);
          }
        });
        state.selected = hit;
        renderSelection();
      },
      onEnd: () => {
        if (marqueeDiv) { marqueeDiv.remove(); marqueeDiv = null; }
      },
    };
  }

  /* ===================== Copy / Paste ===================== */
  function copySelected() {
    const sel = getSelectedPieces();
    if (!sel.length) return;
    state.clipboard = JSON.parse(JSON.stringify(sel));
    flashStatus(`Copied ${sel.length} piece${sel.length === 1 ? '' : 's'}.`);
  }
  function pasteClipboard() {
    if (!state.clipboard || !state.clipboard.length) return;
    pushHistory();
    const OFFSET = 20;
    const newPieces = state.clipboard.map(src => {
      const clone = JSON.parse(JSON.stringify(src));
      clone.id = state.nextId++;
      clone.x += OFFSET;
      clone.y += OFFSET;
      return clone;
    });
    // Advance clipboard offsets so repeated paste keeps cascading.
    state.clipboard.forEach(c => { c.x += OFFSET; c.y += OFFSET; });
    state.pieces.push(...newPieces);
    state.selected = new Set(newPieces.map(p => p.id));
    render();
    flashStatus(`Pasted ${newPieces.length} piece${newPieces.length === 1 ? '' : 's'}.`);
  }
  function duplicateSelected() {
    copySelected();
    pasteClipboard();
  }

  /* ===================== Keyboard ===================== */
  window.addEventListener('keyup', (ev) => {
    if (ev.key === 'Shift') canvas.classList.remove('shift-held');
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Shift') canvas.classList.add('shift-held');
    const meta = ev.metaKey || ev.ctrlKey;
    // Don't hijack plain typing in inputs, but let modifier shortcuts (Cmd+Z, etc.) pass through.
    if (!meta && ev.target.matches('input, textarea')) return;
    if (meta && ev.key.toLowerCase() === 'z' && !ev.shiftKey) { ev.preventDefault(); undo(); return; }
    if (meta && (ev.key.toLowerCase() === 'y' || (ev.shiftKey && ev.key.toLowerCase() === 'z'))) { ev.preventDefault(); redo(); return; }
    if (meta && ev.key.toLowerCase() === 'c') { ev.preventDefault(); copySelected(); return; }
    if (meta && ev.key.toLowerCase() === 'v') { ev.preventDefault(); pasteClipboard(); return; }
    if (meta && (ev.key === '=' || ev.key === '+')) {
      ev.preventDefault();
      zoomAt({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }, 1.2);
      return;
    }
    if (meta && ev.key === '-') {
      ev.preventDefault();
      zoomAt({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }, 1 / 1.2);
      return;
    }
    if (meta && ev.key === '0') { ev.preventDefault(); resetView(); return; }
    if (meta && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicateSelected(); return; }
    if (meta && ev.key.toLowerCase() === 'x') { ev.preventDefault(); copySelected(); deleteSelected(); return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); deleteSelected(); return; }
    if (ev.key === 'm' || ev.key === 'M') { mergeSelected(); return; }
    if (ev.key === 'u' || ev.key === 'U') { unmergeSelected(); return; }
    if (ev.key === 'Escape') { clearSelection(); return; }
    if (ev.key === 'a' && meta) { ev.preventDefault(); state.selected = new Set(state.pieces.map(p => p.id)); render(); return; }
    // Arrow nudge
    const step = ev.shiftKey ? 10 : 1;
    const dx = ev.key === 'ArrowLeft' ? -step : ev.key === 'ArrowRight' ? step : 0;
    const dy = ev.key === 'ArrowUp' ? -step : ev.key === 'ArrowDown' ? step : 0;
    if (dx || dy) {
      ev.preventDefault();
      pushHistory();
      getSelectedPieces().forEach(p => { p.x += dx; p.y += dy; });
      render();
    }
  });

  /* ===================== Floating Controls ===================== */
  function mutateSelection(mutator) {
    if (!state.selected.size) return;
    getSelectedPieces().forEach(mutator);
    render();
  }
  function applyColorToSelection(c) {
    mutateSelection(p => {
      if (p.type === 'merged') p.children.forEach(ch => { ch.color = c; });
      else p.color = c;
    });
  }
  function applyShadowToSelection(s) {
    mutateSelection(p => { p.shadow = s; });
  }

  const QUICK_PALETTE = ['#f5c66b','#e87b6a','#c45a3f','#7eb1cc','#9bbf6a','#b69bc0','#f8c8c0','#cfe0a8','#bfd9e6','#e0c8e0','#fafaf6','#2a2622'];

  // Avoid heavy rebuilds: keep a signature; rebuild only when selection identity changes.
  let lastSelSig = null;
  let panelEl = null;
  let panelControls = null;

  function selectionSignature(sel) {
    return sel.map(p => p.id).join(',') + ':' + sel.length;
  }

  function updateFloatingControls() {
    const sel = getSelectedPieces();
    const dragKind = state.drag && state.drag.kind;
    const hideForDrag = dragKind === 'marquee' || dragKind === 'pan';

    if (!sel.length || hideForDrag) {
      floatingControls.classList.remove('visible');
      lastSelSig = null;
      return;
    }

    const sig = selectionSignature(sel);
    if (sig !== lastSelSig) {
      floatingControls.innerHTML = '';
      const built = buildFloatingPanel(sel);
      panelEl = built.panel;
      panelControls = built.controls;
      floatingControls.appendChild(panelEl);
      lastSelSig = sig;
    } else {
      syncFloatingPanelValues(sel);
    }

    positionFloatingPanel(sel);
    floatingControls.classList.add('visible');
  }

  function positionFloatingPanel(sel) {
    const box = sel.length === 1 ? aabbOf(sel[0]) : aabbUnion(sel);
    const tl = worldToCanvas(box.minX, box.minY); // canvas-local
    const tr = worldToCanvas(box.maxX, box.minY);
    const bl = worldToCanvas(box.minX, box.maxY);
    const cx = (tl.x + tr.x) / 2;
    // floatingControls lives inside canvas-wrap, so add canvas's offset within wrap.
    const ox = canvas.offsetLeft, oy = canvas.offsetTop;

    const GAP = 56;
    const panelH = panelEl ? panelEl.offsetHeight : 100;
    const topAbove = tl.y - GAP;

    let topPx;
    if (topAbove - panelH < 12) {
      floatingControls.classList.add('below');
      topPx = bl.y + GAP + oy;
    } else {
      floatingControls.classList.remove('below');
      topPx = topAbove + oy;
    }

    // Clamp horizontally inside canvas-wrap.
    const wrap = canvas.parentElement;
    const panelW = panelEl ? panelEl.offsetWidth : 320;
    const halfW = panelW / 2;
    const minLeft = halfW + 12;
    const maxLeft = wrap.clientWidth - halfW - 12;
    const intended = cx + ox;
    const clamped = Math.max(minLeft, Math.min(maxLeft, intended));

    floatingControls.style.left = clamped + 'px';
    floatingControls.style.top = topPx + 'px';
  }

  function buildFloatingPanel(sel) {
    const panel = document.createElement('div');
    panel.className = 'fc-panel';
    panel.addEventListener('mousedown', (ev) => ev.stopPropagation());
    panel.addEventListener('wheel', (ev) => ev.stopPropagation());

    const isSingle = sel.length === 1;
    const isMerged = isSingle && sel[0].type === 'merged';
    const firstColor = isMerged ? '#ffffff' : (sel[0].color || '#ffffff');

    // ===== Color row =====
    const colorRow = document.createElement('div');
    colorRow.className = 'fc-row';
    colorRow.appendChild(makeLabel('Color'));
    const swatches = [];
    QUICK_PALETTE.forEach(c => {
      const sw = document.createElement('button');
      sw.className = 'fc-swatch';
      sw.style.background = c;
      sw.title = c;
      sw.dataset.color = c;
      sw.addEventListener('click', () => {
        pushHistory();
        applyColorToSelection(c);
      });
      colorRow.appendChild(sw);
      swatches.push(sw);
    });
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'fc-picker';
    picker.value = normalizeHex(firstColor);
    picker.addEventListener('pointerdown', pushHistory);
    picker.addEventListener('input', () => applyColorToSelection(picker.value));
    colorRow.appendChild(picker);
    panel.appendChild(colorRow);

    // ===== Shadow row =====
    const shadowRow = document.createElement('div');
    shadowRow.className = 'fc-row fc-shadow-row';
    shadowRow.appendChild(makeLabel('Shadow'));
    const pips = [];
    for (let i = 0; i <= 5; i++) {
      const pip = document.createElement('button');
      pip.className = 'fc-pip';
      pip.dataset.shadow = i;
      pip.title = `Depth ${i}`;
      pip.addEventListener('click', () => {
        pushHistory();
        applyShadowToSelection(i);
      });
      shadowRow.appendChild(pip);
      pips.push(pip);
    }
    panel.appendChild(shadowRow);

    // ===== Action row =====
    const actions = document.createElement('div');
    actions.className = 'fc-row fc-actions';

    const front = document.createElement('button');
    front.className = 'fc-btn';
    front.textContent = 'Forward';
    front.title = 'Bring forward one step';
    front.addEventListener('click', bringForward);
    actions.appendChild(front);

    const back = document.createElement('button');
    back.className = 'fc-btn';
    back.textContent = 'Backward';
    back.title = 'Send backward one step';
    back.addEventListener('click', sendBackward);
    actions.appendChild(back);

    const sep = document.createElement('span');
    sep.className = 'fc-sep';
    actions.appendChild(sep);

    const dup = document.createElement('button');
    dup.className = 'fc-btn';
    dup.textContent = 'Duplicate';
    dup.addEventListener('click', duplicateSelected);
    actions.appendChild(dup);

    if (sel.length >= 2) {
      const merge = document.createElement('button');
      merge.className = 'fc-btn primary';
      merge.textContent = 'Merge';
      merge.addEventListener('click', mergeSelected);
      actions.appendChild(merge);
    }
    if (isMerged) {
      const unmerge = document.createElement('button');
      unmerge.className = 'fc-btn';
      unmerge.textContent = 'Unmerge';
      unmerge.addEventListener('click', unmergeSelected);
      actions.appendChild(unmerge);
    }

    const del = document.createElement('button');
    del.className = 'fc-btn danger';
    del.textContent = 'Delete';
    del.addEventListener('click', deleteSelected);
    actions.appendChild(del);

    panel.appendChild(actions);

    const controls = { swatches, picker, pips };
    // Initial sync of active states.
    syncControlsToSelection(controls, sel);
    return { panel, controls };
  }

  function syncFloatingPanelValues(sel) {
    if (!panelControls) return;
    syncControlsToSelection(panelControls, sel);
  }

  function syncControlsToSelection(controls, sel) {
    if (!sel.length) return;
    const first = sel[0];
    const color = first.type === 'merged' ? '#ffffff' : (first.color || '#ffffff');
    controls.picker.value = normalizeHex(color);
    controls.swatches.forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color.toLowerCase() === color.toLowerCase());
    });
    controls.pips.forEach(pip => {
      pip.classList.toggle('active', Number(pip.dataset.shadow) === first.shadow);
    });
  }

  function makeLabel(text) {
    const s = document.createElement('span');
    s.className = 'fc-label';
    s.textContent = text;
    return s;
  }
  function normalizeHex(c) {
    if (!c) return '#ffffff';
    if (c.startsWith('#') && c.length === 4) {
      // Expand #abc → #aabbcc
      return '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3];
    }
    return c;
  }

  /* ===================== Z-order ===================== */
  function bringForward() {
    if (!state.selected.size) return;
    pushHistory();
    const sel = new Set(state.selected);
    for (let i = state.pieces.length - 2; i >= 0; i--) {
      if (sel.has(state.pieces[i].id) && !sel.has(state.pieces[i + 1].id)) {
        [state.pieces[i], state.pieces[i + 1]] = [state.pieces[i + 1], state.pieces[i]];
      }
    }
    render();
  }
  function sendBackward() {
    if (!state.selected.size) return;
    pushHistory();
    const sel = new Set(state.selected);
    for (let i = 1; i < state.pieces.length; i++) {
      if (sel.has(state.pieces[i].id) && !sel.has(state.pieces[i - 1].id)) {
        [state.pieces[i], state.pieces[i - 1]] = [state.pieces[i - 1], state.pieces[i]];
      }
    }
    render();
  }
  function bringToFront() {
    pushHistory();
    const sel = state.pieces.filter(p => state.selected.has(p.id));
    state.pieces = state.pieces.filter(p => !state.selected.has(p.id)).concat(sel);
    render();
  }
  function sendToBack() {
    pushHistory();
    const sel = state.pieces.filter(p => state.selected.has(p.id));
    state.pieces = sel.concat(state.pieces.filter(p => !state.selected.has(p.id)));
    render();
  }

  /* ===================== Delete / Clear ===================== */
  function deleteSelected() {
    if (!state.selected.size) return;
    pushHistory();
    state.pieces = state.pieces.filter(p => !state.selected.has(p.id));
    state.selected.clear();
    render();
  }
  async function clearAll() {
    if (!state.pieces.length) return;
    const ok = await confirmDialog({
      title: 'Clear canvas?',
      message: `All ${state.pieces.length} piece${state.pieces.length === 1 ? '' : 's'} will be removed. You can undo this if needed.`,
      confirmText: 'Clear',
      danger: true,
    });
    if (!ok) return;
    pushHistory();
    state.pieces = [];
    state.selected.clear();
    render();
  }

  /* ===================== Confirm dialog ===================== */
  function confirmDialog({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise(resolve => {
      const root = document.getElementById('modalRoot');
      const titleEl = document.getElementById('modalTitle');
      const msgEl = document.getElementById('modalMessage');
      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');
      const backdrop = root.querySelector('.modal-backdrop');

      titleEl.textContent = title;
      msgEl.textContent = message;
      confirmBtn.textContent = confirmText;
      cancelBtn.textContent = cancelText;
      confirmBtn.classList.toggle('danger', danger);
      confirmBtn.classList.toggle('primary', !danger);

      root.classList.add('open');
      root.setAttribute('aria-hidden', 'false');
      // Focus confirm for keyboard users (defer to next frame so transition starts).
      requestAnimationFrame(() => confirmBtn.focus());

      const cleanup = () => {
        root.classList.remove('open');
        root.setAttribute('aria-hidden', 'true');
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        backdrop.removeEventListener('click', onCancel);
        document.removeEventListener('keydown', onKey, true);
      };
      const onConfirm = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onConfirm(); }
      };
      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      backdrop.addEventListener('click', onCancel);
      document.addEventListener('keydown', onKey, true);
    });
  }

  /* ===================== Export ===================== */
  function exportPng() {
    clearSelection();
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', SVG_NS);
    clone.setAttribute('width', cw);
    clone.setAttribute('height', ch);
    clone.setAttribute('viewBox', `0 0 ${cw} ${ch}`);
    // Background
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', cw);
    bg.setAttribute('height', ch);
    bg.setAttribute('fill', '#f7f2e9');
    clone.insertBefore(bg, clone.firstChild.nextSibling);

    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = cw * 2; off.height = ch * 2;
      const ctx = off.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      off.toBlob((pngBlob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = `origami-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  /* ===================== Wire up rail buttons ===================== */
  document.querySelectorAll('.rail-btn[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => addPiece(btn.dataset.shape));
  });
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('clearBtn').addEventListener('click', clearAll);
  document.getElementById('exportBtn').addEventListener('click', exportPng);

  /* ===================== Boot ===================== */
  installFilters();
  render();

  // Convenience: seed a tiny demo composition on first load.
  addPiece('circle');
  addPiece('rectangle');
  addPiece('triangle');
  // Spread the demo pieces.
  state.pieces[0].x = canvas.clientWidth / 2 - 180; state.pieces[0].y = canvas.clientHeight / 2 - 60; state.pieces[0].color = '#f5c66b';
  state.pieces[1].x = canvas.clientWidth / 2 - 40;  state.pieces[1].y = canvas.clientHeight / 2 - 80; state.pieces[1].color = '#7eb1cc';
  state.pieces[2].x = canvas.clientWidth / 2 + 80;  state.pieces[2].y = canvas.clientHeight / 2 - 60; state.pieces[2].color = '#e87b6a';
  state.history.length = 0; // don't allow undoing the demo seed
  clearSelection();
  render();
})();
