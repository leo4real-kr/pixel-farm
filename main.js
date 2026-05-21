// ── 게임 속도 제어 ───────────────────────────────────
function setGameSpeed(speed) {
    gameSpeed = speed;
    // speed-btn 전체 active 제거
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    const speedDisplay = document.getElementById('speedDisplay');

    if (speed === 0) {
        speedDisplay.innerText = '일시정지';
        document.getElementById('time-pause').classList.add('active');
        clearInterval(gameInterval); gameInterval = null;
    } else if (speed === 1) {
        speedDisplay.innerText = '1배속';
        document.getElementById('time-x1').classList.add('active');
        restartTimer(15000);
    } else if (speed === 2) {
        speedDisplay.innerText = '2배속';
        document.getElementById('time-x2').classList.add('active');
        restartTimer(5000);
    }
}

// ── 메인 게임 루프 ───────────────────────────────────
function restartTimer(ms) {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(tick, ms);
}

function tick() {
    // 1. 날짜/계절 진행
    gameDays++;
    absoluteDays++;
    document.getElementById('dayDisplay').innerText = gameDays;

    if      (gameDays <= 30)  currentSeason = '봄';
    else if (gameDays <= 60)  currentSeason = '여름';
    else if (gameDays <= 90)  currentSeason = '가을';
    else if (gameDays <= 120) currentSeason = '겨울';
    else { gameDays = 1; currentSeason = '봄'; }
    document.getElementById('seasonDisplay').innerText = currentSeason;

    // 계절 전환 시 폭염/냉해 잔류 방지
    if (gameDays === 1 || gameDays === 31 || gameDays === 61 || gameDays === 91) {
        if (currentWeather === '폭염' || currentWeather === '냉해') {
            currentWeather = '맑음';
            document.getElementById('weatherDisplay').innerText = currentWeather;
        }
    }

    // 계절 전환 첫날 — 시즌 작물 강제 폐기 + 사과나무 계절 처리
    if (gameDays === 31 || gameDays === 61 || gameDays === 91 || gameDays === 1) {
        let discarded = 0;
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const t = farmGrid[x][y];
                if (!t.isUnlocked) continue;

                // 사과나무 계절 처리
                if (t.type === 5) {
                    if (gameDays === 91) {
                        // 가을 진입 — 사과 성장 시작
                        t.progress = 0;
                    } else if (gameDays === 61) {
                        // 여름 진입 — 초록 열매 단계
                        if (t.treeHarvestCount > 0) t.progress = 50;
                    } else if (gameDays === 31) {
                        // 봄 진입 — 꽃나무 단계 (2년차 이후)
                        if (t.treeHarvestCount > 0) {
                            t.progress = 30;
                            t.treeHarvested = false; // 수확 플래그 초기화
                            addSysLog('🌸 사과나무에 꽃이 피었습니다!');
                        }
                    } else if (gameDays === 1) {
                        // 봄 진입 (새 사이클)
                        if (t.treeHarvestCount > 0) {
                            t.progress = 30;
                            t.treeHarvested = false; // 수확 플래그 초기화
                            addSysLog('🌸 사과나무에 꽃이 피었습니다!');
                        } else {
                            t.progress = Math.min(t.progress + 20, 90);
                        }
                    }
                    continue;
                }

                if (t.type < 6 || t.isRotten) continue;
                const crop = SEASONAL_CROPS[t.type];
                if (crop && crop.season !== currentSeason) {
                    t.isRotten = true;
                    t.rottenCause = 'season';
                    discarded++;
                }
            }
        }
        if (discarded > 0)
            addSysLog(`🍂 계절 전환! ${discarded}칸의 계절 작물이 폐기됐습니다. 수확/개간으로 정리하세요.`);
    }

    // 2. 날씨 전환
    tickWeather();

    // 3. 임신 쿨다운
    tickPregnancyCooldown();

    // 4. 영토 카운트
    const unlockedCount = updateUnlockedCountDisplay();

    // 5. 엔딩 체크 (대지주 / 명문가 카운트다운)
    // 명문가 진행 중이면 대지주 체크 스킵
    if (dynastyStartDay === -1 && unlockedCount >= 625) {
        if (fullUnlockDay === -1) {
            fullUnlockDay = absoluteDays;
            addSysLog('🌾 625칸 개간 완료! 이 상태로 240일을 버텨내면 대지주 엔딩 달성!');
        }
        const survived = absoluteDays - fullUnlockDay;
        if (survived >= 240) { triggerEnding('landlord'); return; }
        document.getElementById('expense-warning').innerText =
            `🌾 대지주 카운트다운: ${survived} / 240일 경과`;
    } else if (dynastyStartDay === -1) {
        fullUnlockDay = -1;
    }

    // 3대 명문가 엔딩 카운트다운
    if (dynastyStartDay !== -1) {
        const dynastyDays = absoluteDays - dynastyStartDay;
        const remaining = 120 - dynastyDays;
        if (dynastyDays >= 120) { triggerEnding('dynasty'); return; }
        document.getElementById('expense-warning').innerText =
            `👑 명문가 엔딩까지 ${remaining}일 남음`;
        if (remaining <= 30 && remaining > 0 && gameDays % 10 === 0)
            addSysLog(`👑 명문가 엔딩까지 ${remaining}일 남았습니다. 파산하지 마세요!`);
    }

    // 6. 타일 1차 수집 — 사전 카운트 (weedCount, treePositions, cornPositions)
    const weedTiles = [], dryTiles = [], rottenTiles = [];
    const treePositions = [], cornPositions = [];
    let weedCount = 0;

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const t = farmGrid[x][y];
            if (!t.isUnlocked) continue;
            if (t.hasWeed) weedCount++;
            if (t.type === 5 && t.progress >= 100) treePositions.push({x, y});
            if (t.type === 3) cornPositions.push({x, y});
        }
    }

    // 7. 타일 효과 적용 — weedCount는 사전 집계값 사용
    // 병충해 신규 발생 감지를 위해 적용 전 감염 수 스냅샷
    let pestCountBefore = 0;
    for (let x = 0; x < GRID_SIZE; x++)
        for (let y = 0; y < GRID_SIZE; y++)
            if (farmGrid[x][y].hasPest) pestCountBefore++;

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const tile = farmGrid[x][y];
            if (!tile.isUnlocked) continue;

            const nearTree = treePositions.some(t => Math.abs(t.x-x) <= 1 && Math.abs(t.y-y) <= 1);
            const nearCorn = cornPositions.some(c => Math.abs(c.x-x) <= 1 && Math.abs(c.y-y) <= 1);

            applyWaterDrain(tile, nearTree);
            applyFrost(tile);
            applyOverwater(tile);
            applyPest(tile, x, y, weedCount);
            applyWeedSpawn(tile, nearCorn);
            if (!dustDays) applyGrowth(tile); // 황사 중 성장 정지
        }
    }

    // 인카운터 효과 틱 처리
    processEncounterEffects();

    // 랜덤 인카운터 체크 (매 5일)
    if (absoluteDays % 5 === 0 && !encounterActive) checkEncounter();

    // 병충해 신규 발생 알림 (이번 틱에 새로 감염된 타일이 있을 때만)
    let pestCountAfter = 0;
    for (let x = 0; x < GRID_SIZE; x++)
        for (let y = 0; y < GRID_SIZE; y++)
            if (farmGrid[x][y].hasPest) pestCountAfter++;
    if (pestCountAfter > pestCountBefore)
        addSysLog(`🐛 병충해 발생! ${pestCountAfter - pestCountBefore}곳에 새로 감염됐습니다. 농약 살포 또는 잡초 관리가 필요합니다.`);

    // ripeTiles는 타일 효과 적용 완료 후 수집 — 부패 전환된 타일 제외
    const ripeTiles = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const tile = farmGrid[x][y];
            if (!tile.isUnlocked) continue;
            if (tile.hasWeed)  weedTiles.push(tile);
            if (tile.water <= 50) dryTiles.push(tile);
            if (tile.type > 0 && tile.type !== 5 && tile.progress >= 100 && !tile.isRotten)
                ripeTiles.push({tile, x, y});
            if (tile.type > 0 && tile.isRotten) rottenTiles.push(tile);
        }
    }

    // 8. 가족 행동 & 스킬 절감 계수 획득
    const spouseSkillCut = runFamilyActions(dryTiles, weedTiles, ripeTiles, rottenTiles);

    // 9. 지출 계산
    const { baseLiving, finalChildCost, adultChildCount } = calculateDailyCost(spouseSkillCut);
    processMortgage();
    const expEl = document.getElementById('expense-warning');

    if (fullUnlockDay === -1 && dynastyStartDay === -1) {
        expEl.innerText = `${currentSeason === '겨울' ? '⚠️ ' : ''}가족 부양: -$${baseLiving}`;
        if (finalChildCost > 0)
            expEl.innerText += ` | 자녀 양육비: -$${finalChildCost}`;
        if (adultChildCount > 0)
            expEl.innerText += ` | 청년 ${adultChildCount}명 생활비 분담 중`;
        if (mortgageActive)
            expEl.innerText += ` | 🏠 담보 상환 ${mortgageDaysLeft}일 남음`;
    }

    updateFinancials('지출', baseLiving, `${currentSeason} 가계 소비액`);
    if (finalChildCost > 0)
        updateFinancials('지출', finalChildCost,
            `자녀 양육/교육비 (${children.filter(c => c.age <= 30).length}명)`);

    // 10. 이자
    applyInterests();

    // 11. 엔딩 판정 (파산/억만장자/단절)
    const totalDebt = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
    if (totalDebt >= getLoanLimit()) { triggerEnding('bankruptcy'); return; }
    if (fixedLoanAmount === 0 && money > 0 && money >= BILLIONAIRE_GOAL) { triggerEnding('billionaire'); return; }
    if (absoluteDays >= RETIRE_DAY && !children.some(c => c.age >= 31)) {
        triggerEnding('extinction'); return;
    }

    // 12. 결혼 이벤트 체크 — 매 계절 첫날 재시도
    if (gameDays === 1 || gameDays === 31 || gameDays === 61 || gameDays === 91) {
        if (!hasSpouse) marriageEventFired = false; // 계절 전환 시 재도전 허용
    }
    if (gameDays % 30 === 1 && !hasSpouse && !marriageEventFired &&
        money >= 3000 && unlockedCount >= 20) {
        triggerDiceEvent('marriage');
    }

    // SS급 배우자 조건 체크 (매 10일) — 일반 결혼 이벤트와 중복 방지
    if (absoluteDays % 10 === 0 && !hasSpouse && !marriageEventFired) checkSSMarriage();

    // 베아트리체 귀족 엔딩 — 아들 출산 시 발동
    if (nobleEnding) { triggerEnding('noble'); return; }

    // 13. 자동 저장 (매 5일)
    if (gameDays % 5 === 0) autoSave();

    // 14. UI 갱신
    updateFamilyUI();
}

