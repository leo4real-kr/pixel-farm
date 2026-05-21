// ── 랜덤 인카운터 시스템 ─────────────────────────────
// 인카운터 상태
let encounterActive    = false;  // 현재 인카운터 진행 중
let encounterCooldown  = 0;      // 쿨다운 (인카운터 후 일정 기간 재발생 방지)
let ancestorBlessing   = false;  // 조상 묘소 정비 → 부정적 인카운터 확률 감소
let marketBonus        = 0;      // 시장 판매가 보너스 % (임시)
let marketBonusDays    = 0;      // 보너스 남은 일수
let wormBonus          = false;  // 지렁이 성장 보너스
let wormBonusDays      = 0;      // 지렁이 보너스 남은 일수
let frozenWaterDays    = 0;      // 폭설 수분 동결 남은 틱
let droughtDouble      = false;  // 가뭄 수분 감소 2배
let droughtDays        = 0;      // 가뭄 남은 일수
let dustDays           = 0;      // 황사 남은 일수
let hiredWorker        = false;  // 임시 노동자 고용 중
let hiredWorkerDays    = 0;      // 남은 고용 일수
let presaleActive      = false;  // 작물 선물거래 활성
let injuredDays        = 0;      // 가장 부상 남은 일수
let interestModifier   = 0;      // 금리 인상/인하 임시 보정
let interestModDays    = 0;      // 금리 보정 남은 일수
let diceBonus          = 0;      // 다음 주사위 보너스 (배우자 생일)

// ── 1회성 발동 추적 ──────────────────────────────────
const firedOnce = new Set();

// ── 인카운터 발동 체크 (매 틱 호출) ──────────────────
function checkEncounter() {
    if (encounterActive || encounterCooldown > 0) {
        if (encounterCooldown > 0) encounterCooldown--;
        return;
    }

    // 기본 발생 확률 30%
    if (Math.random() > 0.30) return;

    // 발동 가능한 인카운터 필터링
    const pool = ENCOUNTERS.filter(e => {
        if (e.once && firedOnce.has(e.id)) return false;
        if (e.condition && !e.condition()) return false;
        return true;
    });
    if (pool.length === 0) return;

    // 가중치 기반 랜덤 뽑기
    let totalWeight = 0;
    const weighted = pool.map(e => {
        let w = e.weight || 10;
        // 조상 묘소 가호: 부정적 이벤트 가중치 절반
        if (ancestorBlessing && e.type === 'negative') w = Math.floor(w / 2);
        totalWeight += w;
        return { e, w };
    });

    let rand = Math.random() * totalWeight;
    let picked = weighted[weighted.length - 1].e;
    for (const { e, w } of weighted) {
        rand -= w;
        if (rand <= 0) { picked = e; break; }
    }

    fireEncounter(picked);
}

// ── 인카운터 발동 ─────────────────────────────────────
function fireEncounter(enc) {
    encounterActive = true;
    setGameSpeed(0);

    // 주사위 없는 단순 이벤트
    if (!enc.hasDice) {
        showEncounterModal(enc, null);
        return;
    }

    // 주사위 있는 이벤트 — 선택지 먼저 보여주고 주사위는 선택 후
    showEncounterModal(enc, null);
}

