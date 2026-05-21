// ── 날씨 전환 ────────────────────────────────────────
function tickWeather() {
    if (Math.random() >= 0.22) return;

    const rand = Math.random();
    const frost = (currentSeason === '봄' && gameDays <= 15) ||
                  (currentSeason === '가을' && gameDays > 75);
    const heatwave = currentSeason === '여름';

    if (currentWeather === '맑음') {
        if      (rand < 0.42) currentWeather = '맑음';
        else if (rand < 0.67) currentWeather = '비';
        else if (rand < 0.80) currentWeather = '가뭄';
        else if (rand < 0.90 && frost)    currentWeather = '냉해';
        else if (rand < 0.90 && heatwave) currentWeather = '폭염';
        else currentWeather = '맑음';
    } else if (currentWeather === '비') {
        currentWeather = rand < 0.6 ? '비' : '맑음';
    } else if (currentWeather === '가뭄') {
        currentWeather = rand < 0.55 ? '가뭄' : '맑음';
    } else if (currentWeather === '냉해' || currentWeather === '폭염') {
        currentWeather = rand < 0.5 ? currentWeather : '맑음';
    }

    document.getElementById('weatherDisplay').innerText = currentWeather;
    if (currentWeather === '냉해')
        addSysLog('❄️ 냉해 발생! 딸기/옥수수가 즉시 동사합니다. 당근/감자는 성장이 둔화됩니다.');
    if (currentWeather === '폭염')
        addSysLog('🔥 폭염 발생! 수분이 빠르게 증발합니다. 딸기 성장속도가 절반으로 줄어듭니다.');
    if (currentWeather === '비')
        addSysLog('🌧️ 비가 내립니다. 수분이 빠르게 오릅니다. 과수분이 우려되면 🚿 배수 처리를 활용하세요.');
}

// ── 타일 수분 처리 ───────────────────────────────────
function applyWaterDrain(tile, nearTree) {
    // 폭설 동결 중 — 수분 변화 없음
    if (frozenWaterDays > 0) return;

    if (currentWeather === '비') {
        tile.water += 15;
    } else {
        let drain = currentWeather === '가뭄' ? 12
                  : currentWeather === '폭염' ? 20
                  : 5;
        if (nearTree) drain = Math.floor(drain * 0.5);
        // 가뭄 인카운터 2배 효과
        if (droughtDouble) drain = drain * 2;
        tile.water -= drain;
    }
    if (tile.hasWeed) tile.water -= 8;
    tile.water = Math.max(0, Math.min(100, tile.water));
}

// ── 냉해 피해 ────────────────────────────────────────
function applyFrost(tile) {
    if (currentWeather !== '냉해') return;
    if (tile.type === 0 || tile.type === 5 || tile.isRotten) return;
    // 고구마(11)는 냉해 면역
    const crop = SEASONAL_CROPS[tile.type];
    if (crop && crop.special === 'frostResist') return;
    if (tile.type === 4 || tile.type === 3) {
        tile.isRotten = true;
        tile.rottenCause = 'frost'; // 냉해 동사
    } else {
        tile.progress = Math.max(0, tile.progress - 10); // 당근/감자 둔화
    }
}

// ── 과수분 체크 ──────────────────────────────────────
function applyOverwater(tile) {
    if (tile.type === 0 || tile.type === 5) {
        tile.overWaterDays = 0;
        return;
    }
    if (tile.water >= 100) {
        tile.overWaterDays++;
        if (tile.overWaterDays >= 3) {
            tile.isRotten = true;
            tile.rottenCause = 'overwater';
            tile.overWaterDays = 0;
        }
    } else {
        tile.overWaterDays = 0;
    }
}

// ── 병충해 처리 ──────────────────────────────────────
function applyPest(tile, x, y, weedCount) {
    if (tile.type === 0 || tile.type === 5 || tile.isRotten) return;

    if (!tile.hasPest) {
        // 해바라기(8): 병충해 발생률 50% 감소
        const crop = SEASONAL_CROPS[tile.type];
        const resist = crop && crop.special === 'pestResist' ? 0.5 : 1.0;
        const chance = (0.008 + (weedCount * 0.0008)) * resist;
        if (Math.random() < chance) tile.hasPest = true;
        return;
    }

    // 감염 진행
    tile.pestDays++;
    tile.progress = Math.max(0, tile.progress - (tile.type === 4 ? 8 : 4));

    if (tile.pestDays >= 3) {
        tile.isRotten = true;
        tile.rottenCause = 'pest';
        tile.hasPest = false;
        tile.pestDays = 0;
        spreadPest(x, y, tile.type);
    }
}

function spreadPest(x, y, type) {
    const spread = type === 4 ? 2 : 1; // 딸기 전파 범위 2칸
    for (let dx = -spread; dx <= spread; dx++) {
        for (let dy = -spread; dy <= spread; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
            const nb = farmGrid[nx][ny];
            if (nb.isUnlocked && nb.type > 0 && nb.type !== 5 && !nb.isRotten && !nb.hasPest) {
                if (Math.random() < 0.5) { nb.hasPest = true; nb.pestDays = 0; }
            }
        }
    }
}

// ── 작물 성장 처리 ───────────────────────────────────
function applyGrowth(tile) {
    if (tile.type === 0) return;

    // 사과나무는 절대 썩지 않음 — progress는 main.js 계절 전환에서만 제어
    if (tile.type === 5) {
        if (tile.isRotten) { tile.isRotten = false; tile.rottenCause = ''; }
        // 가을에만 progress 증가 (main.js에서 0으로 리셋 후 여기서 성장)
        if (currentSeason === '가을' && tile.progress < 100 && tile.water > 0) {
            tile.progress = Math.min(100, tile.progress + 5);
        }
        return;
    }

    if (tile.progress < 100) {
        if (tile.water <= 0) {
            tile.droughtDays = (tile.droughtDays || 0) + 1;
            if (tile.droughtDays >= 3) {
                tile.isRotten = true;
                tile.rottenCause = 'drought';
            }
            return;
        }
        tile.droughtDays = 0;
        if (tile.rottenCause === 'drought') tile.rottenCause = '';
        if (tile.hasPest) return;

        let growth;
        if (tile.type >= 6 && SEASONAL_CROPS[tile.type]) {
            // 계절 작물 성장속도
            const crop = SEASONAL_CROPS[tile.type];
            growth = currentWeather === '폭염' ? Math.floor(crop.growth * 0.6) : crop.growth;
        } else {
            growth = [0, 25, 20, 12, currentWeather === '폭염' ? 7 : 15, 5][tile.type] || 0;
        }
        // 지렁이 대발생 보너스
        if (wormBonus) growth = Math.floor(growth * 1.2);
        tile.progress = Math.min(100, tile.progress + growth);
    } else if (tile.type !== 5) {
        tile.overRipeDays++;
        if (tile.overRipeDays >= 3) {
            tile.isRotten = true;
            tile.rottenCause = 'overripe';
        }
    }
}

// ── 잡초 발생 ────────────────────────────────────────
function applyWeedSpawn(tile, nearCorn) {
    if (!tile.hasWeed) {
        // 에다마메(9): 잡초 억제 (옥수수보다 강함, 발생률 1%)
        const crop = tile.type > 0 ? SEASONAL_CROPS[tile.type] : null;
        const weedResist = crop && crop.special === 'weedResist';
        const chance = weedResist ? 0.01 : nearCorn ? 0.015 : 0.05;
        if (Math.random() < chance) tile.hasWeed = true;
    }
}