// ── 게임 초기화 ──────────────────────────────────────
function resetGame(forceReset = false) {
    if (!forceReset && !confirm('농장을 초기화하고 1일차로 리셋하시겠습니까?')) return;

    money = 1000; totalRevenue = 0; totalExpense = 0; fixedLoanAmount = 0;
    gameDays = 1; absoluteDays = 1; fullUnlockDay = -1; dynastyStartDay = -1;
    mortgageActive = false; mortgageDaysLeft = 120; mortgageAmount = 0;
    ssSpouse = ''; loanLimitBonus = 0; sellBonusPct = 0; nobleEnding = false;
    festivalCount = 0; totalHarvestCount = 0; harvestTypeSet = new Set();
    ssMarriageEventFired = { beatrice: false, joan: false, scarlet: false };
    encounterActive = false; encounterCooldown = 0; ancestorBlessing = false;
    marketBonus = 0; marketBonusDays = 0; wormBonus = false; wormBonusDays = 0;
    frozenWaterDays = 0; droughtDouble = false; droughtDays = 0; dustDays = 0;
    hiredWorker = false; hiredWorkerDays = 0; presaleActive = false;
    injuredDays = 0; interestModifier = 0; interestModDays = 0; diceBonus = 0;
    firedOnce.clear();
    generation = 1; endingFired = false;
    currentSeason = '봄'; currentWeather = '맑음'; currentTool = 'select';
    hasSpouse = false; spouseName = ''; spouseGrade = 'C';
    isPregnant = false; pregnancyDays = 0; pregnancyCooldown = 0;
    marriageEventFired = false; spouseActionText = '대기 중';
    children = []; retiredFamily = [];
    Object.keys(toolDurability).forEach(k => { toolDurability[k] = -1; });
    ledgerLog = []; harvestLog = []; sysLog = [];

    const infoEl = document.getElementById('info');
    if (infoEl) infoEl.innerHTML = '';
    const miniEl = document.getElementById('info-mini');
    if (miniEl) miniEl.innerHTML = '';

    document.getElementById('ledger-list').innerHTML  = '<div style="color:#888;font-size:11px;">지출 내역 없음</div>';
    document.getElementById('harvest-list').innerHTML = '<div style="color:#888;font-size:11px;">수확 기록 없음</div>';
    document.getElementById('fixed-loan-display').innerText = '$0';

    farmGrid = initGrid();
    selectTool('select');

    if (forceReset) {
        // 엔딩 후 리셋 — 타이틀 화면으로 복귀
        const ts = document.getElementById('title-screen');
        if (ts) {
            ts.style.display = 'flex';
            document.getElementById('title-step-1').style.display = 'block';
            document.getElementById('title-step-2').style.display = 'none';
            document.getElementById('title-step-3').style.display = 'none';
            document.getElementById('title-step-4').style.display = 'none';
            document.getElementById('title-name-input').value = '';
            openingCutIndex = 0;
        }
    } else {
        updateFinancials('수입', 0, '회계 장부 개설');
        updateUnlockedCountDisplay();
        setGameSpeed(1);
    }
}

