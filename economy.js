// ── 회계 처리 ────────────────────────────────────────
function updateFinancials(type, amount, desc) {
    if (amount === 0) {
        // 장부 개설 등 금액 없는 기록
        addLedgerEntry(type, amount, desc);
        return;
    }
    if (type === '수입') { money += amount; totalRevenue += amount; }
    else                 { money -= amount; totalExpense += amount; }

    refreshMoneyDisplay();
    refreshStatsDisplay();
    addLedgerEntry(type, amount, desc);
}

function refreshMoneyDisplay() {
    const el = document.getElementById('moneyDisplay');
    if (money < 0) {
        el.style.color = '#ff5252';
        el.innerText = `마이너스 통장 (${money})`;
    } else {
        el.style.color = '#ffb74d';
        el.innerText = money;
    }
}

function refreshStatsDisplay() {
    document.getElementById('total-revenue').innerText = `$${totalRevenue}`;
    document.getElementById('total-expense').innerText = `$${totalExpense}`;
    const net = totalRevenue - totalExpense;
    const profitEl = document.getElementById('net-profit');
    profitEl.innerText = (net >= 0 ? '+' : '') + `$${net}`;
    profitEl.style.color = net >= 0 ? '#4ff3a6' : '#ff5252';
}

function addLedgerEntry(type, amount, desc) {
    const color  = type === '수입' ? '#4ff3a6' : '#ff5252';
    const prefix = type === '수입' ? '+' : '-';
    ledgerLog.unshift(`<div style="font-size:12px;margin-bottom:4px;display:flex;justify-content:space-between;">
        <span style="color:${color}">[${type}] ${prefix} $${amount}</span>
        <span style="color:#aaa">${desc}</span>
    </div>`);
    if (ledgerLog.length > 4) ledgerLog.pop();
    document.getElementById('ledger-list').innerHTML = ledgerLog.join('');
}

function addHarvestLog(cropName, amount) {
    harvestLog.unshift(`<div style="font-size:12px;margin-bottom:4px;color:#ffb74d;">
        🧺 ${gameDays}일차: ${cropName} 수확 완료 (+$${amount})
    </div>`);
    if (harvestLog.length > 4) harvestLog.pop();
    document.getElementById('harvest-list').innerHTML = harvestLog.join('');
}

// ── 대출/상환 ────────────────────────────────────────
function borrowFixedLoan() {
    const debt = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
    if (debt + 1000 > getLoanLimit()) {
        alert(`🚨 대출 거부: 총 부채 한도($${getLoanLimit()})를 초과했습니다.`);
        return;
    }
    fixedLoanAmount += 1000;
    document.getElementById('fixed-loan-display').innerText = `$${fixedLoanAmount}`;
    updateFinancials('수입', 1000, '은행 일반 신용 대출 실행');
    addSysLog('은행으로부터 $1,000를 융자받았습니다. (매일 고정 이자 $50 발생)');
}

function repayFixedLoan() {
    if (money < 0)          { alert('🚨 상환 불가: 마이너스 통장 상태입니다.'); return; }
    if (fixedLoanAmount <= 0) { alert('갚을 신용 대출 원금이 없습니다.'); return; }
    if (money < 1000)       { alert('잔고가 부족합니다. (최소 $1,000 필요)'); return; }
    fixedLoanAmount -= 1000;
    document.getElementById('fixed-loan-display').innerText = `$${fixedLoanAmount}`;
    updateFinancials('지출', 1000, '은행 신용 대출 원금 상환');
    addSysLog('은행 대출 원금 $1,000를 정상 상환했습니다.');
}

// ── 선택적 지출 처리 (잔고 부족 시 모달) ─────────────
function trySpend(amount, desc) {
    if (money >= amount) {
        updateFinancials('지출', amount, desc);
        return true;
    }

    // 이미 마이너스 통장 사용 중이면 팝업 없이 그냥 추가 지출
    if (money < 0) {
        updateFinancials('지출', amount, desc);
        return true;
    }

    // 잔고 부족 (0 이상이지만 amount 미달) — 선택 팝업
    return trySpendSync(amount, desc);
}

