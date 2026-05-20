// ── 엔딩 연출 ────────────────────────────────────────
function triggerEnding(type) {
    if (endingFired) return;
    endingFired = true;
    setGameSpeed(0);

    const net = totalRevenue - totalExpense;
    const stats = `\n\n📊 최종 통계\n생존 일수: ${absoluteDays}일 (${generation}대)\n누적 수입: $${totalRevenue.toLocaleString()}\n순이익: $${net.toLocaleString()}`;
    const line = '━'.repeat(28);

    const endings = {
        bankruptcy: {
            title: '🏦 금융 파산 엔딩',
            msg: `총 부채가 한도($${LOAN_LIMIT})를 초과했습니다.\n은행이 ${generation}대 ${playerName} 가문의 농장을 전면 압류했습니다.\n\n가문의 땅은 차갑게 경매에 넘어갔습니다.`
        },
        extinction: {
            title: '⚰️ 가문 단절 엔딩',
            msg: `${absoluteDays}일이 지나 ${generation}대 ${playerName} 가주의 은퇴 시기가 찾아왔습니다.\n\n농장을 물려받을 장성한 자녀가 없어 가업이 끊겼습니다.\n${playerName} 가문의 이름은 역사 속으로 사라졌습니다.`
        },
        landlord: {
            title: '🌾 대지주 엔딩',
            msg: `${generation}대 ${playerName} 가문이 625칸 전체를 개간하고\n240일간 그 땅을 굳건히 지켜냈습니다!\n\n이 땅의 이름은 영원히 ${playerName} 가문의 것으로 기록될 것입니다.`
        },
        billionaire: {
            title: '💰 억만장자 엔딩',
            msg: `모든 빚을 청산하고 순수 보유 자금 $${money.toLocaleString()}을 달성했습니다!\n\n${generation}대 ${playerName} 가문은 이 지역 최고의 부농으로 이름을 남겼습니다.`
        },
        noble: {
            title: '👑 귀족 승격 엔딩',
            msg: `${playerName} 가문이 베아트리체 가문과의 혼인으로 귀족 작위를 받았습니다.\n\n3대에 걸친 농부의 땀이 마침내 귀족의 문을 열었습니다.\n\n전설적인 엔딩을 달성하셨습니다! 🎊`
        },
        dynasty: {
            title: '👨‍👩‍👧‍👦 명문가 엔딩',
            msg: `${playerName} 가문이 3대에 걸쳐 가업을 이어왔습니다.\n3대 가주는 혹독한 첫 1년을 버텨내며 가문의 이름을 지켜냈습니다.\n\n1대부터 3대까지, 이 농장의 역사는 곧 이 지역의 역사가 되었습니다.\n\n최고의 엔딩을 달성하셨습니다! 🎉`
        }
    };

    const e = endings[type];
    setTimeout(() => {
        alert(`${line}\n${e.title}\n${line}\n\n${e.msg}${stats}`);
        resetGame(true);
    }, 100);
}

// ── 엔딩 조건 체크는 main.js tick()에서 직접 처리 ───
// checkEndings 함수 제거 — 중복 로직 일원화