// ── 애니메이션 루프 ──────────────────────────────────
function animate() {
    animTimer += 0.05;
    drawGame();
    requestAnimationFrame(animate);
}

// ── 오프닝 스토리 컷 정의 ───────────────────────────
const OPENING_CUTS = [
    {
        img: 'images/opening1.jpg',
        text: `그야말로 잘 나가는 사장님이었다.<br><br>
               <span style="color:#aaa;">도시의 불빛만큼이나 미래가 밝아 보였던 그 시절.</span>`
    },
    {
        img: 'images/opening2.jpg',
        text: `하지만 사람 좋은 동네에서 의심 없이 살았던 게 문제였을까.<br><br>
               <span style="color:#e57373;">정신을 차려보니 몸뚱이 하나도 겨우 건질 수 있었다.</span>`
    },
    {
        img: 'images/opening3.jpg',
        text: `그때 더 큰 좌절이 찾아왔다.<br><br>
               <b style="color:#ccc;">부모님의 사망.</b><br><br>
               <span style="color:#aaa;">정신없이 장례를 치르고, 돌아갈 곳을 생각해보니<br>
               낡은 고향집과 황무지 같은 밭뙈기뿐이었다.</span>`
    },
    {
        img: 'images/opening4.jpg',
        text: `수중에 남은 것은 <b style="color:#ffb74d;">$1,000</b>.<br>
               그리고 흙냄새 나는 이 땅.<br><br>
               <span style="color:#a5d66a; font-size:15px;"><b>그래. 다시 시작해보자.</b></span>`
    },
];

