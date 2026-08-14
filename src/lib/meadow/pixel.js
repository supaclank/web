// Pixel toolkit for the Meadow world: seeded RNG, sprite rasterizer, and
// terrain tile generator. Everything draws to canvas at integer pixel sizes
// (crisp squares); callers own placement and animation.

export const PINK = '#fa5573';

// Deterministic RNG so terrain and decoration are identical on every visit
// (and between the fixed world layers and the footer horizon).
export function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rasterize a row-string sprite map to a canvas at `s` px per cell. */
export function sprite(rows, pal, s) {
  let w = 0;
  for (const row of rows) w = Math.max(w, row.length);
  const c = document.createElement('canvas');
  c.width = w * s;
  c.height = rows.length * s;
  const g = c.getContext('2d');
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const k = rows[y][x];
      if (pal[k]) {
        g.fillStyle = pal[k];
        g.fillRect(x * s, y * s, s, s);
      }
    }
  }
  return c;
}

// ── Sprite maps ──────────────────────────────────────────────────────────
export const SPRITES = {
  amanita: {
    m: [
      '....rrr....',
      '..rrrrrrr..',
      '.rrrwrrrrr.',
      '.rrrrrrwrr.',
      'rrwrrrrrrrr',
      'rrrrrwrrwrr',
      '.ddddddddd.',
      '....sss....',
      '....sss....',
      '...sssss...'
    ],
    p: { r: '#d0453a', w: '#fff6e8', d: '#9c2f28', s: '#efe4cc' }
  },
  pinkshroom: {
    m: [
      '..ppppp..',
      '.pwppppp.',
      '.pppppwp.',
      'ppppppppp',
      '.mmmmmmm.',
      '...sss...',
      '...sss...',
      '..sssss..'
    ],
    p: { p: PINK, m: '#d63a58', w: '#ffd9e1', s: '#f0e6d0' }
  },
  chanterelle: {
    m: ['..ccc..', '.ccccc.', 'ccccccc', '.d.d.d.', '..ccc..', '..ccc..', '.cccc..'],
    p: { c: '#e3a83f', d: '#c08427' }
  },
  porcini: {
    m: ['..bbb..', '.bbbbb.', 'bbbbbbb', '.sssss.', '..sss..', '..sss..'],
    p: { b: '#96653c', s: '#e8dcc2' }
  },
  daisy: {
    m: ['.w.w.', '.wyw.', '.w.w.', '..g..', '..g..'],
    p: { w: '#fffdf4', y: '#eec94f', g: '#4a7c59' }
  },
  pinkflower: {
    m: ['.p.p.', '.pyp.', '.p.p.', '..g..', '..g..'],
    p: { p: PINK, y: '#ffd9e1', g: '#4a7c59' }
  },
  tuft: {
    m: ['.h..g.h', 'gh.gh.h', 'hghghgh'],
    p: { g: '#6a9b58', h: '#8fc077' }
  },
  lantern: {
    m: [
      'ppppppp',
      'pp...k.',
      'pp..kkk',
      'pp..klk',
      'pp..klk',
      'pp..kkk',
      'pp.....',
      'pp.....',
      'pp.....',
      'pp.....',
      'pp.....',
      'ppp....'
    ],
    p: { p: '#7a5a3a', k: '#3f3222', l: '#ffd98a' }
  },
  cloudBig: {
    m: ['....wwww.....', '..wwwwwwww...', '.wwwwwwwwwwww', '...wwwwww....'],
    p: { w: '#ffffff' }
  },
  cloudSmall: {
    m: ['..wwwww...', '.wwwwwwww.', '...wwww...'],
    p: { w: '#ffffff' }
  }
};

// ── Terrain ──────────────────────────────────────────────────────────────
/** Repeating tile width shared by all parallax layers. */
export const TILE_W = 1536;

/**
 * Generate a repeating pixel-terrain tile via a clamped random walk.
 * Returns { canvas, heights, px, w }; heights are in cells for placing
 * sprites on the crest. The last few columns are nudged toward the first
 * so the tile repeats without a seam step.
 */
export function terrain({ px, h, minH, maxH, detail, seed, base, edge, w = TILE_W, deco }) {
  const cols = Math.round(w / px);
  // Render full px-wide columns edge to edge — w may not be an exact
  // multiple of px, and clipping the last column breaks the repeat seam.
  const tileW = cols * px;
  const c = document.createElement('canvas');
  c.width = tileW;
  c.height = h;
  const g = c.getContext('2d');
  const R = mulberry(seed);
  let lvl = Math.round((minH + maxH) / 2);
  const heights = [];
  for (let i = 0; i < cols; i++) {
    if (R() < detail) lvl += (R() < 0.5 ? -1 : 1) * (R() < 0.3 ? 2 : 1);
    if (lvl < minH) lvl = minH;
    if (lvl > maxH) lvl = maxH;
    heights.push(lvl);
  }
  for (let i = cols - 4; i < cols; i++) {
    const t = heights[0];
    const cur = heights[i - 1];
    heights[i] = cur + Math.sign(t - cur) * Math.min(1, Math.abs(t - cur));
  }
  for (let i = 0; i < cols; i++) {
    const hh = heights[i] * px;
    g.fillStyle = base;
    g.fillRect(i * px, h - hh, px, hh);
    g.fillStyle = edge;
    g.fillRect(i * px, h - hh, px, px);
  }
  if (deco) deco(g, heights, px, h, R);
  return { canvas: c, heights, px, w: tileW };
}

/** Front-layer decoration: grass blades, tiny flowers, dark speckle. */
export function meadowDeco(g, heights, px, h, R) {
  for (let i = 0; i < heights.length; i++) {
    const top = h - heights[i] * px;
    const r = R();
    if (r < 0.16) {
      g.fillStyle = '#93c47d';
      g.fillRect(i * px + Math.floor(R() * (px - 4)), top - 4, 4, 4);
    } else if (r < 0.22) {
      const fx = i * px + Math.floor(px / 2) - 2;
      g.fillStyle = '#4a7c59';
      g.fillRect(fx, top - 4, 3, 4);
      g.fillStyle = '#fffdf4';
      g.fillRect(fx - 3, top - 10, 9, 6);
      g.fillStyle = '#eec94f';
      g.fillRect(fx, top - 8, 3, 3);
    } else if (r < 0.26) {
      const qx = i * px + Math.floor(px / 2) - 2;
      g.fillStyle = '#4a7c59';
      g.fillRect(qx, top - 4, 3, 4);
      g.fillStyle = PINK;
      g.fillRect(qx - 1, top - 8, 5, 5);
    }
    if (R() < 0.4) {
      g.fillStyle = 'rgba(58,95,63,.28)';
      g.fillRect(i * px + Math.floor(R() * (px - 4)), top + px + Math.floor(R() * 26), 4, 4);
    }
  }
}

/** Dithered pixel sun disc (palest gold). */
export function sunCanvas() {
  const S = 10,
    N = 11;
  const c = document.createElement('canvas');
  c.width = N * S;
  c.height = N * S;
  const g = c.getContext('2d');
  const cx = (N - 1) / 2;
  const R = mulberry(42);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cx) * (y - cx));
      if (d <= 3.2) {
        g.fillStyle = '#f3df9d';
        g.fillRect(x * S, y * S, S, S);
      } else if (d <= 4.6 && R() < 0.6) {
        g.fillStyle = '#f6e8ba';
        g.fillRect(x * S, y * S, S, S);
      } else if (d <= 5.4 && R() < 0.25) {
        g.fillStyle = '#f8efd2';
        g.fillRect(x * S, y * S, S, S);
      }
    }
  }
  return c;
}