// ── 인카운터 모달 ─────────────────────────────────────
function showEncounterModal(enc, diceResult) {
    // 기존 모달 제거
    const old = document.getElementById('encounter-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'encounter-modal';
    modal.style.cssText = `
        position:fixed; top:0; left:0; width:100vw; height:100vh;
        background:rgba(0,0,0,0.88); display:flex; justify-content:center;
        align-items:center; z-index:9998;
    `;

    const typeColor = enc.type === 'negative' ? '#e57373'
                    : enc.type === 'positive'  ? '#81c784'
                    : '#ffb74d';

    let diceHTML = '';
    if (diceResult !== null) {
        diceHTML = `<div style="text-align:center;margin:10px 0;">
            <div style="font-size:28px;letter-spacing:8px;">${diceResult.rolls.map(r => ['⚀','⚁','⚂','⚃','⚄','⚅'][r-1]).join(' ')}</div>
            <div style="color:#ffb74d;font-size:13px;margin-top:4px;">합계: ${diceResult.total}</div>
        </div>`;
    }

    const btnHTML = enc.choices.map((c, i) =>
        `<button onclick="resolveEncounter('${enc.id}', ${i}, ${diceResult ? diceResult.total : -1})"
            style="background:${i===0?'#388e3c':'#555'};color:#fff;border:none;padding:10px 20px;
            font-size:13px;border-radius:6px;cursor:pointer;margin:4px;min-width:120px;">
            ${c.label}
        </button>`
    ).join('');

    modal.innerHTML = `
        <div style="background:#1e2a1e;border:2px solid ${typeColor};border-radius:12px;
                    padding:24px 28px;max-width:380px;width:92%;text-align:center;">
            <div style="font-size:24px;margin-bottom:6px;">${enc.emoji}</div>
            <div style="font-size:15px;color:${typeColor};font-weight:bold;margin-bottom:8px;">${enc.title}</div>
            <div style="font-size:12px;color:#ccc;margin-bottom:12px;line-height:1.6;">${enc.desc}</div>
            ${diceHTML}
            <div style="display:flex;flex-wrap:wrap;justify-content:center;margin-top:8px;">${btnHTML}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ── 인카운터 해결 ─────────────────────────────────────
function resolveEncounter(id, choiceIdx, diceTotal) {
    const enc = ENCOUNTERS.find(e => e.id === id);
    if (!enc) return;

    const choice = enc.choices[choiceIdx];

    // 주사위가 필요한 선택지인데 아직 굴리지 않음
    if (choice.needDice && diceTotal === -1) {
        const rollCount = choice.diceCount || 2;
        const rolls = Array.from({ length: rollCount }, () => Math.floor(Math.random() * 6) + 1);
        const total  = rolls.reduce((a, b) => a + b, 0) + diceBonus;
        diceBonus = 0; // 보너스 소비
        showEncounterModal(enc, { rolls, total });
        // 버튼 다시 클릭 시 diceTotal이 넘어옴
        return;
    }

    // 결과 처리
    const result = choice.resolve(diceTotal);

    // 1회성 이벤트 기록 — resolve 완료 후 세팅 (trySpend 실패 시 소진 방지)
    if (enc.once && result && result !== '자금 부족!') firedOnce.add(enc.id);

    // 모달 제거
    const modal = document.getElementById('encounter-modal');
    if (modal) modal.remove();

    encounterActive = false;
    encounterCooldown = 10; // 10틱 쿨다운
    addSysLog(`📋 [인카운터] ${enc.title}: ${result}`);
    setGameSpeed(1);
}

// ── presaleActive 해제 (수확 1회 후 input.js에서 호출) ──
function clearPresale() {
    presaleActive = false;
    addSysLog('🤝 선물거래 계약 완료. 이후 수확은 정상 판매됩니다.');
}

// ── 효과 틱 처리 (매 틱 호출) ────────────────────────
function processEncounterEffects() {
    // 시장 보너스/패널티
    if (marketBonusDays > 0) {
        marketBonusDays--;
        if (marketBonusDays === 0) {
            marketBonus = 0;
            addSysLog('📋 시장 가격 변동 효과 종료.');
        }
    }
    // marketBonus 상하한 클램프 (-30% ~ +50%)
    marketBonus = Math.max(-30, Math.min(50, marketBonus));
    // 지렁이 보너스
    if (wormBonusDays > 0) {
        wormBonusDays--;
        if (wormBonusDays === 0) { wormBonus = false; addSysLog('🪱 지렁이 효과 종료.'); }
    }

    // 폭설 수분 동결
    if (frozenWaterDays > 0) frozenWaterDays--;

    // 가뭄 2배속
    if (droughtDays > 0) {
        droughtDays--;
        if (droughtDays === 0) { droughtDouble = false; addSysLog('☀️ 가뭄 예보 기간 종료.'); }
    }

    // 황사
    if (dustDays > 0) dustDays--;

    // 임시 노동자
    if (hiredWorker && hiredWorkerDays > 0) {
        hiredWorkerDays--;
        // 매 틱 잡초 제거 + 급수
        for (let x = 0; x < GRID_SIZE; x++)
            for (let y = 0; y < GRID_SIZE; y++) {
                const t = farmGrid[x][y];
                if (!t.isUnlocked) continue;
                if (t.hasWeed) t.hasWeed = false;
                if (t.water < 40) t.water = Math.min(80, t.water + 20);
            }
        if (hiredWorkerDays === 0) { hiredWorker = false; addSysLog('👷 임시 노동자 계약 종료.'); }
    }

    // 금리 보정
    if (interestModDays > 0) interestModDays--;
    else interestModifier = 0;

    // 부상
    if (injuredDays > 0) injuredDays--;
}

// ── 헬퍼: 랜덤 개간 타일 가져오기 ───────────────────
function getRandomUnlocked(count, filter) {
    const tiles = [];
    for (let x = 0; x < GRID_SIZE; x++)
        for (let y = 0; y < GRID_SIZE; y++) {
            const t = farmGrid[x][y];
            if (t.isUnlocked && (!filter || filter(t, x, y))) tiles.push({ t, x, y });
        }
    const shuffled = tiles.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// ── 인카운터 목록 ─────────────────────────────────────
const ENCOUNTERS = [

    // ── 날씨/자연재해 ─────────────────────────────────
    {
        id: 'heavy_rain', weight: 15, once: false, emoji: '🌧️', title: '갑작스러운 폭우',
        type: 'mixed', hasDice: false,
        desc: '갑작스러운 폭우가 쏟아집니다!\n전체 작물 수분이 크게 올랐지만 과수분 위험이 있습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                getRandomUnlocked(999, () => true).forEach(({ t }) => { t.water = Math.min(100, t.water + 30); });
                return '전체 수분 +30';
            }
        }]
    },
    {
        id: 'drought_warning', weight: 12, once: false, emoji: '☀️', title: '가뭄 예보',
        type: 'negative', hasDice: false,
        desc: '앞으로 한동안 비가 오지 않을 것 같습니다.\n수분 감소 속도가 2배로 빨라집니다. (20일)',
        choices: [{
            label: '확인',
            resolve: () => { droughtDouble = true; droughtDays = 20; return '수분 감소 2배 (20일)'; }
        }]
    },
    {
        id: 'hail', weight: 12, once: false, emoji: '🌨️', title: '우박',
        type: 'negative', hasDice: false,
        desc: '우박이 작물을 강타합니다!\n랜덤 3~5칸의 작물이 피해를 입었습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                const count = 3 + Math.floor(Math.random() * 3);
                const tiles = getRandomUnlocked(count, t => t.type > 0 && !t.isRotten);
                tiles.forEach(({ t }) => { t.progress = Math.max(0, t.progress - 30); });
                return `${tiles.length}칸 progress -30`;
            }
        }]
    },
    {
        id: 'frost', weight: 10, once: false, emoji: '🥶', title: '서리',
        type: 'negative', hasDice: false,
        condition: () => currentSeason === '봄' || currentSeason === '가을',
        desc: '밤 사이 서리가 내렸습니다!\n냉해에 취약한 작물이 피해를 입었습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                const tiles = getRandomUnlocked(2, t => t.type > 0 && !t.isRotten && t.type !== 11);
                tiles.forEach(({ t }) => { t.isRotten = true; t.rottenCause = 'frost'; });
                return `${tiles.length}칸 냉해 피해`;
            }
        }]
    },
    {
        id: 'rainbow', weight: 5, once: false, emoji: '🌈', title: '무지개',
        type: 'positive', hasDice: false,
        desc: '적당한 비 뒤에 아름다운 무지개가 떴습니다!\n전체 수분이 살짝 보충됩니다.',
        choices: [{
            label: '감사히 받겠습니다',
            resolve: () => {
                getRandomUnlocked(999, () => true).forEach(({ t }) => { t.water = Math.min(90, t.water + 15); });
                return '전체 수분 +15';
            }
        }]
    },
    {
        id: 'yellow_dust', weight: 10, once: false, emoji: '🌫️', title: '황사',
        type: 'negative', hasDice: false,
        condition: () => currentSeason === '봄',
        desc: '황사가 밀려옵니다!\n이번 틱 성장이 없고 잡초가 빠르게 번집니다. (5일)',
        choices: [{
            label: '확인',
            resolve: () => {
                dustDays = 5;
                // 랜덤 4칸 잡초 발생
                getRandomUnlocked(4, t => t.isUnlocked && !t.hasWeed).forEach(({ t }) => { t.hasWeed = true; });
                return '황사 5일, 잡초 4칸 추가 발생';
            }
        }]
    },
    {
        id: 'spring_rain', weight: 18, once: false, emoji: '🌦️', title: '봄비',
        type: 'positive', hasDice: false,
        condition: () => currentSeason === '봄',
        desc: '촉촉한 봄비가 내립니다.\n농장 전체가 적당히 촉촉해졌습니다.',
        choices: [{
            label: '반갑습니다',
            resolve: () => {
                getRandomUnlocked(999, () => true).forEach(({ t }) => { t.water = Math.min(80, t.water + 20); });
                return '전체 수분 +20';
            }
        }]
    },
    {
        id: 'typhoon', weight: 4, once: true, emoji: '🌀', title: '태풍 예보',
        type: 'negative', hasDice: true,
        desc: '강력한 태풍이 접근 중입니다!\n미리 대비하시겠습니까?\n\n[대비 $200] 선택 후 주사위를 굴립니다.\n높을수록 피해를 완벽히 막습니다.',
        choices: [
            {
                label: '대비하기 ($200)', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (!trySpend(200, '태풍 대비')) return '자금 부족으로 대비 실패!';
                    if (total >= 9) return '태풍 완벽 대비! 피해 없음.';
                    const count = 12 - total;
                    getRandomUnlocked(count, t => t.type > 0).forEach(({ t }) => { t.progress = Math.max(0, t.progress - 20); });
                    return `주사위 ${total} — 부분 피해: ${count}칸 progress -20`;
                }
            },
            {
                label: '무시하기',
                resolve: () => {
                    getRandomUnlocked(5, t => t.type > 0).forEach(({ t }) => { t.progress = 0; });
                    return '태풍 직격! 5칸 progress 0';
                }
            }
        ]
    },
    {
        id: 'blizzard', weight: 10, once: false, emoji: '❄️', title: '폭설',
        type: 'negative', hasDice: false,
        condition: () => currentSeason === '겨울',
        desc: '폭설이 쏟아집니다!\n수분 게이지가 3틱 동안 동결됩니다.',
        choices: [{
            label: '확인',
            resolve: () => { frozenWaterDays = 3; return '수분 동결 3틱'; }
        }]
    },
    {
        id: 'lightning', weight: 8, once: false, emoji: '⚡', title: '천둥번개',
        type: 'negative', hasDice: false,
        desc: '번개가 농장 근처에 떨어졌습니다!\n작물 1칸이 즉시 부패했습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                const tiles = getRandomUnlocked(1, t => t.type > 0 && !t.isRotten);
                if (tiles.length > 0) { tiles[0].t.isRotten = true; tiles[0].t.rottenCause = 'lightning'; }
                return '랜덤 1칸 즉시 부패';
            }
        }]
    },

    // ── 병해충/동물 ───────────────────────────────────
    {
        id: 'locust', weight: 20, once: false, emoji: '🦗', title: '메뚜기 떼',
        type: 'negative', hasDice: false,
        desc: '메뚜기 떼가 출몰했습니다!\n밭에 잡초가 급격히 번집니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                const count = 4 + Math.floor(Math.random() * 3);
                getRandomUnlocked(count, t => !t.hasWeed).forEach(({ t }) => { t.hasWeed = true; });
                return `잡초 ${count}칸 발생`;
            }
        }]
    },
    {
        id: 'mole', weight: 18, once: false, emoji: '🐾', title: '두더지',
        type: 'negative', hasDice: false,
        desc: '두더지가 밭을 헤집었습니다!\n2칸의 수분이 사라졌습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                getRandomUnlocked(2, t => t.isUnlocked).forEach(({ t }) => { t.water = 0; });
                return '랜덤 2칸 수분 0';
            }
        }]
    },
    {
        id: 'birds', weight: 15, once: false, emoji: '🐦', title: '철새 떼',
        type: 'negative', hasDice: false,
        condition: () => currentSeason === '봄' || currentSeason === '가을',
        desc: '철새 떼가 씨앗을 쪼아먹었습니다!\n씨앗 단계 작물이 소실됐습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                const tiles = getRandomUnlocked(2, t => t.type > 0 && t.progress < 30);
                tiles.forEach(({ t }) => { clearTile(t); });
                return `씨앗 단계 ${tiles.length}칸 소실`;
            }
        }]
    },
    {
        id: 'deer', weight: 12, once: false, emoji: '🦌', title: '고라니 출몰',
        type: 'negative', hasDice: false,
        desc: '고라니가 밭을 습격했습니다!\n작물 3칸이 피해를 입었습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                getRandomUnlocked(3, t => t.type > 0 && !t.isRotten)
                    .forEach(({ t }) => { t.progress = Math.max(0, t.progress - 20); });
                return '랜덤 3칸 progress -20';
            }
        }]
    },
    {
        id: 'ladybug', weight: 8, once: false, emoji: '🐞', title: '무당벌레',
        type: 'positive', hasDice: false,
        desc: '천적 무당벌레가 나타났습니다!\n병충해가 자동으로 제거됩니다.',
        choices: [{
            label: '반갑습니다',
            resolve: () => {
                const tiles = getRandomUnlocked(3, t => t.hasPest);
                tiles.forEach(({ t }) => { t.hasPest = false; t.pestDays = 0; });
                return `병충해 ${tiles.length}칸 제거`;
            }
        }]
    },
    {
        id: 'earthworm', weight: 6, once: false, emoji: '🪱', title: '지렁이 대발생',
        type: 'positive', hasDice: false,
        desc: '지렁이가 땅을 비옥하게 합니다!\n당분간 작물 성장이 빨라집니다. (15일)',
        choices: [{
            label: '좋아요',
            resolve: () => { wormBonus = true; wormBonusDays = 15; return '성장속도 +20% (15일)'; }
        }]
    },
    {
        id: 'crow', weight: 15, once: false, emoji: '🐦‍⬛', title: '까마귀 떼',
        type: 'negative', hasDice: true,
        desc: '까마귀 떼가 밭을 노립니다!\n허수아비를 설치하시겠습니까?\n\n[설치 $50] 선택 후 주사위 — 높을수록 효과 좋음.',
        choices: [
            {
                label: '허수아비 설치 ($50)', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (!trySpend(50, '허수아비 설치')) return '자금 부족!';
                    if (total >= 8) return `주사위 ${total} — 허수아비 완벽 효과! 피해 없음.`;
                    const tiles = getRandomUnlocked(2, t => t.type > 0 && t.progress < 30);
                    tiles.forEach(({ t }) => clearTile(t));
                    return `주사위 ${total} — 일부 피해: 씨앗 ${tiles.length}칸 소실`;
                }
            },
            {
                label: '무시하기',
                resolve: () => {
                    const tiles = getRandomUnlocked(3, t => t.type > 0 && t.progress < 30);
                    tiles.forEach(({ t }) => clearTile(t));
                    return `씨앗 ${tiles.length}칸 소실`;
                }
            }
        ]
    },
    {
        id: 'snail', weight: 18, once: false, emoji: '🐌', title: '달팽이',
        type: 'negative', hasDice: false,
        desc: '달팽이가 잎을 갉아먹습니다!\n작물 2칸에 병충해가 발생했습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                getRandomUnlocked(2, t => t.type > 0 && !t.hasPest)
                    .forEach(({ t }) => { t.hasPest = true; });
                return '랜덤 2칸 병충해 발생';
            }
        }]
    },
    {
        id: 'bee', weight: 6, once: false, emoji: '🐝', title: '꿀벌',
        type: 'positive', hasDice: false,
        desc: '꿀벌이 날아왔습니다!\n이번 수확의 판매가가 10% 올랐습니다.',
        choices: [{
            label: '반갑습니다',
            resolve: () => { marketBonus += 10; marketBonusDays = 10; return '판매가 +10% (10일)'; }
        }]
    },
    {
        id: 'boar', weight: 3, once: false, emoji: '🐗', title: '멧돼지',
        type: 'negative', hasDice: false,
        desc: '멧돼지가 밭을 뒤집었습니다!\n개간된 4칸이 다시 잠겼습니다.',
        condition: () => {
            let cnt = 0;
            for (let x = 0; x < GRID_SIZE; x++)
                for (let y = 0; y < GRID_SIZE; y++)
                    if (farmGrid[x][y].isUnlocked && !BASE_TILES.has(`${x},${y}`)) cnt++;
            return cnt >= 4;
        },
        choices: [{
            label: '확인',
            resolve: () => {
                const tiles = getRandomUnlocked(4, (t, x, y) => !BASE_TILES.has(`${x},${y}`));
                tiles.forEach(({ t, x, y }) => {
                    farmGrid[x][y] = {
                        type: 0, progress: 0, water: 0, hasWeed: false,
                        isRotten: false, rottenCause: '', isUnlocked: false,
                        hasPest: false, pestDays: 0, overRipeDays: 0,
                        overWaterDays: 0, droughtDays: 0, treeHarvestCount: 0
                    };
                });
                updateUnlockedCountDisplay();
                return '랜덤 4칸 개간 취소';
            }
        }]
    },

    // ── NPC/사건 ──────────────────────────────────────
    {
        id: 'wanderer', weight: 8, once: true, emoji: '🧑‍🌾', title: '떠돌이 농부',
        type: 'mixed', hasDice: true,
        desc: '도움을 요청하는 떠돌이 농부가 왔습니다.\n도와주시겠습니까?\n\n[도움 $100] 선택 후 주사위 — 보상이 달라집니다.',
        choices: [
            {
                label: '도움주기 ($100)', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (!trySpend(100, '떠돌이 농부 도움')) return '자금 부족!';
                    if (total >= 10) {
                        updateFinancials('수입', 200, '농부 감사 보답');
                        return `주사위 ${total} — 농부가 크게 보답! +$200`;
                    }
                    if (total >= 7) { marketBonus += 5; marketBonusDays = 10; return `주사위 ${total} — 농부가 씨앗 정보를 알려줬습니다. 판매가 +5% (10일)`; }
                    return `주사위 ${total} — 농부가 감사 인사만 하고 떠났습니다.`;
                }
            },
            { label: '거절하기', resolve: () => '아무 일 없음.' }
        ]
    },
    {
        id: 'advisor', weight: 6, once: false, emoji: '👨‍💼', title: '농업 지도사 방문',
        type: 'positive', hasDice: false,
        desc: '농업 지도사가 농장을 점검합니다.\n특정 작물의 성장이 빨라집니다!',
        choices: [{
            label: '감사합니다',
            resolve: () => {
                // 가장 많이 심어진 작물 타입 찾기
                const typeCount = {};
                for (let x = 0; x < GRID_SIZE; x++)
                    for (let y = 0; y < GRID_SIZE; y++) {
                        const t = farmGrid[x][y];
                        if (t.isUnlocked && t.type > 0) typeCount[t.type] = (typeCount[t.type] || 0) + 1;
                    }
                const topType = Object.keys(typeCount).sort((a,b) => typeCount[b]-typeCount[a])[0];
                if (!topType) return '조언할 작물이 없습니다.';
                for (let x = 0; x < GRID_SIZE; x++)
                    for (let y = 0; y < GRID_SIZE; y++) {
                        const t = farmGrid[x][y];
                        if (t.isUnlocked && t.type === parseInt(topType))
                            t.progress = Math.min(100, t.progress + 20);
                    }
                return `${getCropName(parseInt(topType))} progress +20`;
            }
        }]
    },
    {
        id: 'thief', weight: 10, once: false, emoji: '🦹', title: '도둑',
        type: 'negative', hasDice: false,
        desc: '밤 사이 도둑이 들었습니다!\n수확 가능한 작물이 도난당했습니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                const tiles = getRandomUnlocked(2, t => t.type > 0 && t.progress >= 100 && !t.isRotten);
                tiles.forEach(({ t }) => clearTile(t));
                return `수확기 작물 ${tiles.length}칸 도난`;
            }
        }]
    },
    {
        id: 'neighbor_gift', weight: 8, once: false, emoji: '🎁', title: '이웃 농부 선물',
        type: 'positive', hasDice: false,
        desc: '이웃 농부가 씨앗을 나눠줬습니다!\n현재 계절에 맞는 씨앗을 무료로 받았습니다.',
        choices: [{
            label: '감사합니다',
            resolve: () => {
                updateFinancials('수입', 80, '이웃 농부 씨앗 선물 (현금 환산)');
                return '씨앗 선물 (현금 $80 환산)';
            }
        }]
    },
    {
        id: 'merchant', weight: 7, once: true, emoji: '🛒', title: '행상인',
        type: 'mixed', hasDice: true,
        desc: '희귀 씨앗을 파는 행상인이 왔습니다.\n구매하시겠습니까?\n\n[구매 $150] 선택 후 주사위 — 품질이 달라집니다.',
        choices: [
            {
                label: '구매하기 ($150)', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (!trySpend(150, '행상인 씨앗 구매')) return '자금 부족!';
                    if (total >= 10) { marketBonus += 20; marketBonusDays = 15; return `주사위 ${total} — 명품 씨앗! 판매가 +20% (15일)`; }
                    if (total >= 7)  { marketBonus += 10; marketBonusDays = 10; return `주사위 ${total} — 좋은 씨앗. 판매가 +10% (10일)`; }
                    return `주사위 ${total} — 불량품이었습니다. 환불 불가.`;
                }
            },
            { label: '거절하기', resolve: () => '아무 일 없음.' }
        ]
    },
    {
        id: 'market_glut', weight: 12, once: false, emoji: '📉', title: '시장 풍년',
        type: 'negative', hasDice: false,
        desc: '이번 주 시장에 작물이 넘칩니다.\n판매가가 한동안 낮아집니다.',
        choices: [{
            label: '확인',
            resolve: () => { marketBonus -= 20; marketBonusDays = 10; return '판매가 -20% (10일)'; }
        }]
    },
    {
        id: 'market_shortage', weight: 8, once: false, emoji: '📈', title: '시장 흉년',
        type: 'positive', hasDice: false,
        desc: '작물 공급이 부족합니다!\n판매가가 크게 올랐습니다.',
        choices: [{
            label: '좋아요',
            resolve: () => { marketBonus += 30; marketBonusDays = 10; return '판매가 +30% (10일)'; }
        }]
    },
    {
        id: 'tax', weight: 10, once: false, emoji: '🏛️', title: '세금 징수원',
        type: 'negative', hasDice: false,
        desc: '관청에서 세금을 걷으러 왔습니다.\n현재 잔고의 5%를 납부해야 합니다.',
        choices: [{
            label: '납부하기',
            resolve: () => {
                const tax = money > 0
                    ? Math.max(10, Math.floor(money * 0.05))
                    : 10; // 마이너스 상태면 최소 $10
                updateFinancials('지출', tax, '관청 세금');
                return `세금 -$${tax}`;
            }
        }]
    },
    {
        id: 'festival', weight: 12, once: false, emoji: '🎪', title: '마을 축제',
        type: 'positive', hasDice: true,
        desc: '마을 축제에 초대받았습니다!\n참가하시겠습니까?\n\n[참가 $50] 선택 후 주사위 — 높을수록 더 좋은 인연.',
        choices: [
            {
                label: '참가하기 ($50)', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (!trySpend(50, '마을 축제 참가')) return '자금 부족!';
                    festivalCount++;
                    if (total >= 10) { diceBonus += 2; return `주사위 ${total} — 축제 최고 인기! 조앤 조건 +1, 다음 주사위 +2`; }
                    return `주사위 ${total} — 즐거운 축제. 조앤 조건 +1 (현재 ${festivalCount}/3)`;
                }
            },
            { label: '거절하기', resolve: () => '아무 일 없음.' }
        ]
    },
    {
        id: 'junk_dealer', weight: 10, once: false, emoji: '🗑️', title: '고물상',
        type: 'positive', hasDice: false,
        desc: '고물상이 농장 폐자재를 사겠다고 합니다.\n$80을 받으시겠습니까?',
        choices: [{
            label: '팔기',
            resolve: () => { updateFinancials('수입', 80, '고물 판매'); return '+$80'; }
        }, {
            label: '거절하기', resolve: () => '아무 일 없음.'
        }]
    },
    {
        id: 'scammer', weight: 5, once: true, emoji: '🎰', title: '사기꾼',
        type: 'mixed', hasDice: true,
        desc: '수상한 거래를 제안하는 사람이 나타났습니다.\n[수락] 선택 후 주사위 — 반반의 확률입니다.',
        choices: [
            {
                label: '수락하기', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (total >= 7) { updateFinancials('수입', 200, '수상한 거래 성공'); return `주사위 ${total} — 성공! +$200`; }
                    updateFinancials('지출', 200, '수상한 거래 실패');
                    return `주사위 ${total} — 사기당했습니다! -$200`;
                }
            },
            { label: '거절하기', resolve: () => '현명한 선택입니다.' }
        ]
    },
    {
        id: 'subsidy', weight: 4, once: false, emoji: '🏦', title: '농협 보조금',
        type: 'positive', hasDice: false,
        desc: '농협에서 보조금이 지급됐습니다!',
        choices: [{
            label: '감사합니다',
            resolve: () => { updateFinancials('수입', 150, '농협 보조금'); return '+$150'; }
        }]
    },
    {
        id: 'field_trip', weight: 6, once: true, emoji: '🧒', title: '어린이 견학',
        type: 'positive', hasDice: false,
        desc: '학생들이 농장을 견학하러 왔습니다.\n아이들이 신기한 눈으로 농장을 구경했습니다.',
        choices: [{
            label: '환영합니다',
            resolve: () => '훈훈한 하루였습니다.'
        }]
    },
    {
        id: 'reporter', weight: 6, once: true, emoji: '📰', title: '기자 방문',
        type: 'mixed', hasDice: true,
        desc: '기자가 농장 취재를 원합니다.\n허락하시겠습니까?\n\n[허락] 선택 후 주사위 — 기사 퀄리티에 따라 효과가 다릅니다.',
        choices: [
            {
                label: '허락하기', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (total >= 10) { marketBonus += 20; marketBonusDays = 20; return `주사위 ${total} — 특집 기사! 판매가 +20% (20일)`; }
                    if (total >= 7)  { marketBonus += 10; marketBonusDays = 15; return `주사위 ${total} — 좋은 기사. 판매가 +10% (15일)`; }
                    return `주사위 ${total} — 기사가 묻혔습니다. 효과 없음.`;
                }
            },
            { label: '거절하기', resolve: () => '아무 일 없음.' }
        ]
    },
    {
        id: 'temp_worker', weight: 10, once: false, emoji: '👷', title: '임시 노동자',
        type: 'mixed', hasDice: false,
        desc: '일당 노동자를 고용할 수 있습니다.\n$80에 3틱 동안 잡초 제거와 급수를 도와줍니다.',
        choices: [
            {
                label: '고용하기 ($80)',
                resolve: () => {
                    if (!trySpend(80, '임시 노동자 고용')) return '자금 부족!';
                    hiredWorker = true; hiredWorkerDays = 3;
                    return '임시 노동자 고용 (3틱)';
                }
            },
            { label: '거절하기', resolve: () => '아무 일 없음.' }
        ]
    },

    // ── 경제/금융 ─────────────────────────────────────
    {
        id: 'rate_hike', weight: 8, once: false, emoji: '📊', title: '금리 인상',
        type: 'negative', hasDice: false,
        condition: () => fixedLoanAmount > 0,
        desc: '은행이 금리를 올렸습니다.\n이번 달 대출 이자가 추가됩니다.',
        choices: [{
            label: '확인',
            resolve: () => { interestModifier = Math.min(90, interestModifier + 30); interestModDays = 30; return '이자 +$30 (30일)'; }
        }]
    },
    {
        id: 'rate_cut', weight: 6, once: false, emoji: '📉', title: '금리 인하',
        type: 'positive', hasDice: false,
        condition: () => fixedLoanAmount > 0,
        desc: '은행이 금리를 내렸습니다!\n이번 달 대출 이자가 감면됩니다.',
        choices: [{
            label: '좋아요',
            resolve: () => { interestModifier = Math.max(-40, interestModifier - 20); interestModDays = 30; return '이자 -$20 (30일)'; }
        }]
    },
    {
        id: 'futures', weight: 5, once: true, emoji: '🤝', title: '작물 선물거래',
        type: 'mixed', hasDice: true,
        desc: '상인이 미래 수확물을 선매입하겠다고 합니다.\n[수락] 선택 후 주사위 — 선금이 달라집니다. 단, 다음 수확 판매 불가.',
        choices: [
            {
                label: '수락하기', needDice: true, diceCount: 2,
                resolve: (total) => {
                    presaleActive = true;
                    const reward = total >= 10 ? 400 : total >= 7 ? 250 : 150;
                    money += reward; updateFinancials('수입', reward, '작물 선물거래 선금');
                    return `주사위 ${total} — 선금 +$${reward}. 다음 수확 판매 불가.`;
                }
            },
            { label: '거절하기', resolve: () => '아무 일 없음.' }
        ]
    },
    {
        id: 'machine_broken', weight: 8, once: false, emoji: '🔧', title: '농기계 고장',
        type: 'negative', hasDice: false,
        condition: () => Object.values(toolDurability).some(d => d > 0),
        desc: '농기계가 고장났습니다!\n[수리 $100] 하지 않으면 범위 도구 내구도가 감소합니다.',
        choices: [
            {
                label: '수리하기 ($100)',
                resolve: () => {
                    if (!trySpend(100, '농기계 수리')) return '자금 부족! 내구도 감소.';
                    return '수리 완료.';
                }
            },
            {
                label: '방치하기',
                resolve: () => {
                    Object.keys(toolDurability).forEach(k => {
                        if (toolDurability[k] > 0) toolDurability[k] = Math.max(0, toolDurability[k] - 5);
                    });
                    return '범위 도구 내구도 -5 (각각)';
                }
            }
        ]
    },
    {
        id: 'lottery', weight: 3, once: true, emoji: '🎰', title: '복권 당첨',
        type: 'positive', hasDice: true,
        desc: '복권에 당첨됐습니다!\n주사위를 굴려 당첨금을 확인하세요!',
        choices: [{
            label: '확인하기', needDice: true, diceCount: 2,
            resolve: (total) => {
                const reward = total === 12 ? 1000 : total >= 10 ? 500 : total >= 8 ? 300 : 150;
                updateFinancials('수입', reward, '복권 당첨');
                return `주사위 ${total} — 당첨금 +$${reward}!`;
            }
        }]
    },
    {
        id: 'lost_wallet', weight: 12, once: false, emoji: '👛', title: '지갑 분실',
        type: 'negative', hasDice: false,
        desc: '지갑을 잃어버렸습니다!\n$50이 사라졌습니다.',
        choices: [{
            label: '확인',
            resolve: () => { updateFinancials('지출', 50, '지갑 분실'); return '-$50'; }
        }]
    },
    {
        id: 'insurance', weight: 5, once: false, emoji: '📋', title: '풍년 보험금',
        type: 'positive', hasDice: false,
        condition: () => fixedLoanAmount > 0,
        desc: '가입했던 농업 보험금이 지급됐습니다!',
        choices: [{
            label: '감사합니다',
            resolve: () => { updateFinancials('수입', 200, '농업 보험금'); return '+$200'; }
        }]
    },

    // ── 가족/개인 ─────────────────────────────────────
    {
        id: 'spouse_birthday', weight: 8, once: false, emoji: '🎂', title: '배우자 생일',
        type: 'mixed', hasDice: true,
        condition: () => hasSpouse,
        desc: `배우자 생일을 잊을 뻔했습니다!\n[선물 $50] 선택 후 주사위 — 반응이 달라집니다.`,
        choices: [
            {
                label: '선물하기 ($50)', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (!trySpend(50, '배우자 생일 선물')) return '자금 부족!';
                    if (total >= 10) { diceBonus += 2; return `주사위 ${total} — 감동! 다음 주사위 +2 보너스`; }
                    diceBonus += 1;
                    return `주사위 ${total} — 좋아했습니다. 다음 주사위 +1`;
                }
            },
            {
                label: '그냥 넘기기',
                resolve: () => `${spouseName} 님이 서운해합니다. 1틱 행동 없음.`
            }
        ]
    },
    {
        id: 'sick_child', weight: 10, once: false, emoji: '🤒', title: '자녀 아픔',
        type: 'negative', hasDice: false,
        condition: () => children.length > 0,
        desc: '자녀가 아파서 병원에 다녀왔습니다.\n치료비 $80이 지출됩니다.',
        choices: [{
            label: '확인',
            resolve: () => {
                updateFinancials('지출', 80, '자녀 치료비');
                addSysLog('🏥 자녀 치료비 -$80 강제 지출');
                return '치료비 -$80';
            }
        }]
    },
    {
        id: 'injury', weight: 6, once: false, emoji: '🤕', title: '가장 부상',
        type: 'negative', hasDice: false,
        desc: '무리하다 부상을 입었습니다!\n잠시 동안 영토 확장과 농약 살포가 제한됩니다.',
        choices: [{
            label: '확인',
            resolve: () => { injuredDays = 5; return '영토확장/농약 5틱 제한'; }
        }]
    },
    {
        id: 'family_trip', weight: 7, once: true, emoji: '🚗', title: '가족 여행',
        type: 'positive', hasDice: true,
        condition: () => children.length > 0,
        desc: '가족 여행을 다녀왔습니다!\n[참가 $120] 선택 후 주사위 — 자녀 성장 보너스가 달라집니다.',
        choices: [
            {
                label: '참가하기 ($120)', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (!trySpend(120, '가족 여행')) return '자금 부족!';
                    const bonus = total >= 10 ? 10 : 5;
                    children.forEach(c => { c.age += bonus; });
                    return `주사위 ${total} — 자녀 성장 +${bonus}일`;
                }
            },
            { label: '다음에', resolve: () => '아무 일 없음.' }
        ]
    },
    {
        id: 'ancestor_grave', weight: 6, once: false, emoji: '⛩️', title: '조상 묘소',
        type: 'mixed', hasDice: true,
        desc: '조상 묘소를 정비할 때가 됐습니다.\n[정비 $60] 선택 후 주사위 — 높을수록 더 큰 가호.',
        choices: [
            {
                label: '정비하기 ($60)', needDice: true, diceCount: 2,
                resolve: (total) => {
                    if (!trySpend(60, '조상 묘소 정비')) return '자금 부족!';
                    ancestorBlessing = true;
                    if (total >= 10) { diceBonus += 1; return `주사위 ${total} — 조상의 큰 가호! 부정적 인카운터 감소 + 다음 주사위 +1`; }
                    return `주사위 ${total} — 조상의 가호. 부정적 인카운터 감소.`;
                }
            },
            { label: '다음에', resolve: () => '아무 일 없음.' }
        ]
    },
    {
        id: 'retired_advice', weight: 8, once: true, emoji: '👴', title: '은퇴 가족 조언',
        type: 'positive', hasDice: false,
        condition: () => retiredFamily.length > 0,
        desc: '은퇴한 가족이 귀중한 조언을 남겼습니다!\n현재 계절 작물이 성장합니다.',
        choices: [{
            label: '감사합니다',
            resolve: () => {
                const retired = retiredFamily[Math.floor(Math.random() * retiredFamily.length)];
                let count = 0;
                for (let x = 0; x < GRID_SIZE; x++)
                    for (let y = 0; y < GRID_SIZE; y++) {
                        const t = farmGrid[x][y];
                        if (t.isUnlocked && t.type > 0 && !t.isRotten) {
                            t.progress = Math.min(100, t.progress + 15); count++;
                        }
                    }
                return `${retired.name}의 조언 — ${count}칸 progress +15`;
            }
        }]
    },
    {
        id: 'family_record', weight: 4, once: true, emoji: '📜', title: '가문 기록 발견',
        type: 'positive', hasDice: false,
        condition: () => dynastyStartDay !== -1,
        desc: '오래된 가문 기록을 발견했습니다!\n선조의 지혜로 +$100을 얻었습니다.',
        choices: [{
            label: '감사합니다',
            resolve: () => { updateFinancials('수입', 100, '가문 기록 발견'); return '+$100'; }
        }]
    },
];
