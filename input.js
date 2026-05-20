// ── 도구 선택 ────────────────────────────────────────
// 망가진 원인 → 한국어 변환
function getRottenCauseLabel(tile) {
    if (!tile.isRotten && tile.water <= 0) return '⚠️ 극심한 가뭄 (말라죽음 위험)';
    if (!tile.isRotten) return '';
    const map = {
        overripe: '🍂 과숙 방치 (수확 시기 초과)',
        overwater: '💧 과수분 (물을 너무 많이 줌)',
        pest:      '🐛 병충해 감염 (잡초 관리 필요)',
        drought:   '☀️ 말라죽음 (수분 부족)',
        frost:     '❄️ 냉해 동사 (계절성 피해)',
        season:    '🍂 계절 종료 (시즌 작물 폐기)',
    };
    return map[tile.rottenCause] || '❓ 원인 불명';
}
function selectTool(toolType) {
    currentTool = toolType;
    document.querySelectorAll('.shop-btn').forEach(btn => btn.classList.remove('active'));

    const idMap = {
        clearWeed: 'weed', expand: 'expand', sapling: 'sapling',
        pesticide: 'pesticide', drain: 'drain',
        waterArea: 'waterArea', drainArea: 'drainArea',
        weedArea: 'weedArea', harvestArea: 'harvestArea', pesticideArea: 'pesticideArea',
        tulip: 'tulip', wildberry: 'wildberry',
        sunflower: 'sunflower', edamame: 'edamame',
        pumpkin: 'pumpkin', sweetpotato: 'sweetpotato',
    };
    const btnId = `btn-${idMap[toolType] || toolType}`;
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');

    const toolNames = {
        select: '일반 선택', water: '💦 물 주기', clearWeed: '✂️ 잡초 제거',
        expand: '📦 영토 확장', harvest: '🌾 수확/개간', pesticide: '🧪 농약 살포',
        drain: '🚿 배수 처리',
        waterArea: '💦 광역 살수기 (3x3)', drainArea: '🚿 광역 배수펌프 (3x3)',
        weedArea: '✂️ 광역 제초기 (3x3)', harvestArea: '🌾 광역 수확기 (3x3)',
        pesticideArea: '🧪 광역 농약분무기 (3x3)',
        carrot: '당근 심기', potato: '감자 심기', corn: '옥수수 심기',
        strawberry: '딸기 심기', sapling: '🌳 사과나무 심기',
        tulip: '🌷 튤립 심기', wildberry: '🍓 산딸기 심기',
        sunflower: '🌻 해바라기 심기', edamame: '🫘 풋콩 심기',
        pumpkin: '🎃 호박 심기', sweetpotato: '🍠 고구마 심기',
    };
    document.getElementById('toolDisplay').innerText = toolNames[toolType] || toolType;
    updateFamilyUI();
}

// ── 캔버스 좌표 계산 (스케일 보정 포함) ──────────────
function getCanvasTile(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tileX = Math.floor((clientX - rect.left) * scaleX / TILE_SIZE);
    const tileY = Math.floor((clientY - rect.top)  * scaleY / TILE_SIZE);
    return { tileX, tileY };
}

