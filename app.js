// Directions: dr, dc, label
const DIRECTIONS = [
  { dr: 0, dc: 1, label: 'E' },
  { dr: 0, dc: -1, label: 'W' },
  { dr: 1, dc: 0, label: 'S' },
  { dr: -1, dc: 0, label: 'N' },
  { dr: 1, dc: 1, label: 'SE' },
  { dr: 1, dc: -1, label: 'SW' },
  { dr: -1, dc: 1, label: 'NE' },
  { dr: -1, dc: -1, label: 'NW' },
];

/** @param {string} csvText */
function parseCsvToGrid(csvText) {
  const rows = csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.split(',').map(c => c.trim().toUpperCase()))
    .map(cells => {
      const expanded = [];
      for (const cell of cells) {
        if (!cell) { expanded.push(' '); continue; }
        if (cell.length === 1) expanded.push(cell);
        else expanded.push(...cell.split(''));
      }
      return expanded;
    });
  if (rows.length === 0) throw new Error('Empty CSV content');
  const maxLen = rows.reduce((m, r) => Math.max(m, r.length), 0);
  for (const r of rows) {
    while (r.length < maxLen) r.push(' ');
  }
  return rows; // array of array of single-letter strings
}

function inBounds(r, c, R, C) {
  return r >= 0 && r < R && c >= 0 && c < C;
}

/**
 * @param {string[][]} grid
 * @param {string} rawWord
 * @returns {{start:[number,number], end:[number,number], dir:string}[]}
 */
function findWord(grid, rawWord) {
  const word = (rawWord || '').trim().toUpperCase();
  if (!word) return [];
  const R = grid.length;
  const C = R ? grid[0].length : 0;
  if (!R || !C) return [];
  const first = word[0];
  const results = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] !== first) continue;
      for (const { dr, dc, label } of DIRECTIONS) {
        let rr = r;
        let cc = c;
        let ok = true;
        for (let i = 1; i < word.length; i++) {
          rr += dr;
          cc += dc;
          if (!inBounds(rr, cc, R, C) || grid[rr][cc] !== word[i]) { ok = false; break; }
        }
        if (ok) {
          results.push({ start: [r + 1, c + 1], end: [rr + 1, cc + 1], dir: label });
        }
      }
    }
  }
  return results;
}

function renderGridPreview(grid) {
  const el = document.getElementById('gridPreview');
  if (!grid || !grid.length) { el.textContent = ''; return; }
  const R = grid.length;
  const C = grid[0].length;
  const numWidth = Math.max(String(R).length, String(C).length, 2);
  const cellWidth = Math.max(2, String(C).length);
  const header = ' '.repeat(numWidth + 1) + Array.from({ length: C }, (_, i) => String(i + 1).padStart(cellWidth)).join(' ');
  const lines = grid.map((row, idx) => {
    const rowNum = String(idx + 1).padStart(numWidth);
    const cells = row.map(ch => (ch === ' ' ? '·' : ch).padStart(cellWidth)).join(' ');
    return `${rowNum} ${cells}`;
  });
  el.textContent = [header, ...lines].join('\n');
}

function setMessage(text) {
  document.getElementById('message').textContent = text || '';
}

function enableSearch(enabled) {
  document.getElementById('searchBtn').disabled = !enabled;
}

function renderResultsTable(words, grid) {
  const tbody = document.querySelector('#resultsTable tbody');
  tbody.innerHTML = '';
  for (const w of words) {
    const matches = findWord(grid, w);
    const tr = document.createElement('tr');
    const tdWord = document.createElement('td');
    const tdLocs = document.createElement('td');
    tdWord.textContent = w.toUpperCase();
    if (matches.length === 0) {
      tdLocs.textContent = 'not found';
    } else {
      tdLocs.className = 'locations';
      tdLocs.textContent = matches
        .map(m => `${m.dir}: (${m.start[0]},${m.start[1]})->(${m.end[0]},${m.end[1]})`)
        .join(', ');
    }
    tr.appendChild(tdWord);
    tr.appendChild(tdLocs);
    tbody.appendChild(tr);
  }
}

(function init() {
  const fileInput = document.getElementById('csvFile');
  const wordsInput = document.getElementById('wordsInput');
  const searchBtn = document.getElementById('searchBtn');

  /** @type {string[][]|null} */
  let grid = null;

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) { setMessage(''); grid = null; enableSearch(false); renderGridPreview(null); return; }
    try {
      const text = await file.text();
      grid = parseCsvToGrid(text);
      renderGridPreview(grid);
      setMessage(`Loaded ${grid.length}x${grid[0].length} grid.`);
      enableSearch(true);
    } catch (e) {
      setMessage(`Error: ${e.message || e}`);
      grid = null;
      renderGridPreview(null);
      enableSearch(false);
    }
  });

  searchBtn.addEventListener('click', () => {
    if (!grid) { setMessage('Please upload a CSV grid first.'); return; }
    const raw = (wordsInput.value || '').trim();
    if (!raw) { setMessage('Please enter words, comma-separated.'); return; }
    const words = raw.split(',').map(w => w.trim()).filter(Boolean);
    renderResultsTable(words, grid);
    setMessage(`${words.length} word(s) processed.`);
  });
})();


