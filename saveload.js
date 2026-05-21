// ── Save / Load 시스템 ───────────────────────────────
const SAVE_VERSION = '0.1.0';
const SAVE_AUTO    = 'pixelfarm_auto';
const SAVE_SLOTS   = ['pixelfarm_slot1', 'pixelfarm_slot2', 'pixelfarm_slot3'];

// ── 현재 게임 상태를 객체로 직렬화 ───────────────────
function buildSaveData() {
    return {
        version:       SAVE_VERSION,
        savedAt:       new Date().toLocaleString('ko-KR'),
        // 기본 상태
        money, gameDays, absoluteDays, fullUnlockDay, dynastyStartDay,
        mortgageActive, mortgageDaysLeft, mortgageAmount,
        ssSpouse, loanLimitBonus, sellBonusPct, nobleEnding,
        festivalCount, totalHarvestCount,
        harvestTypeSet: [...harvestTypeSet],
        ssMarriageEventFired,
        encounterCooldown, ancestorBlessing, marketBonus, marketBonusDays,
        wormBonus, wormBonusDays, frozenWaterDays, droughtDouble, droughtDays,
        dustDays, hiredWorker, hiredWorkerDays, presaleActive,
        injuredDays, interestModifier, interestModDays, diceBonus,
        currentSeason, currentWeather,
        totalRevenue, totalExpense, fixedLoanAmount,
        endingFired,
        // 가문
        playerName, generation,
        // 배우자
        hasSpouse, spouseName, spouseGrade,
        isPregnant, pregnancyDays, pregnancyCooldown,
        spouseActionText, marriageEventFired,
        // 자녀
        children: JSON.parse(JSON.stringify(children)),
        // 은퇴 가족
        retiredFamily: JSON.parse(JSON.stringify(retiredFamily)),
        // 범위 도구 내구도
        toolDurability: Object.assign({}, toolDurability),
        // 그리드 (직렬화)
        farmGrid: farmGrid.map(col => col.map(t => ({
            type: t.type, progress: t.progress, water: t.water,
            hasWeed: t.hasWeed, overRipeDays: t.overRipeDays,
            isRotten: t.isRotten, isUnlocked: t.isUnlocked,
            treeHarvestCount: t.treeHarvestCount,
            overWaterDays: t.overWaterDays,
            hasPest: t.hasPest, pestDays: t.pestDays,
            droughtDays: t.droughtDays ?? 0,
            rottenCause: t.rottenCause ?? ''
        })))
    };
}

// ── 저장 데이터를 게임 상태에 복원 ───────────────────
function applySaveData(d) {
    if (!d || d.version !== SAVE_VERSION) {
        alert('⚠️ 저장 데이터 버전이 맞지 않아 불러올 수 없습니다.');
        return false;
    }

    // 기본 상태 복원
    money          = d.money;
    gameDays       = d.gameDays;
    absoluteDays   = d.absoluteDays;
    fullUnlockDay  = d.fullUnlockDay;
    dynastyStartDay = d.dynastyStartDay ?? -1;
    mortgageActive   = d.mortgageActive   ?? false;
    mortgageDaysLeft = d.mortgageDaysLeft ?? 120;
    mortgageAmount   = d.mortgageAmount   ?? 0;
    ssSpouse         = d.ssSpouse         ?? '';
    loanLimitBonus   = d.loanLimitBonus   ?? 0;
    sellBonusPct     = d.sellBonusPct     ?? 0;
    nobleEnding      = d.nobleEnding      ?? false;
    festivalCount    = d.festivalCount    ?? 0;
    totalHarvestCount = d.totalHarvestCount ?? 0;
    harvestTypeSet   = new Set(d.harvestTypeSet ?? []);
    ssMarriageEventFired = d.ssMarriageEventFired ?? { beatrice: false, joan: false, scarlet: false };
    encounterCooldown  = d.encounterCooldown  ?? 0;
    ancestorBlessing   = d.ancestorBlessing   ?? false;
    marketBonus        = d.marketBonus        ?? 0;
    marketBonusDays    = d.marketBonusDays    ?? 0;
    wormBonus          = d.wormBonus          ?? false;
    wormBonusDays      = d.wormBonusDays      ?? 0;
    frozenWaterDays    = d.frozenWaterDays     ?? 0;
    droughtDouble      = d.droughtDouble      ?? false;
    droughtDays        = d.droughtDays        ?? 0;
    dustDays           = d.dustDays           ?? 0;
    hiredWorker        = d.hiredWorker        ?? false;
    hiredWorkerDays    = d.hiredWorkerDays    ?? 0;
    presaleActive      = d.presaleActive      ?? false;
    injuredDays        = d.injuredDays        ?? 0;
    interestModifier   = d.interestModifier   ?? 0;
    interestModDays    = d.interestModDays    ?? 0;
    diceBonus          = d.diceBonus          ?? 0;
    currentSeason  = d.currentSeason;
    currentWeather = d.currentWeather;
    totalRevenue   = d.totalRevenue;
    totalExpense   = d.totalExpense;
    fixedLoanAmount = d.fixedLoanAmount;
    endingFired    = d.endingFired;

    // 가문
    playerName  = d.playerName;
    generation  = d.generation;

    // 배우자
    hasSpouse        = d.hasSpouse;
    spouseName       = d.spouseName;
    spouseGrade      = d.spouseGrade;
    isPregnant       = d.isPregnant;
    pregnancyDays    = d.pregnancyDays;
    pregnancyCooldown = d.pregnancyCooldown;
    spouseActionText = d.spouseActionText;
    marriageEventFired = d.marriageEventFired;

    // 자녀
    children = d.children || [];
    // 은퇴 가족
    retiredFamily = d.retiredFamily || [];
    // 범위 도구 내구도
    if (d.toolDurability) Object.assign(toolDurability, d.toolDurability);

    // 그리드 복원
    farmGrid = d.farmGrid.map(col => col.map(t => ({
        type: t.type, progress: t.progress, water: t.water,
        hasWeed: t.hasWeed, overRipeDays: t.overRipeDays,
        isRotten: t.isRotten, isUnlocked: t.isUnlocked,
        treeHarvestCount: t.treeHarvestCount,
        overWaterDays: t.overWaterDays ?? 0,
        hasPest: t.hasPest ?? false,
        pestDays: t.pestDays ?? 0,
        droughtDays: t.droughtDays ?? 0,
        rottenCause: t.rottenCause ?? ''
    })));

    return true;
}