function trySpendSync(amount, desc) {
    const debt        = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
    const canLoan     = debt + 1000 <= getLoanLimit() && money >= -2000;
    const creditBlock = money < -2000;
    const unlockedCount = (() => {
        let cnt = 0;
        for (let x = 0; x < GRID_SIZE; x++)
            for (let y = 0; y < GRID_SIZE; y++)
                if (farmGrid[x][y].isUnlocked) cnt++;
        return cnt;
    })();
    const hasLand = unlockedCount > 9; // 기본 9칸 초과 = 추가 개간한 토지 있음

    // 신용 차단 상태 (마이너스 -$2,000 이하)
    if (creditBlock) {
        const emptyUnlocked = []; // 비어있는 개간 타일 목록
        const occupiedCount = (() => {
            let occ = 0;
            for (let x = 0; x < GRID_SIZE; x++)
                for (let y = 0; y < GRID_SIZE; y++) {
                    const t = farmGrid[x][y];
                    if (!t.isUnlocked || BASE_TILES.has(`${x},${y}`)) continue;
                    if (t.type === 0 && !t.isRotten) emptyUnlocked.push({ x, y });
                    else occ++;
                }
            return occ;
        })();

        const sellable = emptyUnlocked.length;

        if (!hasLand) {
            alert(`🚨 부채 비중이 높아 신용 대출이 불가합니다.\n현재 잔고: $${money}\n\n보유 토지가 없어 추가 자금 조달이 불가합니다.\n구매가 취소됩니다.`);
            addSysLog('🚨 신용 불량 + 토지 없음. 구매 취소.');
            return false;
        }

        // 토지 담보 대출 or 토지 매각 선택
        const msg1 =
            `🚨 부채 비중이 높아 신용 대출이 불가합니다.\n현재 잔고: $${money}\n\n` +
            `보유 토지를 활용할 수 있습니다:\n\n` +
            `[확인] → 토지 담보 대출 ($500, 이자 $30/턴)\n` +
            `[취소] → 토지 매각 옵션 보기`;

        const takeLandLoan = confirm(msg1);

        if (takeLandLoan) {
            // 토지 담보 대출
            fixedLoanAmount  += 500;
            mortgageAmount    = 500;
            mortgageActive    = true;
            mortgageDaysLeft  = 120;
            document.getElementById('fixed-loan-display').innerText = `$${fixedLoanAmount}`;
            updateFinancials('수입', 500, '토지 담보 대출 실행');
            addSysLog('🏠 토지 담보 대출 $500 실행. 120일 내 미상환 시 토지 몰수!');
            if (money >= amount) {
                updateFinancials('지출', amount, desc);
                return true;
            }
            addSysLog('⚠️ 담보 대출 후에도 잔고 부족. 구매 취소.');
            return false;
        }

        // 토지 매각 옵션
        if (sellable === 0 && occupiedCount > 0) {
            alert(
                `🏚️ 토지 매각 안내\n\n` +
                `매각 가능한 빈 토지가 없습니다.\n` +
                `작물이 심어진 타일은 먼저 수확/개간하여 비워야 매각할 수 있습니다.\n\n` +
                `비어있는 타일: 0칸 | 작물 있는 타일: ${occupiedCount}칸`
            );
            addSysLog('⚠️ 빈 토지 없음. 수확 후 매각 가능. 구매 취소.');
            return false;
        }

        if (sellable === 0) {
            alert(`매각 가능한 토지가 없습니다. 구매가 취소됩니다.`);
            return false;
        }

        const msg2 =
            `🏚️ 토지 매각\n\n` +
            `매각 가능한 빈 토지: ${sellable}칸\n` +
            `매각가: $70/칸 (개간비 $100 기준 급매)\n\n` +
            `[확인] → 빈 토지 1칸 매각 (+$70)\n` +
            `[취소] → 구매 취소`;

        const sellLand = confirm(msg2);

        if (sellLand) {
            // 가장 최근 개간한 빈 타일 1칸 매각 (배열 마지막)
            const target = emptyUnlocked[emptyUnlocked.length - 1];
            farmGrid[target.x][target.y].isUnlocked = false;
            farmGrid[target.x][target.y].water = 0;
            updateFinancials('수입', 70, `토지 매각 [${target.x},${target.y}]`);
            updateUnlockedCountDisplay();
            addSysLog(`🏚️ 토지 [${target.x},${target.y}] 매각 완료. +$70`);

            if (money >= amount) {
                updateFinancials('지출', amount, desc);
                return true;
            }
            addSysLog('⚠️ 토지 매각 후에도 잔고 부족. 구매 취소.');
            return false;
        }

        addSysLog('구매가 취소됐습니다.');
        return false;
    }

    // 일반 잔고 부족 팝업 — 3가지 선택
    const loanText = canLoan ? '대출 $1,000 받기' : '대출 불가 (한도 초과)';
    const choice = showSpendModal(amount, desc, loanText, canLoan);

    if (choice === 'overdraft') {
        updateFinancials('지출', amount, desc);
        addSysLog(`🔴 마이너스 통장 사용: -$${amount} (이자율 10%/턴)`);
        return true;
    } else if (choice === 'loan' && canLoan) {
        fixedLoanAmount += 1000;
        document.getElementById('fixed-loan-display').innerText = `$${fixedLoanAmount}`;
        updateFinancials('수입', 1000, '긴급 대출 실행');
        addSysLog('🔵 긴급 대출 $1,000 실행. 이자 $50/턴.');
        updateFinancials('지출', amount, desc);
        return true;
    } else {
        addSysLog('구매가 취소됐습니다.');
        return false;
    }
}