// ── 캔버스 클릭 ──────────────────────────────────────
canvas.addEventListener('click', function(event) {
    const { tileX, tileY } = getCanvasTile(event.clientX, event.clientY);
    if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) return;

    const tile = farmGrid[tileX][tileY];
    const debt = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
    let msg = null;


    // 농약 살포 (3x3 광역, $80)
    if (currentTool === 'pesticide') {
        if (!tile.isUnlocked) return;
        let treated = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = tileX + dx, ny = tileY + dy;
                if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
                const t = farmGrid[nx][ny];
                if (t.isUnlocked && t.hasPest) { t.hasPest = false; t.pestDays = 0; treated++; }
            }
        }
        if (!trySpend(80, `농약 살포 [${tileX},${tileY}] 3x3`)) return;
        playSound('weed');
        addSysLog(treated > 0
            ? `🧪 농약 살포 완료! 3x3 범위 내 병충해 ${treated}곳 제거. (-$80)`
            : `🧪 농약 살포. 해당 범위에 병충해 없음. (-$80)`);
        return;
    }

    // 영토 확장
    if (currentTool === 'expand') {
        if (!tile.isUnlocked) {
            const debt = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
            if (debt + 100 > LOAN_LIMIT) {
                alert('🚨 한도 초과: 부채 제한으로 인해 더 이상 영토를 확장할 수 없습니다.');
                return;
            }
            if (!trySpend(100, `영토 확장 [${tileX}, ${tileY}]`)) return;
            tile.isUnlocked = true; tile.water = 50;
            playSound('expand');
            updateUnlockedCountDisplay();
            addSysLog(`영토를 개간했습니다! 좌표: [${tileX}, ${tileY}]`);
        }
        return;
    }

    if (!tile.isUnlocked) return;

    const cName = getCropName(tile.type);

    // 씨앗 심기 (기본 + 계절 전용)
    const seeds = {
        carrot:      { type: 1, cost: 20,  desc: '당근 씨앗 구매' },
        potato:      { type: 2, cost: 30,  desc: '감자 씨앗 구매' },
        corn:        { type: 3, cost: 50,  desc: '옥수수 씨앗 구매' },
        strawberry:  { type: 4, cost: 80,  desc: '딸기 씨앗 구매' },
        sapling:     { type: 5, cost: 300, desc: '사과 묘목 구매', allSeason: true },
        tulip:       { type: 6,  cost: SEASONAL_CROPS[6].cost,  desc: '튤립 씨앗 구매',    seasonOnly: '봄' },
        wildberry:   { type: 7,  cost: SEASONAL_CROPS[7].cost,  desc: '산딸기 씨앗 구매',  seasonOnly: '봄' },
        sunflower:   { type: 8,  cost: SEASONAL_CROPS[8].cost,  desc: '해바라기 씨앗 구매',seasonOnly: '여름' },
        edamame:     { type: 9,  cost: SEASONAL_CROPS[9].cost,  desc: '풋콩 씨앗 구매',seasonOnly: '여름' },
        pumpkin:   { type: 10, cost: SEASONAL_CROPS[10].cost, desc: '호박 씨앗 구매',seasonOnly: '가을' },
        sweetpotato: { type: 11, cost: SEASONAL_CROPS[11].cost, desc: '고구마 씨앗 구매',  seasonOnly: '가을' },
    };
    const seed = seeds[currentTool];
    if (seed && tile.type === 0) {
        if (seed.seasonOnly && currentSeason !== seed.seasonOnly) {
            addSysLog(`⚠️ ${getCropName(seed.type)}은 ${seed.seasonOnly} 전용 작물입니다. 현재 계절: ${currentSeason}`);
            return;
        }
        if (!seed.allSeason && currentSeason === '겨울') {
            addSysLog('⚠️ 겨울에는 씨앗을 심을 수 없습니다.');
            return;
        }

        // 계절 종료까지 남은 일수 계산
        if (seed.seasonOnly) {
            const seasonEndDay = currentSeason === '봄' ? 30 : currentSeason === '여름' ? 60 : 90;
            const daysLeft = seasonEndDay - gameDays;
            const crop = SEASONAL_CROPS[seed.type];
            // 100% 성장까지 필요한 대략적 턴 수 (progress 0→100, 턴당 growth)
            const turnsNeeded = Math.ceil(100 / crop.growth);
            if (daysLeft < turnsNeeded) {
                const ok = confirm(
                    `⚠️ 씨앗 낭비 경고!\n\n` +
                    `현재 계절 종료까지 약 ${daysLeft}일 남았습니다.\n` +
                    `${crop.name}이 다 자라려면 약 ${turnsNeeded}일이 필요합니다.\n\n` +
                    `계절이 바뀌면 강제 폐기됩니다. 그래도 심으시겠습니까?`
                );
                if (!ok) return;
            }
        }

        const debt = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
        if (debt + seed.cost > LOAN_LIMIT) {
            alert('🚨 금융 한도 초과로 씨앗을 구매할 수 없습니다.');
            return;
        }
        if (!trySpend(seed.cost, seed.desc)) return;
        tile.type = seed.type; tile.progress = 0;
        playSound('plant');
        return;
    }

    // 범위 도구 사용 (3x3)
    const areaTools = ['waterArea','drainArea','weedArea','harvestArea','pesticideArea'];
    if (areaTools.includes(currentTool)) {
        const dur = toolDurability[currentTool];
        if (dur <= 0) {
            alert(`내구도가 소진됐습니다. 농장 상점에서 재구매하세요.`);
            return;
        }
        let affected = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = tileX + dx, ny = tileY + dy;
                if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
                const t = farmGrid[nx][ny];
                if (!t.isUnlocked) continue;
                if (currentTool === 'waterArea') {
                    t.water = Math.min(90, t.water + 40); affected++;
                } else if (currentTool === 'drainArea') {
                    t.water = Math.max(0, t.water - 40); t.overWaterDays = 0; affected++;
                } else if (currentTool === 'weedArea') {
                    if (t.hasWeed) { t.hasWeed = false; affected++; }
                } else if (currentTool === 'harvestArea') {
                    if (t.type > 0 && t.type !== 5) {
                        if (t.isRotten) { clearTile(t); affected++; }
                        else if (t.progress >= 100) {
                            const r = getCropValue(t.type);
                            const n = getCropName(t.type);
                            clearTile(t);
                            updateFinancials('수입', r, `${n} 광역 수확`);
                            addHarvestLog(`${n}(광역)`, r);
                            affected++;
                        }
                    }
                } else if (currentTool === 'pesticideArea') {
                    if (t.hasPest) { t.hasPest = false; t.pestDays = 0; affected++; }
                }
            }
        }
        if (affected === 0) {
            addSysLog(`🔧 범위 내 처리할 대상이 없습니다. (내구도 소모 없음)`);
            return;
        }
        toolDurability[currentTool]--;
        playSound(currentTool === 'harvestArea' ? 'harvest' : 'weed');
        addSysLog(`🔧 광역 도구 사용 (${affected}칸 처리) | 잔여 내구도: ${toolDurability[currentTool]}회`);
        renderToolShop();
        return;
    }

    // 물 주기
    if (currentTool === 'water') {
        tile.water = Math.min(90, tile.water + 40);
        playSound('water');
        return;
    }

    // 배수 처리 — 수분 강제 감소, overWaterDays 초기화
    if (currentTool === 'drain') {
        if (!tile.isUnlocked) return;
        const before = tile.water;
        tile.water = Math.max(0, tile.water - 40);
        tile.overWaterDays = 0;
        if (tile.rottenCause === 'overwater' && !tile.isRotten) tile.rottenCause = '';
        playSound('water');
        addSysLog(`🚿 배수 처리: 수분 ${before}% → ${tile.water}% (과수분 위험 해소)`);
        return;
    }

    // 잡초 제거
    if (currentTool === 'clearWeed' && tile.hasWeed) {
        tile.hasWeed = false;
        playSound('weed');
        addSysLog('잡초를 제거했습니다.');
        return;
    }

    // 수확/개간
    if (currentTool === 'harvest' && tile.type > 0) {
        msg = handleHarvest(tile, tileX, tileY, cName);
    }

    if (msg) {
        addSysLog(msg);
    } else {
        const causeLabel = getRottenCauseLabel(tile);
        const statusTag = tile.isRotten
            ? ` | 상태: 망가짐 | 원인: ${causeLabel}`
            : tile.water <= 0
            ? ` | 상태: ${causeLabel}`
            : tile.overWaterDays > 0
            ? ` | 상태: ⚠️ 과수분 진행 중 (${tile.overWaterDays}/3일) — 🚿 배수 처리 권장!`
            : tile.hasPest
            ? ` | 상태: 🐛 병충해 감염 (${tile.pestDays}/3일)`
            : '';
        addSysLog(`[${tileX},${tileY}] ${cName} | 성장: ${tile.progress}% | 수분: ${tile.water}%${statusTag}`);
    }
});

