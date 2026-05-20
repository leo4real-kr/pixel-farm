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
    if (debt + 1000 > LOAN_LIMIT) {
        alert(`🚨 대출 거부: 총 부채 한도($${LOAN_LIMIT})를 초과했습니다.`);
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

// ── 선택적 지출 처리 (잔고 부족 시 팝업) ─────────────
// 반환값: true = 지출 진행, false = 취소
function trySpend(amount, desc) {
    if (money >= amount) {
        updateFinancials('지출', amount, desc);
        return true;
    }

    // 잔고 부족 — 선택 팝업
    const debt = fixedLoanAmount + (money < 0 ? Math.abs(money) : 0);
    const canLoan = debt + 1000 <= LOAN_LIMIT;

    const msg =
        `💰 잔고가 부족합니다!\n\n` +
        `필요 금액: $${amount}  |  현재 잔고: $${money}\n\n` +
        `어떻게 하시겠습니까?\n\n` +
        `[확인] → 마이너스 통장 사용 (이자율 10%)\n` +
        `[취소] → ${canLoan ? '대출 $1,000 받기' : '취소 (한도 초과)'}`;

    const useOverdraft = confirm(msg);

    if (useOverdraft) {
        // 마이너스 통장으로 진행
        updateFinancials('지출', amount, desc);
        addSysLog(`🔴 마이너스 통장 사용: -$${amount} (이자율 10%/턴)`);
        return true;
    } else {
        // 취소 또는 대출
        if (!canLoan) {
            addSysLog('🚨 대출 한도 초과. 지출이 취소됐습니다.');
            return false;
        }
        // 대출 실행
        fixedLoanAmount += 1000;
        document.getElementById('fixed-loan-display').innerText = `$${fixedLoanAmount}`;
        updateFinancials('수입', 1000, '긴급 대출 실행');
        addSysLog('🔵 긴급 대출 $1,000 실행. 이자 $50/턴 발생.');

        if (money >= amount) {
            updateFinancials('지출', amount, desc);
            return true;
        } else {
            // 대출받아도 부족하면 마이너스 통장으로
            updateFinancials('지출', amount, desc);
            addSysLog(`🔴 대출 후에도 부족 — 마이너스 통장 사용: -$${amount}`);
            return true;
        }
    }
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
        const interest = Math.floor((fixedLoanAmount / 1000) * 50);
        expenseEl.innerText += ` | 🔵 대출이자: -$${interest}`;
        updateFinancials('지출', interest, '은행 신용대출 정기 이자');
    }
}