// ── 주사위 이벤트 ────────────────────────────────────
function triggerDiceEvent(eventType) {
    setGameSpeed(0);
    currentDiceEvent = eventType;

    const overlay = document.getElementById('dice-overlay');
    overlay.style.display = 'flex';
    document.getElementById('dice-result').innerText = '주사위를 굴리는 중...';
    document.getElementById('dice-result').style.color = '#fff';

    if (eventType === 'marriage') {
        marriageEventFired = true;
        document.getElementById('dice-title').innerText = '💍 가문 형성: 청혼 이벤트';
        document.getElementById('dice-desc').innerText  = "7↑=C급 / 9↑=B급 / 11↑=A급 / 12=S급 (6 이하 실패)";
    } else {
        document.getElementById('dice-title').innerText = '👶 2세 계획: 출산 기원 이벤트';
        document.getElementById('dice-desc').innerText  = "합계 눈이 '8 이상' 나오면 부인이 임신에 성공합니다!";
    }

    setTimeout(() => {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        document.getElementById('dice1').innerText = d1;
        document.getElementById('dice2').innerText = d2;

        const resultEl = document.getElementById('dice-result');
        if (currentDiceEvent === 'marriage') {
            if (total >= 7) {
                hasSpouse = true;
                // 합계로 등급 직접 결정: 12=S(2.8%), 11=A(5.6%), 9~10=B(25%), 7~8=C(나머지)
                spouseGrade = total === 12 ? 'S'
                            : total >= 11 ? 'A'
                            : total >= 9  ? 'B'
                            : 'C';
                const names    = ['서연','민지','지윤','은우','수아','지아','하윤','은서','연우','유진','다은','수진'];
                const surnames = ['김','이','박','최','정','강','조','윤','장','임'];
                spouseName = surnames[Math.floor(Math.random() * surnames.length)]
                           + names[Math.floor(Math.random() * names.length)];
                const gradeDesc = { S: '🌟 전설급!', A: '✨ 우수급!', B: '👍 보통급', C: '😅 평범급' };
                resultEl.innerText = `🎉 성공! 합계 ${total} → [${spouseGrade}급] 부인 '${spouseName}' 님 합류! ${gradeDesc[spouseGrade]}`;
                resultEl.style.color = spouseGrade === 'S' ? '#FFD700' : spouseGrade === 'A' ? '#4ff3a6' : '#fff';
            } else {
                marriageEventFired = false;
                resultEl.innerText = `😭 실패! 눈의 합: ${total} — 6 이하로 인연이 닿지 않았습니다. (다음 달 재도전)`;
                resultEl.style.color = '#ff5252';
            }
        } else {
            if (total >= 8) {
                isPregnant = true;
                pregnancyDays = 0;
                pregnancyCooldown = 0;
                resultEl.innerText = `🤰 성공! 부인 ${spouseName} 님이 임신했습니다! (10일 후 출산)`;
                resultEl.style.color = '#4ff3a6';
            } else {
                pregnancyCooldown = 120;
                resultEl.innerText = `😭 실패! 눈의 합: ${total} (120일 후 재시도 가능)`;
                resultEl.style.color = '#ff5252';
            }
        }
    }, 1200);
}

function closeDicePopup() {
    document.getElementById('dice-overlay').style.display = 'none';
    document.getElementById('dice1').innerText = '?';
    document.getElementById('dice2').innerText = '?';
    document.getElementById('dice-result').innerText = '';
    setGameSpeed(1);
    updateFamilyUI();
}

// ── 임신 시도 ────────────────────────────────────────
function tryPregnancy() {
    if (!hasSpouse)                    return alert('부인이 없어 계획을 진행할 수 없습니다.');
    if (isPregnant)                    return alert('현재 부인이 임신 중입니다. 출산 후 다시 시도하세요.');
    if (children.length >= MAX_CHILDREN) return alert(`🚨 자녀는 최대 ${MAX_CHILDREN}명까지 가능합니다.`);
    if (pregnancyCooldown > 0)         return alert(`⏳ 아직 회복 중입니다. ${pregnancyCooldown}일 후 재시도 가능합니다.`);

    const unlockedCount = updateUnlockedCountDisplay();
    if (money < 6000)         return alert('자금이 부족합니다. ($6,000 이상 필요)');
    if (unlockedCount < 50)   return alert('영토를 50칸 이상 개간하십시오.');

    triggerDiceEvent('pregnancy');
}

// ── 출산 처리 ────────────────────────────────────────
function handleBirth() {
    isPregnant = false;
    setGameSpeed(0);

    const defaultName = ['첫째', '둘째', '셋째'][children.length] || '막내';
    let name = prompt(
        `🎉 부인 ${spouseName} 님이 무사히 출산했습니다!\n새로운 후계자의 이름을 지어주세요:`,
        defaultName
    );
    if (!name || !name.trim()) name = defaultName;

    children.push({ name, grade: spouseGrade, age: 1, actionText: '대기 중' });
    pregnancyCooldown = 120; // 출산 후 120일 쿨다운
    alert(`👶 ${generation + 1}대 ${name} (이)가 가문에 합류했습니다! [유전 등급: ${spouseGrade}급]\n(다음 임신 시도는 120일 후 가능합니다)`);
    setGameSpeed(1);
    updateFamilyUI();
}

