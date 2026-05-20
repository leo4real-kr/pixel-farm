// ── 캔버스 설정 ──────────────────────────────────────
const canvas = document.getElementById('farmCanvas');
const ctx = canvas.getContext('2d');
canvas.width = GRID_SIZE * TILE_SIZE;
canvas.height = GRID_SIZE * TILE_SIZE;

// ── farmGrid 초기화 ──────────────────────────────────
function makeTile(x, y) {
    const isUnlocked = (x >= 11 && x <= 13 && y >= 11 && y <= 13);
    return {
        type: 0, progress: 0, water: 50,
        hasWeed: false, overRipeDays: 0, isRotten: false,
        isUnlocked, treeHarvestCount: 0,
        overWaterDays: 0, hasPest: false, pestDays: 0,
        droughtDays: 0,
        rottenCause: '' // 'overripe' | 'overwater' | 'pest' | 'drought' | 'frost'
    };
}

function initGrid() {
    return Array(GRID_SIZE).fill(null).map((_, x) =>
        Array(GRID_SIZE).fill(null).map((_, y) => makeTile(x, y))
    );
}

let farmGrid = initGrid();

// ── 타일 초기화 (수확/개간 시) ───────────────────────
function clearTile(tile) {
    tile.type = 0;
    tile.progress = 0;
    tile.isRotten = false;
    tile.rottenCause = '';
    tile.hasPest = false;
    tile.pestDays = 0;
    tile.overRipeDays = 0;
    tile.overWaterDays = 0;
    tile.droughtDays = 0;
}

// ── 영토 카운트 및 HUD 갱신 ──────────────────────────
function updateUnlockedCountDisplay() {
    let count = 0;
    for (let x = 0; x < GRID_SIZE; x++)
        for (let y = 0; y < GRID_SIZE; y++)
            if (farmGrid[x][y].isUnlocked) count++;
    const el = document.getElementById('unlockedDisplay');
    if (el) el.innerText = count;
    return count;
}

// ── 작물명 반환 ──────────────────────────────────────
function getCropName(type) {
    if (type >= 6 && SEASONAL_CROPS[type]) return SEASONAL_CROPS[type].name;
    return ['빈 땅', '당근', '감자', '옥수수', '딸기', '사과나무'][type] || '빈 땅';
}

// ── 작물 수익 반환 ───────────────────────────────────
function getCropValue(type) {
    if (type >= 6 && SEASONAL_CROPS[type]) return SEASONAL_CROPS[type].value;
    return [0, 50, 80, 150, 260, 0][type] || 0;
}