function showSpendModal(amount, desc, loanText, canLoan) {
    // confirm 2번으로 3가지 선택지 구현
    const msg1 =
        `💰 잔고가 부족합니다!\n\n` +
        `필요 금액: $${amount}  |  현재 잔고: $${money}\n\n` +
        `[확인] → 마이너스 통장 사용 (이자율 10%)\n` +
        `[취소] → 다른 옵션 보기`;

    const useOverdraft = confirm(msg1);
    if (useOverdraft) return 'overdraft';

    const msg2 =
        `다른 옵션을 선택하세요:\n\n` +
        `[확인] → ${loanText}\n` +
        `[취소] → 구매 취소`;

    const useLoan = confirm(msg2);
    if (useLoan && canLoan) return 'loan';
    return 'cancel';
}

// ── 담보 대출 카운트다운 (매 틱 호출) ───────────────
function processMortgage() {
    if (!mortgageActive) return;

    // 전체 대출액이 담보 금액 미만으로 줄었으면 담보 상환 완료
    if (fixedLoanAmount < mortgageAmount) {
        mortgageActive = false;
        mortgageAmount = 0;
        mortgageDaysLeft = 120;
        addSysLog('🏠 토지 담보 대출 상환 완료! 담보가 해제됐습니다.');
        return;
    }

    mortgageDaysLeft--;

    if (mortgageDaysLeft > 0 && mortgageDaysLeft <= 30 && mortgageDaysLeft % 10 === 0)
        addSysLog(`⚠️ 토지 담보 대출 상환 기한 ${mortgageDaysLeft}일 남았습니다!`);

    if (mortgageDaysLeft <= 0) {
        mortgageActive = false;
        const seized = seizeLand();
        if (seized > 0)
            addSysLog(`🏚️ 담보 기한 초과! 토지 ${seized}칸이 은행에 몰수됐습니다.`);
        else
            addSysLog('🏚️ 담보 기한 초과! 몰수할 토지가 없어 부채로 전환됩니다.');
        mortgageAmount = 0;
        mortgageDaysLeft = 120;
    }
}

// 기본 9타일 (x:11~13, y:11~13) — 몰수 제외
const BASE_TILES = (() => {
    const set = new Set();
    for (let x = 11; x <= 13; x++)
        for (let y = 11; y <= 13; y++)
            set.add(`${x},${y}`);
    return set;
})();

function seizeLand() {
    const candidates = [];
    for (let x = 0; x < GRID_SIZE; x++)
        for (let y = 0; y < GRID_SIZE; y++) {
            const t = farmGrid[x][y];
            if (!t.isUnlocked || BASE_TILES.has(`${x},${y}`)) continue;
            candidates.push({ x, y, empty: t.type === 0 });
        }

    // 빈 타일 우선, 그 다음 작물 있는 타일
    candidates.sort((a, b) => (b.empty ? 1 : 0) - (a.empty ? 1 : 0));

    // 담보 잔액 기준으로 몰수 칸 수 계산 (토지 단가 $100)
    const toSeize = Math.min(
        Math.ceil(mortgageAmount / 100),
        candidates.length
    );
    let compensation = 0;

    for (let i = 0; i < toSeize; i++) {
        const { x, y, empty } = candidates[i];
        if (!empty) compensation += 10;
        farmGrid[x][y] = {
            type: 0, progress: 0, water: 0, hasWeed: false,
            isRotten: false, rottenCause: '', isUnlocked: false,
            hasPest: false, pestDays: 0, overRipeDays: 0,
            overWaterDays: 0, droughtDays: 0, treeHarvestCount: 0
        };
    }

    if (compensation > 0) {
        updateFinancials('수입', compensation, '몰수 토지 작물 처분 보상');
        addSysLog(`🌾 몰수 토지 작물 처분 보상 +$${compensation} (칸당 $10)`);
    }

    updateUnlockedCountDisplay();
    return toSeize;
}

