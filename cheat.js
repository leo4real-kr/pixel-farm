// ── 치트 언락 — 브라우저 콘솔에서 unlockCheat() 입력 ─
function unlockCheat() {
    if (cheatUnlocked) { console.log('[Pixel Farm] 치트 이미 활성화됨.'); return; }
    cheatUnlocked = true;
    const panel = document.getElementById('cheat-panel');
    if (panel) panel.style.display = 'block';
    addSysLog('[SYSTEM] 테스터 치트 패널이 활성화되었습니다.');
    console.log('[Pixel Farm] 치트 패널 활성화 완료.');
}

// ── 치트 함수 ────────────────────────────────────────
function cheatAddMoney(amount) {
    if (!cheatUnlocked) return;
    updateFinancials('수입', amount, `[CHEAT] 자금 +$${amount}`);
    addSysLog(`[치트] $${amount} 주입 완료.`);
    playSound('harvest');
}

function cheatClearDebt() {
    if (!cheatUnlocked) return;
    if (fixedLoanAmount > 0) {
        money += fixedLoanAmount; totalRevenue += fixedLoanAmount;
        fixedLoanAmount = 0;
        document.getElementById('fixed-loan-display').innerText = '$0';
    }
    if (money < 0) { totalRevenue += Math.abs(money); money = 0; }
    const el = document.getElementById('moneyDisplay');
    el.innerText = money; el.style.color = '#ffb74d';
    addSysLog('[치트] 모든 부채가 탕감되었습니다.');
}

function cheatSkipDay(days) {
    if (!cheatUnlocked) return;
    gameDays = Math.min(gameDays + days, 120);
    absoluteDays += days;
    currentSeason = gameDays <= 30 ? '봄' : gameDays <= 60 ? '여름' : gameDays <= 90 ? '가을' : '겨울';
    document.getElementById('dayDisplay').innerText    = gameDays;
    document.getElementById('seasonDisplay').innerText = currentSeason;
    // 계절 전환 시 시즌 작물 강제 폐기
    let discarded = 0;
    for (let x = 0; x < GRID_SIZE; x++)
        for (let y = 0; y < GRID_SIZE; y++) {
            const t = farmGrid[x][y];
            if (!t.isUnlocked || t.type < 6 || t.isRotten) continue;
            const crop = SEASONAL_CROPS[t.type];
            if (crop && crop.season !== currentSeason) { t.isRotten = true; t.rottenCause = 'season'; discarded++; }
        }
    if (discarded > 0) addSysLog(`🍂 [치트] 계절 전환으로 ${discarded}칸 시즌 작물 폐기.`);
    addSysLog(`[치트] ${days}일 건너뜀. 현재 ${currentSeason} ${gameDays}일차.`);
}

function cheatSetSeason(season) {
    if (!cheatUnlocked) return;
    const map = { '봄': 1, '여름': 31, '가을': 61, '겨울': 91 };
    if (!map[season]) return;
    gameDays = map[season]; currentSeason = season;
    document.getElementById('dayDisplay').innerText    = gameDays;
    document.getElementById('seasonDisplay').innerText = currentSeason;
    addSysLog(`[치트] 계절을 ${season}(으)로 변경했습니다.`);
}

function cheatAddSpouse() {
    if (!cheatUnlocked) return;
    if (hasSpouse) { addSysLog('[치트] 이미 배우자가 있습니다.'); return; }
    hasSpouse = true;
    spouseGrade = ['C','B','A','S'][Math.floor(Math.random() * 4)];
    const names    = ['서연','민지','지윤','은우','수아','지아','하윤','은서'];
    const surnames = ['김','이','박','최','정'];
    spouseName = surnames[Math.floor(Math.random() * surnames.length)]
               + names[Math.floor(Math.random() * names.length)];
    marriageEventFired = true;
    updateFamilyUI();
    addSysLog(`[치트] 배우자 ${spouseName} [${spouseGrade}급] 즉시 영입 완료.`);
}

function cheatAddChild() {
    if (!cheatUnlocked) return;
    if (!hasSpouse) { addSysLog('[치트] 배우자가 없습니다.'); return; }
    if (children.length >= MAX_CHILDREN) { addSysLog(`[치트] 자녀 최대(${MAX_CHILDREN}명) 초과.`); return; }
    const name = ['첫째','둘째','셋째'][children.length];
    children.push({ name, grade: spouseGrade, age: 1, actionText: '대기 중' });
    updateFamilyUI();
    addSysLog(`[치트] 자녀 '${name}' [${spouseGrade}급] 즉시 등록 완료.`);
}