// ── 가업 승계 ────────────────────────────────────────
function succeedFarm(childIndex) {
    const heir = children[childIndex];
    if (!heir) return;

    // 유산 보너스 — 순이익의 20% (최소 $500)
    const net = totalRevenue - totalExpense;
    const inheritance = Math.max(500, Math.floor(net * 0.2));

    // 은퇴 가족 구성 — 배우자 + 형제자매(승계자 제외) 중 최대 2명
    retiredFamily = [];
    if (hasSpouse) {
        retiredFamily.push({ name: spouseName, grade: spouseGrade, actionText: '패시브 지원 중' });
    }
    children.forEach((c, i) => {
        if (i !== childIndex && retiredFamily.length < 2) {
            retiredFamily.push({ name: c.name, grade: c.grade, actionText: '패시브 지원 중' });
        }
    });

    generation++;
    playerName      = heir.name;
    hasSpouse       = false; spouseName = ''; spouseGrade = 'C';
    isPregnant      = false; pregnancyDays = 0; pregnancyCooldown = 0;
    marriageEventFired = false;
    spouseActionText = '대기 중';
    children = [];

    absoluteDays = 1; gameDays = 1;
    currentSeason = '봄'; currentWeather = '맑음';

    // 유산금 지급
    updateFinancials('수입', inheritance, `${generation-1}대 가문 유산 상속`);

    document.getElementById('dayDisplay').innerText     = gameDays;
    document.getElementById('seasonDisplay').innerText  = currentSeason;
    document.getElementById('weatherDisplay').innerText = currentWeather;

    updateFamilyUI();

    if (generation >= 3) {
        dynastyStartDay = absoluteDays;
        setGameSpeed(1);
        const retiredNames = retiredFamily.map(r => r.name).join(', ');
        alert(`👑 3대 ${playerName} 가주가 농장을 이어받았습니다!\n\n💰 유산 상속금: $${inheritance.toLocaleString()}\n👴 은퇴 가족 패시브 지원: ${retiredNames || '없음'}\n\n⏳ 1년(120일)을 버텨내면 명문가 엔딩을 달성합니다!`);
        addSysLog(`👑 3대 ${playerName} 가주 승계. 명문가 엔딩까지 120일 남았습니다.`);
    } else {
        setGameSpeed(1);
        const retiredNames = retiredFamily.map(r => r.name).join(', ');
        alert(`👑 가업 승계 완료!\n${generation}대 ${playerName} 가주가 농장을 이어받았습니다.\n\n💰 유산 상속금: $${inheritance.toLocaleString()}\n👴 은퇴 가족 패시브 지원: ${retiredNames || '없음'}\n\n새로운 배우자를 맞이하고 다음 대를 이어가세요.`);
        addSysLog(`${generation}대 ${playerName} 가주 승계. 유산 $${inheritance} 수령. 은퇴 가족 ${retiredFamily.length}명 패시브 지원.`);
    }
}