function handleHarvest(tile, tileX, tileY, cName) {
    if (tile.type === 5) {
        // 사과나무 — 겨울에만 벌목 가능 (절대 부패하지 않음)
        if (currentSeason === '겨울') {
            clearTile(tile); tile.treeHarvestCount = 0;
            playSound('weed');
            updateFinancials('수입', 200, '겨울 땔감 벌목 판매');
            return '나무를 벌목하여 땔감 자금 $200을 획득했습니다.';
        }
        if (currentSeason === '가을' && tile.progress >= 100) {
            tile.treeHarvestCount++;
            const reward = 100 + (tile.treeHarvestCount - 1) * 50;
            playSound('harvest');
            updateFinancials('수입', reward, `가을 사과 누적 보너스 수확 (${tile.treeHarvestCount}회차)`);
            addHarvestLog(`사과나무(${tile.treeHarvestCount}회차)`, reward);
            tile.progress = 0;
            return `사과를 수확하여 $${reward}을 획득했습니다! (나무 숙련도 상승)`;
        }
        return '아직 사과가 열리지 않았습니다. (가을에 수확 가능)';
    }

    // 일반 작물
    if (tile.isRotten) {
        const cause = getRottenCauseLabel(tile);
        clearTile(tile);
        return `🗑️ 부패 작물 제거 완료. 원인: ${cause}`;
    }
    if (tile.progress >= 100) {
        const r = getCropValue(tile.type);
        clearTile(tile);
        playSound('harvest');
        updateFinancials('수입', r, `${cName} 시장 출하`);
        addHarvestLog(cName, r);
        return `수확 성공: +$${r}`;
    }
    return null;
}