let openingCutIndex = 0;

function showOpeningCut(index) {
    const cut = OPENING_CUTS[index];
    const container = document.getElementById('opening-cut-container');
    const img       = document.getElementById('opening-cut-img');
    const text      = document.getElementById('opening-cut-text');
    const btn       = document.getElementById('opening-next-btn');
    const progress  = document.getElementById('opening-progress');

    // 이미지 페이드
    container.style.opacity = '0';
    setTimeout(() => {
        img.src = cut.img;
        text.innerHTML = cut.text;
        progress.innerText = `${index + 1} / ${OPENING_CUTS.length}`;
        container.style.opacity = '1';
    }, 300);

    // 마지막 컷이면 버튼 텍스트 변경
    btn.innerText = index < OPENING_CUTS.length - 1 ? '다음 →' : '농장으로 →';
    btn.onclick = () => {
        if (openingCutIndex < OPENING_CUTS.length - 1) {
            openingCutIndex++;
            showOpeningCut(openingCutIndex);
        } else {
            titleNext(2);
        }
    };
}

function startOpening() {
    openingCutIndex = 0;
    showOpeningCut(0);
}

function skipOpening() {
    document.getElementById('title-step-2').style.display = 'none';
    document.getElementById('title-step-3').style.display = 'block';
    setTimeout(() => document.getElementById('title-name-input').focus(), 100);
}