function calculateDailyCost(spouseSkillCut) {
    const winterMult = currentSeason === '겨울' ? 2 : 1;

    // 자녀별 단계별 지출 집계
    let childCost = 0;
    let adultChildCount = 0;
    children.forEach(c => {
        if (c.age <= 15) childCost += 15;
        else if (c.age <= 30) childCost += 25;
        else adultChildCount++; // 청년기: 지출 없음, 생활비 분담으로 처리
    });

    const baseLiving     = Math.floor((5 + (hasSpouse ? 10 : 0)) * winterMult * spouseSkillCut);
    const finalChildCost = Math.floor(childCost * winterMult * spouseSkillCut);
    return { baseLiving, finalChildCost, childCost, adultChildCount };
}

// ── 이자 처리 ────────────────────────────────────────
function applyInterests() {
    const expenseEl = document.getElementById('expense-warning');

    if (money < 0) {
        const interest = Math.max(5, Math.floor(Math.abs(money) * 0.10));
        expenseEl.innerText += ` | 🔴 마통 이자: -$${interest}`;
        updateFinancials('지출', interest, '마이너스 통장 연체 이자');
    }

    if (fixedLoanAmount > 0) {
        const baseInterest = Math.floor((fixedLoanAmount / 1000) * 50);
        const interest = Math.max(0, baseInterest + interestModifier);
        expenseEl.innerText += ` | 🔵 대출이자: -$${interest}`;
        updateFinancials('지출', interest, '은행 신용대출 정기 이자');
    }
}

// ── 통합 수확 처리 함수 ───────────────────────────────
// 모든 수확 경로(일반/광역/배우자/자녀)가 이 함수를 사용
// source: 'player' | 'area' | 'spouse' | 'child'
// 반환값: { revenue, msg } 또는 null (수확 불가)
function doHarvest(tile, source = 'player') {
    if (!tile || tile.type === 0) return null;

    // 사과나무 — 경로별 처리 다름 (플레이어만 수확 가능)
    if (tile.type === 5) {
        if (source !== 'player') return null;
        if (currentSeason === '겨울') {
            clearTile(tile); tile.treeHarvestCount = 0;
            playSound('weed');
            updateFinancials('수입', 200, '겨울 땔감 벌목 판매');
            return { revenue: 200, msg: '나무를 벌목하여 땔감 자금 $200을 획득했습니다.' };
        }
        if (currentSeason === '가을' && tile.progress >= 100) {
            tile.treeHarvestCount++;
            const reward = 100 + (tile.treeHarvestCount - 1) * 50;
            playSound('harvest');
            updateFinancials('수입', reward, `가을 사과 수확 (${tile.treeHarvestCount}회차)`);
            addHarvestLog(`사과나무(${tile.treeHarvestCount}회차)`, reward);
            tile.progress = 0;
            tile.treeHarvested = true;
            return { revenue: reward, msg: `사과를 수확하여 $${reward}을 획득했습니다! (나무 숙련도 상승)` };
        }
        return null;
    }

    // 부패 작물 — 그냥 제거 (수익 없음)
    if (tile.isRotten) {
        const cause = getRottenCauseLabel ? getRottenCauseLabel(tile) : tile.rottenCause;
        clearTile(tile);
        return { revenue: 0, msg: `🗑️ 부패 작물 제거 완료. 원인: ${cause}` };
    }

    // 수확 가능 상태
    if (tile.progress >= 100) {
        const cropName = getCropName(tile.type);
        const base     = getCropValue(tile.type);
        const totalPct = sellBonusPct + (marketBonus || 0);
        const bonus    = totalPct > 0 ? Math.floor(base * totalPct / 100) : 0;
        const revenue  = base + bonus;
        const sourceLabel = source === 'player' ? '' : source === 'area' ? '(광역)' : source === 'spouse' ? '(배우자)' : '(자녀)';

        // 선물거래 중 — 1회 수확 판매 불가
        if (presaleActive) {
            clearTile(tile);
            totalHarvestCount++;
            harvestTypeSet.add(tile.type);
            clearPresale();
            if (source === 'player') playSound('harvest');
            return { revenue: 0, msg: `🤝 선물거래 계약: ${cropName} 수확만 진행. 판매 불가. (계약 완료)` };
        }

        clearTile(tile);
        if (source === 'player') playSound('harvest');
        updateFinancials('수입', revenue,
            `${cropName} 시장 출하${sourceLabel}${bonus > 0 ? ` (+${totalPct}% 보너스)` : ''}`);
        addHarvestLog(`${cropName}${sourceLabel}`, revenue);
        totalHarvestCount++;
        harvestTypeSet.add(tile.type);
        return { revenue, msg: `수확 성공: +$${revenue}${bonus > 0 ? ` (보너스 +$${bonus})` : ''}` };
    }

    return null;
}