// ── UI 전체 갱신 (로드 후 호출) ──────────────────────
function refreshAllUI() {
    document.getElementById('moneyDisplay').innerText  = money < 0
        ? `마이너스 통장 (${money})` : money;
    document.getElementById('moneyDisplay').style.color = money < 0 ? '#ff5252' : '#ffb74d';
    document.getElementById('dayDisplay').innerText     = gameDays;
    document.getElementById('seasonDisplay').innerText  = currentSeason;
    document.getElementById('weatherDisplay').innerText = currentWeather;
    document.getElementById('total-revenue').innerText  = `$${totalRevenue}`;
    document.getElementById('total-expense').innerText  = `$${totalExpense}`;
    document.getElementById('fixed-loan-display').innerText = `$${fixedLoanAmount}`;
    const net = totalRevenue - totalExpense;
    const profitEl = document.getElementById('net-profit');
    profitEl.innerText = (net >= 0 ? '+' : '') + `$${net}`;
    profitEl.style.color = net >= 0 ? '#4ff3a6' : '#ff5252';
    updateUnlockedCountDisplay();
    updateFamilyUI();
    selectTool('select');
    addSysLog(`📂 세이브 데이터 로드 완료 — ${generation}대 ${playerName} 가주`);
}

// ── 슬롯 메타 정보 읽기 ──────────────────────────────
function getSlotMeta(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const d = JSON.parse(raw);
        return { savedAt: d.savedAt, generation: d.generation, playerName: d.playerName,
                 season: d.currentSeason, day: d.gameDays, money: d.money };
    } catch { return null; }
}

// ── 저장 ─────────────────────────────────────────────
function saveToSlot(slotIndex) {
    // slotIndex: 0=auto, 1~3=수동
    const key = slotIndex === 0 ? SAVE_AUTO : SAVE_SLOTS[slotIndex - 1];
    const label = slotIndex === 0 ? '자동 저장' : `슬롯 ${slotIndex}`;
    try {
        localStorage.setItem(key, JSON.stringify(buildSaveData()));
        addSysLog(`💾 ${label}에 저장 완료.`);
        renderSavePanel();
    } catch(e) {
        alert('저장 실패: ' + e.message);
    }
}