// ── 타이틀 세이브 슬롯 렌더링 ───────────────────────
function renderTitleSaveSlots() {
    const container = document.getElementById('title-save-slots');
    if (!container) return;

    const allSlots = [
        { key: SAVE_AUTO,     label: '🔄 자동 저장' },
        { key: SAVE_SLOTS[0], label: '💾 슬롯 1' },
        { key: SAVE_SLOTS[1], label: '💾 슬롯 2' },
        { key: SAVE_SLOTS[2], label: '💾 슬롯 3' },
    ];

    const found = allSlots.filter(s => localStorage.getItem(s.key));
    if (found.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div style="color:#666; font-size:11px; margin-bottom:6px;">— 저장 파일 불러오기 —</div>
        ${found.map(s => {
            const d = JSON.parse(localStorage.getItem(s.key));
            const info = d ? `${d.playerName || '?'} | ${d.generation || 1}대 | ${d.gameDays || 1}일차 | $${d.money || 0}` : '';
            return `<button onclick="titleLoadSlot('${s.key}')"
                style="display:block; width:100%; background:#1e2e1e;
                       border:1px solid #3a5a2a; color:#a5d66a;
                       padding:7px 12px; margin-bottom:5px; border-radius:6px;
                       font-size:11px; cursor:pointer; text-align:left;">
                <b>${s.label}</b>
                <span style="color:#888; margin-left:8px;">${info}</span>
            </button>`;
        }).join('')}
    `;
}

function titleLoadSlot(key) {
    const raw = localStorage.getItem(key);
    if (!raw) { alert('저장 파일을 찾을 수 없습니다.'); return; }
    try {
        const d = JSON.parse(raw);
        if (!applySaveData(d)) return;
        document.getElementById('title-screen').style.display = 'none';
        refreshAllUI();
        if (!gameInterval) animate();
        setGameSpeed(1);
        addSysLog(`📂 ${key === SAVE_AUTO ? '자동 저장' : '슬롯'} 파일을 불러왔습니다.`);
    } catch (e) {
        alert('저장 파일을 읽을 수 없습니다.');
    }
}
function titleNext(step) {
    if (step === 1) {
        document.getElementById('title-step-1').style.display = 'none';
        document.getElementById('title-step-2').style.display = 'block';
        startOpening();
    } else if (step === 2) {
        document.getElementById('title-step-2').style.display = 'none';
        document.getElementById('title-step-3').style.display = 'block';
        setTimeout(() => document.getElementById('title-name-input').focus(), 100);
    } else if (step === 3) {
        const nameInput = document.getElementById('title-name-input').value.trim();
        playerName = nameInput || '플레이어';
        document.getElementById('title-step-3').style.display = 'none';
        document.getElementById('title-step-4').style.display = 'block';
    }
}

// 이름 입력창에서 Enter 키
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('title-name-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') titleNext(3);
    });
});

function startGame() {
    document.getElementById('title-screen').style.display = 'none';
    updateFamilyUI();
    updateFinancials('수입', 0, '회계 장부 개설');
    updateUnlockedCountDisplay();
    renderToolShop();
    setGameSpeed(1);
    animate();
}

// ── 초기 실행 ────────────────────────────────────────
(function init() {
    preloadImages(() => {
        resizeCanvas();
        centerViewOn(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
        renderTitleSaveSlots();
        // 타이틀 화면이 먼저 표시되고 startGame()에서 게임 시작
    });
})();