// ── 가족 행동 (매 턴) ────────────────────────────────
// 반환값: spouseSkillCut (절감 계수)
function runFamilyActions(dryTiles, weedTiles, ripeTiles, rottenTiles) {
    let spouseSkillCut = 1.0;

    // 임신 중
    if (hasSpouse && isPregnant) {
        pregnancyDays++;
        spouseSkillCut = 0.5;
        spouseActionText = `🤰 임신 ${pregnancyDays}일차 (가사 절약 중)`;
        if (pregnancyDays >= 10) handleBirth();
        return spouseSkillCut;
    }

    // 배우자 행동 — 등급별 횟수 + 고유 스킬
    if (hasSpouse) {
        const roll = Math.random();

        // 등급별 기본 행동 횟수
        const harvestLimit = spouseGrade === 'S' ? 5 : spouseGrade === 'A' ? 3 : spouseGrade === 'B' ? 2 : 1;
        const waterCount   = spouseGrade === 'S' ? 5 : spouseGrade === 'A' ? 3 : spouseGrade === 'B' ? 2 : 1;

        // S급 고유 스킬: 병충해 자동 탐지+제거 (매 턴 체크)
        if (spouseGrade === 'S') {
            const pestTiles = [];
            for (let x = 0; x < GRID_SIZE; x++)
                for (let y = 0; y < GRID_SIZE; y++)
                    if (farmGrid[x][y].isUnlocked && farmGrid[x][y].hasPest) pestTiles.push(farmGrid[x][y]);
            if (pestTiles.length > 0) {
                pestTiles.slice(0, 3).forEach(t => { t.hasPest = false; t.pestDays = 0; });
                spouseActionText = `🔬 [S급] 병충해 ${Math.min(3, pestTiles.length)}곳 자동 제거`;
                return spouseSkillCut;
            }
        }

        // A급 고유 스킬: 3x3 광역 수확 (25% 확률)
        if (spouseGrade === 'A' && roll < 0.25 && ripeTiles.length > 0) {
            const center = ripeTiles[Math.floor(Math.random() * ripeTiles.length)];
            let harvested = 0;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = center.x + dx, ny = center.y + dy;
                    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
                    const t = farmGrid[nx][ny];
                    if (t.isUnlocked && t.type > 0 && t.type !== 5 && t.progress >= 100 && !t.isRotten) {
                        const r = getCropValue(t.type);
                        const n = getCropName(t.type);
                        clearTile(t);
                        updateFinancials('수입', r, `부인 ${spouseName} 3x3 광역 수확`);
                        addHarvestLog(`${n}(광역)`, r);
                        harvested++;
                    }
                }
            }
            spouseActionText = `✨ [A급] 3x3 광역 수확 (${harvested}칸)`;
            return spouseSkillCut;
        }

        // 공통 행동
        if (roll < 0.25 && ripeTiles.length > 0) {
            spouseActionText = `🧺 시장 출하 중 [${spouseGrade}급 ×${harvestLimit}]`;
            ripeTiles.slice(0, harvestLimit).forEach(item => {
                const r = getCropValue(item.tile.type);
                const n = getCropName(item.tile.type);
                clearTile(item.tile);
                updateFinancials('수입', r, `부인 ${spouseName}이(가) ${n} 출하`);
                addHarvestLog(`${n}(자동)`, r);
            });
        } else if (roll < 0.5 && weedTiles.length > 0) {
            spouseActionText = `✂️ 잡초 제거 중 [${spouseGrade}급]`;
            weedTiles.slice(0, waterCount).forEach(t => { t.hasWeed = false; });
        } else if (roll < 0.75 && dryTiles.length > 0) {
            spouseActionText = `💧 살수 중 [${spouseGrade}급 ×${waterCount}]`;
            dryTiles.slice(0, waterCount).forEach(t => { t.water = Math.min(90, t.water + 40); });
        } else {
            spouseActionText = `🧹 내부 정비 (생활비 50% 절감) [${spouseGrade}급]`;
            spouseSkillCut *= 0.5;
        }
    }

    // 자녀 행동
    let adultCount = 0;
    children.forEach(child => {
        child.age++;
        const workCount = child.grade === 'S' ? 3 : child.grade === 'A' ? 2 : 1;
        const waterAmt  = child.grade === 'S' ? 60 : 40;

        if (child.age <= 15) {
            child.actionText = `👶 유아기(${child.age}일) - 급수 보조 [-$15/일]`;
            dryTiles.slice(0, workCount).forEach(t => { t.water = Math.min(90, t.water + waterAmt); });
        } else if (child.age <= 30) {
            child.actionText = `👦 성장기(${child.age}일) - 급수+제초 [-$25/일]`;
            dryTiles.slice(0, workCount).forEach(t => { t.water = Math.min(90, t.water + waterAmt); });
            weedTiles.slice(0, workCount).forEach(t => { t.hasWeed = false; });
        } else {
            child.actionText = `🚜 청년기(${child.age}일) - 전담 보조`;
            adultCount++;
            dryTiles.slice(0, workCount).forEach(t => { t.water = Math.min(90, t.water + waterAmt); });
            weedTiles.slice(0, workCount).forEach(t => { t.hasWeed = false; });
            rottenTiles.slice(0, workCount).forEach(t => { clearTile(t); });
        }
    });

    if (adultCount > 0) spouseSkillCut *= Math.pow(0.5, adultCount);
    spouseSkillCut = Math.max(0.3, spouseSkillCut);

    // 은퇴 가족 패시브 행동 (승계 후 잔류 지원)
    retiredFamily.forEach(r => {
        const workCount = r.grade === 'S' ? 3 : r.grade === 'A' ? 2 : 1;
        const roll = Math.random();
        if (roll < 0.5 && dryTiles.length > 0) {
            r.actionText = `💧 패시브 살수 지원`;
            const targets = dryTiles.slice(0, workCount);
            targets.forEach(t => { t.water = Math.min(90, t.water + 30); });
            // 3일에 1번꼴로 로그 출력
            if (Math.random() < 0.33)
                addSysLog(`👴 은퇴한 ${r.name}이(가) ${targets.length}칸에 물을 주었습니다.`);
        } else if (weedTiles.length > 0) {
            r.actionText = `✂️ 패시브 제초 지원`;
            const targets = weedTiles.slice(0, workCount);
            targets.forEach(t => { t.hasWeed = false; });
            if (Math.random() < 0.33)
                addSysLog(`👴 은퇴한 ${r.name}이(가) 잡초를 ${targets.length}칸 매주었습니다.`);
        } else {
            r.actionText = `🏡 휴식 중`;
        }
    });

    return spouseSkillCut;
}

// ── 임신 쿨다운 차감 ─────────────────────────────────
function tickPregnancyCooldown() {
    if (pregnancyCooldown <= 0) return;
    pregnancyCooldown--;
    if (pregnancyCooldown === 0)
        addSysLog('💑 임신 재시도가 가능한 시기가 됐습니다.');
}