// ── 농장 상점 렌더 ───────────────────────────────────
function renderToolShop() {
    const panel = document.getElementById('tool-shop-body');
    if (!panel) return;

    panel.innerHTML = Object.entries(TOOL_SHOP).map(([key, shop]) => {
        const dur = toolDurability[key];
        const owned = dur >= 0;
        const empty = dur === 0;
        const debt  = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
        const canBuy = debt + shop.price <= LOAN_LIMIT;

        const durBar = owned
            ? `<span style="color:${empty?'#ff5252':dur<=3?'#ff9800':'#4ff3a6'};">내구도: ${dur}/${shop.maxDur}회</span>`
            : `<span style="color:#555;">미구매</span>`;

        const buyBtn = (!owned || empty)
            ? `<button class="time-btn" style="font-size:10px;padding:2px 6px;background:${canBuy?'#2e7d32':'#555'};"
                onclick="buyAreaTool('${key}')">${empty?'재구매':'구매'} ($${shop.price})</button>`
            : '';
        const useBtn = owned && !empty
            ? `<button class="time-btn" style="font-size:10px;padding:2px 6px;background:#1565c0;"
                onclick="selectTool('${key}')">장착</button>`
            : '';

        return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;padding:3px;background:#1a1a1a;border-radius:3px;">
            <span style="font-size:10px;">${shop.emoji} ${shop.label}</span>
            <div style="display:flex;gap:3px;align-items:center;">${durBar} ${useBtn}${buyBtn}</div>
        </div>`;
    }).join('');
}

function buyAreaTool(key) {
    const shop = TOOL_SHOP[key];
    if (!shop) return;
    const debt = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
    if (debt + shop.price > LOAN_LIMIT) {
        alert('🚨 금융 한도 초과로 구매할 수 없습니다.');
        return;
    }
    if (!trySpend(shop.price, `${shop.label} 구매`)) return;
    toolDurability[key] = shop.maxDur;
    addSysLog(`🛒 ${shop.label} 구매 완료! 내구도 ${shop.maxDur}회.`);
    renderToolShop();
}

// ── 터치 이벤트 (모바일) ────────────────────────────
canvas.addEventListener('touchstart', function(event) {
    event.preventDefault();
    const touch = event.changedTouches[0];
    const { tileX, tileY } = getCanvasTile(touch.clientX, touch.clientY);
    if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) return;
    canvas.dispatchEvent(new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
    }));
}, { passive: false });