// ── 불러오기 ─────────────────────────────────────────
function loadFromSlot(slotIndex) {
    const key = slotIndex === 0 ? SAVE_AUTO : SAVE_SLOTS[slotIndex - 1];
    const label = slotIndex === 0 ? '자동 저장' : `슬롯 ${slotIndex}`;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return alert(`${label}에 저장된 데이터가 없습니다.`);
        const d = JSON.parse(raw);
        if (!confirm(`${label} (${d.savedAt}) 데이터를 불러올까요?\n현재 진행 상황은 사라집니다.`)) return;
        setGameSpeed(0);
        if (!applySaveData(d)) return;
        refreshAllUI();
        if (!gameInterval) animate(); // 애니메이션이 멈춰있으면 재시작
        setGameSpeed(1);
    } catch(e) {
        alert('불러오기 실패: ' + e.message);
    }
}

// ── 슬롯 삭제 ────────────────────────────────────────
function deleteSlot(slotIndex) {
    const key = slotIndex === 0 ? SAVE_AUTO : SAVE_SLOTS[slotIndex - 1];
    const label = slotIndex === 0 ? '자동 저장' : `슬롯 ${slotIndex}`;
    if (!confirm(`${label} 데이터를 삭제할까요?`)) return;
    localStorage.removeItem(key);
    addSysLog(`🗑️ ${label} 삭제 완료.`);
    renderSavePanel();
}

// ── JSON 파일로 내보내기 ──────────────────────────────
function exportSave() {
    const data = JSON.stringify(buildSaveData(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pixelfarm_${generation}대_${playerName}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    addSysLog('📤 세이브 파일 내보내기 완료.');
}

// ── JSON 파일 불러오기 ────────────────────────────────
function importSave(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const d = JSON.parse(e.target.result);
            if (!confirm(`파일 (${d.savedAt || '?'}) 데이터를 불러올까요?\n현재 진행 상황은 사라집니다.`)) return;
            setGameSpeed(0);
            if (!applySaveData(d)) return;
            refreshAllUI();
            setGameSpeed(1);
        } catch { alert('파일 파싱 실패. 올바른 세이브 파일인지 확인하세요.'); }
    };
    reader.readAsText(file);
    event.target.value = ''; // 같은 파일 재선택 허용
}

// ── 자동 저장 (tick에서 호출) ─────────────────────────
function autoSave() {
    try {
        localStorage.setItem(SAVE_AUTO, JSON.stringify(buildSaveData()));
    } catch(e) {}
}

// ── 세이브 패널 렌더 ─────────────────────────────────
function renderSavePanel() {
    const panel = document.getElementById('save-panel-body');
    if (!panel) return;

    const notice = `<div style="font-size:10px; color:#666; margin-bottom:6px; line-height:1.5;">
        ⚠️ 세이브 파일은 이 브라우저에만 저장됩니다.<br>
        브라우저가 바뀌면 저장 파일을 찾을 수 없어요.<br>
        다른 기기에서 이어하려면 <b style="color:#aaa;">JSON 내보내기</b>를 이용하세요.
    </div>`;

    const allSlots = [
        { index: 0, key: SAVE_AUTO, label: '🔄 자동 저장' },
        { index: 1, key: SAVE_SLOTS[0], label: '💾 슬롯 1' },
        { index: 2, key: SAVE_SLOTS[1], label: '💾 슬롯 2' },
        { index: 3, key: SAVE_SLOTS[2], label: '💾 슬롯 3' },
    ];

    panel.innerHTML = notice + allSlots.map(slot => {
        const meta = getSlotMeta(slot.key);
        const info = meta
            ? `<span style="color:#aaa;font-size:10px;">${meta.savedAt}<br>${meta.generation}대 ${meta.playerName} | ${meta.season} ${meta.day}일 | $${meta.money}</span>`
            : `<span style="color:#555;font-size:10px;">— 비어 있음 —</span>`;
        const loadBtn = meta
            ? `<button class="time-btn" style="font-size:10px;padding:2px 6px;background:#1565c0;" onclick="loadFromSlot(${slot.index})">불러오기</button>`
            : '';
        const delBtn = meta
            ? `<button class="time-btn" style="font-size:10px;padding:2px 6px;background:#b71c1c;" onclick="deleteSlot(${slot.index})">삭제</button>`
            : '';
        // 자동 저장 슬롯은 수동 저장 버튼 없음
        const saveBtn = slot.index === 0 ? '' :
            `<button class="time-btn" style="font-size:10px;padding:2px 6px;background:#2e7d32;" onclick="saveToSlot(${slot.index})">저장</button>`;

        return `<div style="border:1px solid #444;border-radius:4px;padding:6px;margin-bottom:5px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:bold;color:#ffb74d;">${slot.label}</span>
                <div style="display:flex;gap:3px;">${saveBtn}${loadBtn}${delBtn}</div>
            </div>
            ${info}
        </div>`;
    }).join('');
}
