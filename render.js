// ── 이미지 에셋 ──────────────────────────────────────
const tileImages = {};
const cropImages = {};
let assetsLoaded = false;

function preloadImages(callback) {
    const assets = [
        { key: 'normal', src: 'images/tile_normal.png', obj: tileImages },
        { key: 'dry',    src: 'images/tile_dry.png',    obj: tileImages },
        { key: 'wet',    src: 'images/tile_wet.png',    obj: tileImages },
        { key: 'snow',   src: 'images/tile_snow.png',   obj: tileImages },
        { key: 'carrot_1', src: 'images/carrot_1.png', obj: cropImages },
        { key: 'carrot_2', src: 'images/carrot_2.png', obj: cropImages },
        { key: 'carrot_3', src: 'images/carrot_3.png', obj: cropImages },
        { key: 'carrot_4', src: 'images/carrot_4.png', obj: cropImages },
        { key: 'carrot_5', src: 'images/carrot_5.png', obj: cropImages },
        { key: 'potato_1', src: 'images/potato_1.png', obj: cropImages },
        { key: 'potato_2', src: 'images/potato_2.png', obj: cropImages },
        { key: 'potato_3', src: 'images/potato_3.png', obj: cropImages },
        { key: 'potato_4', src: 'images/potato_4.png', obj: cropImages },
        { key: 'potato_5', src: 'images/potato_5.png', obj: cropImages },
        { key: 'corn_1', src: 'images/corn_1.png', obj: cropImages },
        { key: 'corn_2', src: 'images/corn_2.png', obj: cropImages },
        { key: 'corn_3', src: 'images/corn_3.png', obj: cropImages },
        { key: 'corn_4', src: 'images/corn_4.png', obj: cropImages },
        { key: 'corn_5', src: 'images/corn_5.png', obj: cropImages },
        { key: 'strawberry_1', src: 'images/strawberry_1.png', obj: cropImages },
        { key: 'strawberry_2', src: 'images/strawberry_2.png', obj: cropImages },
        { key: 'strawberry_3', src: 'images/strawberry_3.png', obj: cropImages },
        { key: 'strawberry_4', src: 'images/strawberry_4.png', obj: cropImages },
        { key: 'strawberry_5', src: 'images/strawberry_5.png', obj: cropImages },
        { key: 'apple_1', src: 'images/apple_1.png', obj: cropImages },
        { key: 'apple_2', src: 'images/apple_2.png', obj: cropImages },
        { key: 'apple_3', src: 'images/apple_3.png', obj: cropImages },
        { key: 'apple_4', src: 'images/apple_4.png', obj: cropImages },
        { key: 'apple_5', src: 'images/apple_5.png', obj: cropImages },
        { key: 'apple_6', src: 'images/apple_6.png', obj: cropImages },
        { key: 'apple_7', src: 'images/apple_7.png', obj: cropImages },
        { key: 'tulip_1', src: 'images/tulip_1.png', obj: cropImages },
        { key: 'tulip_2', src: 'images/tulip_2.png', obj: cropImages },
        { key: 'tulip_3', src: 'images/tulip_3.png', obj: cropImages },
        { key: 'tulip_4', src: 'images/tulip_4.png', obj: cropImages },
        { key: 'tulip_5', src: 'images/tulip_5.png', obj: cropImages },
        { key: 'wildberry_1', src: 'images/wildberry_1.png', obj: cropImages },
        { key: 'wildberry_2', src: 'images/wildberry_2.png', obj: cropImages },
        { key: 'wildberry_3', src: 'images/wildberry_3.png', obj: cropImages },
        { key: 'wildberry_4', src: 'images/wildberry_4.png', obj: cropImages },
        { key: 'wildberry_5', src: 'images/wildberry_5.png', obj: cropImages },
        { key: 'sunflower_1', src: 'images/sunflower_1.png', obj: cropImages },
        { key: 'sunflower_2', src: 'images/sunflower_2.png', obj: cropImages },
        { key: 'sunflower_3', src: 'images/sunflower_3.png', obj: cropImages },
        { key: 'sunflower_4', src: 'images/sunflower_4.png', obj: cropImages },
        { key: 'sunflower_5', src: 'images/sunflower_5.png', obj: cropImages },
        { key: 'edamame_1', src: 'images/edamame_1.png', obj: cropImages },
        { key: 'edamame_2', src: 'images/edamame_2.png', obj: cropImages },
        { key: 'edamame_3', src: 'images/edamame_3.png', obj: cropImages },
        { key: 'edamame_4', src: 'images/edamame_4.png', obj: cropImages },
        { key: 'edamame_5', src: 'images/edamame_5.png', obj: cropImages },
        { key: 'pumpkin_1', src: 'images/pumpkin_1.png', obj: cropImages },
        { key: 'pumpkin_2', src: 'images/pumpkin_2.png', obj: cropImages },
        { key: 'pumpkin_3', src: 'images/pumpkin_3.png', obj: cropImages },
        { key: 'pumpkin_4', src: 'images/pumpkin_4.png', obj: cropImages },
        { key: 'pumpkin_5', src: 'images/pumpkin_5.png', obj: cropImages },
        { key: 'sweetpotato_1', src: 'images/sweetpotato_1.png', obj: cropImages },
        { key: 'sweetpotato_2', src: 'images/sweetpotato_2.png', obj: cropImages },
        { key: 'sweetpotato_3', src: 'images/sweetpotato_3.png', obj: cropImages },
        { key: 'sweetpotato_4', src: 'images/sweetpotato_4.png', obj: cropImages },
        { key: 'sweetpotato_5', src: 'images/sweetpotato_5.png', obj: cropImages },
        { key: 'overlay_weed',   src: 'images/overlay_weed.png',   obj: cropImages },
        { key: 'overlay_rotten', src: 'images/overlay_rotten.png', obj: cropImages },
        { key: 'overlay_pest',   src: 'images/overlay_pest.png',   obj: cropImages },    ];
    let loaded = 0;
    let failed = 0;
    assets.forEach(item => {
        const img = new Image();
        img.onload  = () => { item.obj[item.key] = img; if (++loaded + failed === assets.length) { assetsLoaded = true; callback(); } };
        img.onerror = () => { console.warn(`[이미지 로드 실패] ${item.src}`); if (loaded + ++failed === assets.length) { assetsLoaded = true; callback(); } };
        img.src = item.src;
    });
}

// ── 탭 전환 ──────────────────────────────────────────
function switchTab(tab) {
    ['basic', 'shop', 'log', 'wiki'].forEach(t => {
        document.getElementById(`tab-content-${t}`).style.display = t === tab ? '' : 'none';
        document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    });
    if (tab === 'wiki') renderWiki();
}

// ── 계절 전용 작물 버튼 표시 업데이트 ────────────────
function updateSeasonalButtons() {
    const seasonMap = {
        '봄':  ['tulip', 'wildberry'],
        '여름': ['sunflower', 'edamame'],
        '가을': ['pumpkin', 'sweetpotato'],
        '겨울': [],
    };
    const all = ['tulip', 'wildberry', 'sunflower', 'edamame', 'pumpkin', 'sweetpotato'];
    const visible = seasonMap[currentSeason] || [];

    all.forEach(id => {
        const btn = document.getElementById(`btn-${id}`);
        if (btn) btn.style.display = visible.includes(id) ? '' : 'none';
    });

    const noneMsg = document.getElementById('seasonal-none');
    if (noneMsg) noneMsg.style.display = currentSeason === '겨울' ? '' : 'none';

    const title = document.getElementById('seasonal-crop-title');
    const seasonEmoji = { '봄': '🌷', '여름': '🌻', '가을': '🍂', '겨울': '❄️' };
    if (title) title.innerText = `${seasonEmoji[currentSeason] || '🌱'} ${currentSeason} 전용 작물`;
}

// ── 농업백과사전 렌더 ────────────────────────────────
function renderWiki() {
    const panel = document.getElementById('wiki-body');
    if (!panel) return;

    const WIKI_CROPS = [
        // 사계절
        { type: 1,  name: '당근',     emoji: '🥕', season: '사계절', cost: 20,  value: 50,  growth: 4,  special: null,           tip: '초반 자금 확보에 좋습니다. 빠르게 수확 가능.' },
        { type: 2,  name: '감자',     emoji: '🥔', season: '사계절', cost: 30,  value: 80,  growth: 5,  special: null,           tip: '안정적인 수익원. 병충해에 강합니다.' },
        { type: 3,  name: '옥수수',   emoji: '🌽', season: '사계절', cost: 50,  value: 150, growth: 8,  special: '잡초억제',     tip: '주변 3칸 잡초 발생률 감소. 냉해에 취약.' },
        { type: 4,  name: '딸기',     emoji: '🍓', season: '사계절', cost: 80,  value: 260, growth: 7,  special: '병충해주의',   tip: '수익이 높지만 병충해 전파 범위가 넓습니다.' },
        { type: 5,  name: '사과나무', emoji: '🍎', season: '사계절', cost: 300, value: 100, growth: -1, special: '다년생',       tip: '가을에만 수확 가능. 수확 횟수마다 보너스 +$50. 겨울에 벌목 시 $200.' },
        // 봄
        { type: 6,  name: '튤립',     emoji: '🌷', season: '봄',     cost: 40,  value: 120, growth: 5,  special: null,           tip: '봄 전용. 이른 봄에 심어야 수확 가능합니다.' },
        { type: 7,  name: '산딸기',   emoji: '🍓', season: '봄',     cost: 70,  value: 200, growth: 7,  special: null,           tip: '봄 전용. 딸기보다 수익이 높습니다.' },
        // 여름
        { type: 8,  name: '해바라기', emoji: '🌻', season: '여름',   cost: 80,  value: 220, growth: 8,  special: '병충해저항',   tip: '병충해 발생률 50% 감소. 여름 폭염에 강합니다.' },
        { type: 9,  name: '풋콩',     emoji: '🫘', season: '여름',   cost: 60,  value: 160, growth: 6,  special: '잡초저항',     tip: '잡초 발생률을 극도로 낮춥니다. (1%)' },
        // 가을
        { type: 10, name: '호박',     emoji: '🎃', season: '가을',   cost: 100, value: 350, growth: 13, special: null,           tip: '가을 최고 수익 작물. 성장이 느리므로 일찍 심으세요.' },
        { type: 11, name: '고구마',   emoji: '🍠', season: '가을',   cost: 60,  value: 180, growth: 8,  special: '냉해저항',     tip: '냉해 면역. 가을 말에도 안전하게 재배 가능합니다.' },
    ];

    const seasonColor = { '사계절': '#4ff3a6', '봄': '#ff80ab', '여름': '#ffb74d', '가을': '#ff7043', '겨울': '#90caf9' };
    const seasonBg    = { '사계절': '#1a2e1a', '봄': '#2e1a2a', '여름': '#2e2a1a', '가을': '#2e1e1a', '겨울': '#1a1e2e' };

    const growthLabel = (g) => g === -1 ? '다년생' : `약 ${Math.ceil(100/g)}일`;
    const roiLabel    = (cost, value) => `+${value - cost} (+${Math.round((value-cost)/cost*100)}%)`;

    // 카테고리별 그룹
    const groups = [
        { label: '🌱 사계절 작물', seasons: ['사계절'] },
        { label: '🌷 봄 전용',    seasons: ['봄'] },
        { label: '🌻 여름 전용',  seasons: ['여름'] },
        { label: '🍂 가을 전용',  seasons: ['가을'] },
    ];

    panel.innerHTML = `
        <div style="max-height:300px; overflow-y:auto; padding-right:2px;">
        ${groups.map(g => {
            const crops = WIKI_CROPS.filter(c => g.seasons.includes(c.season));
            return `
            <div style="margin-bottom:8px;">
                <div style="font-size:11px; color:#888; font-weight:bold;
                            margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:2px;">
                    ${g.label}
                </div>
                ${crops.map(c => `
                <div style="background:${seasonBg[c.season] || '#1a1a1a'};
                            border:1px solid #333; border-radius:6px;
                            padding:7px 9px; margin-bottom:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-size:13px; font-weight:bold;">
                            ${c.emoji} ${c.name}
                        </span>
                        <span style="font-size:10px; color:${seasonColor[c.season]};
                                     background:rgba(0,0,0,0.3); padding:1px 6px; border-radius:3px;">
                            ${c.season}
                        </span>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:3px; font-size:10px; color:#aaa; margin-bottom:4px;">
                        <span>💰 구매: <b style="color:#ffb74d;">$${c.cost}</b></span>
                        <span>📦 판매: <b style="color:#4ff3a6;">$${c.value}</b></span>
                        <span>📈 수익률: <b style="color:#81c784;">${roiLabel(c.cost, c.value)}</b></span>
                        <span>⏱️ 성장: <b style="color:#ccc;">${growthLabel(c.growth)}</b></span>
                        <span>🌿 특성: <b style="color:#ffcc80;">${c.special || '없음'}</b></span>
                    </div>
                    <div style="font-size:10px; color:#666; font-style:italic;">
                        💡 ${c.tip}
                    </div>
                </div>`).join('')}
            </div>`;
        }).join('')}

        <div style="margin-bottom:8px;">
            <div style="font-size:11px; color:#888; font-weight:bold;
                        margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:2px;">
                ⚠️ 작물 주의사항
            </div>
            <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:8px 10px; font-size:10px; color:#aaa; line-height:1.8;">
                🌧️ <b style="color:#64b5f6;">과수분</b> — 수분 100% 상태 3일 지속 시 부패<br>
                ☀️ <b style="color:#ff7043;">가뭄</b> — 수분 0% 상태 3일 지속 시 고사<br>
                🐛 <b style="color:#ff9800;">병충해</b> — 감염 3일 후 부패 + 주변 전파<br>
                🌾 <b style="color:#a5d66a;">과숙</b> — 수확기 3일 방치 시 부패<br>
                ❄️ <b style="color:#90caf9;">냉해</b> — 봄/가을 냉해 날씨 시 딸기·옥수수 즉사<br>
                🍂 <b style="color:#ffb74d;">계절 종료</b> — 계절 전용 작물은 계절이 바뀌면 강제 폐기
            </div>
        </div>

        <div style="margin-bottom:8px;">
            <div style="font-size:11px; color:#888; font-weight:bold;
                        margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:2px;">
                💍 결혼 & 가문
            </div>
            <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:8px 10px; font-size:10px; color:#aaa; line-height:1.8;">
                💑 <b style="color:#f48fb1;">결혼</b> — 잔고 $3,000 + 개간 20칸 이상 시 이벤트 발생<br>
                👶 <b style="color:#80cbc4;">출산</b> — 결혼 후 주사위 8 이상 시 임신. 출산까지 10틱<br>
                🚜 <b style="color:#a5d66a;">승계</b> — 자녀가 청년(31일)이 되면 승계 가능<br>
                👑 <b style="color:#ffb74d;">SS급 배우자</b> — 특수 조건 달성 시 운명적 만남 이벤트 발생
            </div>
        </div>

        <div style="margin-bottom:8px;">
            <div style="font-size:11px; color:#888; font-weight:bold;
                        margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:2px;">
                🏆 엔딩 조건 (힌트)
            </div>
            <div style="background:#1a1a1a; border:1px solid #333; border-radius:6px; padding:8px 10px; font-size:10px; color:#aaa; line-height:1.8;">
                💰 <b style="color:#ffb74d;">억만장자</b> — 무부채 상태에서 큰 돈을 모으면...<br>
                🌾 <b style="color:#a5d66a;">대지주</b> — 이 땅 전부를 개간하고 오래 버티면...<br>
                👨‍👩‍👧 <b style="color:#80cbc4;">명문가</b> — 3대가 이 땅을 지키면...<br>
                👑 <b style="color:#ffcc80;">그 이상</b> — 마을에 소문이 돌고 있습니다...
            </div>
        </div>

        </div>
    `;
}
const SYS_LOG_MAX = 6;
let sysLog = [];

function addSysLog(msg) {
    const now = `${currentSeason || '봄'} ${gameDays || 1}일`;
    sysLog.unshift(`<div style="margin-bottom:3px;"><span style="color:#555;">[${now}]</span> ${msg}</div>`);
    if (sysLog.length > SYS_LOG_MAX) sysLog.pop();
    const el = document.getElementById('info');
    if (el) el.innerHTML = sysLog.join('');
    // 우측 미니 알림창에도 동시 출력
    const mini = document.getElementById('info-mini');
    if (mini) mini.innerHTML = sysLog.join('');
}

// ── 사운드 ───────────────────────────────────────────
function playSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);

        const sounds = {
            plant:   { type: 'triangle', freq: 150, gain: 0.1,  dur: 0.1  },
            harvest: { type: 'sine',     freq: 400, gain: 0.2,  dur: 0.15 },
            expand:  { type: 'triangle', freq: 200, gain: 0.15, dur: 0.2  },
            weed:    { type: 'square',   freq: 220, gain: 0.12, dur: 0.12 },
            water:   { type: 'sine',     freq: 550, gain: 0.1,  dur: 0.1  },
        };
        const s = sounds[type];
        if (!s) return;
        osc.type = s.type;
        osc.frequency.setValueAtTime(s.freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(s.gain, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + s.dur);
    } catch(e) {}
}

// ── 모바일 뷰포트 ─────────────────────────────────────
const MOBILE_VIEW = 9; // 모바일에서 보여줄 칸 수 (9×9)
let viewOffsetX = 0;    // 뷰포트 시작 X
let viewOffsetY = 0;    // 뷰포트 시작 Y
let isMobile = false;

function checkMobile() {
    isMobile = window.innerWidth <= 900;
}
window.addEventListener('resize', () => { checkMobile(); resizeCanvas(); });
checkMobile();

function resizeCanvas() {
    if (isMobile) {
        const size = Math.min(window.innerWidth - 8, 520);
        canvas.style.width  = size + 'px';
        canvas.style.height = size + 'px';
    } else {
        canvas.style.width  = '';
        canvas.style.height = '';
    }
}

function clampViewport() {
    viewOffsetX = Math.max(0, Math.min(GRID_SIZE - MOBILE_VIEW, viewOffsetX));
    viewOffsetY = Math.max(0, Math.min(GRID_SIZE - MOBILE_VIEW, viewOffsetY));
}

function centerViewOn(x, y) {
    viewOffsetX = Math.round(x - MOBILE_VIEW / 2);
    viewOffsetY = Math.round(y - MOBILE_VIEW / 2);
    clampViewport();
}

// ── 캔버스 렌더 ──────────────────────────────────────
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startX = isMobile ? viewOffsetX : 0;
    const startY = isMobile ? viewOffsetY : 0;
    const endX   = isMobile ? viewOffsetX + MOBILE_VIEW : GRID_SIZE;
    const endY   = isMobile ? viewOffsetY + MOBILE_VIEW : GRID_SIZE;
    const tileSz = isMobile ? Math.floor(canvas.width / MOBILE_VIEW) : TILE_SIZE;

    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            const tile = farmGrid[x][y];
            const cx = (x - startX) * tileSz;
            const cy = (y - startY) * tileSz;

            // 잠긴 타일
            if (!tile.isUnlocked) {
                ctx.fillStyle = '#444444'; ctx.fillRect(cx, cy, tileSz, tileSz);
                ctx.strokeStyle = '#333333'; ctx.strokeRect(cx, cy, tileSz, tileSz);
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+tileSz, cy+tileSz); ctx.stroke();
                continue;
            }

            // 토양 타일 이미지 렌더 (폴백: 기존 색상)
            const tileKey = currentSeason === '겨울' ? 'snow'
                : tile.water <= 20 ? 'dry'
                : tile.water >= 90 ? 'wet'
                : 'normal';
            const tileImg = tileImages[tileKey];
            if (tileImg) {
                ctx.drawImage(tileImg, cx, cy, tileSz, tileSz);
            } else {
                ctx.fillStyle = currentSeason === '겨울' ? '#E0F7FA'
                    : tile.water <= 20 ? '#CD853F'
                    : tile.water >= 90 ? '#4A2E1B' : '#8B5A2B';
                ctx.fillRect(cx, cy, tileSz, tileSz);
            }

            // 수분 게이지 — 과수분 시 빨간색 깜빡임
            const isOverWater = tile.overWaterDays > 0;
            const blinkOn = Math.sin(animTimer * 4) > 0;
            ctx.fillStyle = isOverWater ? (blinkOn ? '#ff1744' : '#ff6d00') : '#00b0ff';
            ctx.fillRect(cx, cy + tileSz - 4, tileSz * (tile.water / 100), 4);

            // 작물 렌더
            drawCrop(tile, cx, cy, tileSz);

            // 잡초 오버레이
            if (tile.hasWeed) {
                const weedImg = cropImages['overlay_weed'];
                if (weedImg) {
                    ctx.globalAlpha = 0.85;
                    ctx.drawImage(weedImg, cx, cy, tileSz, tileSz);
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.fillStyle = '#1B5E20'; ctx.fillRect(cx+8, cy+22, 12, 15);
                    ctx.fillStyle = '#4A148C'; ctx.fillRect(cx+12, cy+19, 4, 4);
                }
            }

            // 부패 오버레이
            if (tile.isRotten && tile.type > 0) {
                const rottenImg = cropImages['overlay_rotten'];
                if (rottenImg) {
                    ctx.globalAlpha = 0.75;
                    ctx.drawImage(rottenImg, cx, cy, tileSz, tileSz);
                    ctx.globalAlpha = 1.0;
                }
            }

            // 병충해 오버레이
            if (tile.hasPest && tile.type > 0) {
                const pestImg = cropImages['overlay_pest'];
                if (pestImg) {
                    ctx.globalAlpha = 0.85;
                    ctx.drawImage(pestImg, cx, cy, tileSz, tileSz);
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.strokeStyle = '#FF6D00'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(cx+4, cy+4); ctx.lineTo(cx+tileSz-4, cy+tileSz-4); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx+tileSz-4, cy+4); ctx.lineTo(cx+4, cy+tileSz-4); ctx.stroke();
                    ctx.lineWidth = 1;
                }
            }

            ctx.strokeStyle = '#5c3a1a'; ctx.strokeRect(cx, cy, tileSz, tileSz);
        }
    }

    // 모바일 뷰포트 이동 버튼 (화살표)
    if (isMobile) {
        const cs = canvas.width;
        const mid = cs / 2;

        function drawArrow(text, x, y) {
            // 배경 원
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.beginPath();
            ctx.arc(x, y, 22, 0, Math.PI * 2);
            ctx.fill();
            // 테두리
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.lineWidth = 1;
            // 화살표 텍스트
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y + 1);
        }

        if (viewOffsetY > 0)                          drawArrow('▲', mid,    28);
        if (viewOffsetY < GRID_SIZE - MOBILE_VIEW)    drawArrow('▼', mid,    cs - 28);
        if (viewOffsetX > 0)                          drawArrow('◀', 28,     mid);
        if (viewOffsetX < GRID_SIZE - MOBILE_VIEW)    drawArrow('▶', cs - 28, mid);
    }
}

function drawCrop(tile, cx, cy, tileSz = TILE_SIZE) {
    // ── 이미지 기반 렌더 ─────────────────────────────
    const nameMap = {
        1: 'carrot',
        2: 'potato',
        3: 'corn',
        4: 'strawberry',
        5: 'apple',
        6: 'tulip',
        7: 'wildberry',
        8: 'sunflower',
        9: 'edamame',
        10: 'pumpkin',
        11: 'sweetpotato',
    };
    const name = nameMap[tile.type];
    if (name) {
        let stage;
        if (tile.type === 5) {
            // 사과나무 7단계
            // _1: 묘목 (progress < 100 && treeHarvestCount === 0 && 첫 해)
            // _2: 첫 해 어린 나무
            // _3: 2년차~ 봄 꽃나무
            // _4: 2년차~ 여름/가을초 초록열매
            // _5: 2년차~ 가을 빨간사과 (progress >= 100)
            // _6: 수확 후 ~ 겨울 전 (열매 없는 성숙한 나무)
            // _7: 겨울 앙상한 나무
            const harvested = tile.treeHarvestCount || 0;
            if (currentSeason === '겨울') {
                stage = 7;
            } else if (harvested === 0) {
                // 첫 해
                stage = tile.progress < 30 ? 1 : 2;
            } else {
                // 2년차 이후
                if (currentSeason === '봄') stage = 3;
                else if (currentSeason === '여름') stage = 4;
                else {
                    // 가을
                    if (tile.treeHarvested) stage = 6;        // 수확 완료 후
                    else if (tile.progress >= 100) stage = 5; // 수확 가능
                    else stage = 4;                           // 성장 중
                }
            }
        } else {
            stage = tile.isRotten ? 5
                : tile.progress < 30  ? 1
                : tile.progress < 60  ? 2
                : tile.progress < 100 ? 3
                : 4;
        }
        const img = cropImages[`${name}_${stage}`];
        if (img) {
            const bounce = (!tile.isRotten && stage === 4) ? Math.sin(animTimer) * 2 : 0;
            ctx.drawImage(img, cx, cy + bounce, tileSz, tileSz);
            return;
        }
    }

    // ── 폴백: 기존 코드 렌더 ────────────────────────
    if (tile.type >= 1 && tile.type <= 4) {
        let color = tile.isRotten ? '#424242' : tile.water <= 25 ? '#9E9D24' : '#2E7D32';
        if (tile.progress < 30) {
            ctx.fillStyle = color; ctx.fillRect(cx+22, cy+22, 6, 8);
        } else if (tile.progress < 60) {
            ctx.fillStyle = color; ctx.fillRect(cx+16, cy+18, 18, 10);
        } else if (tile.progress < 100) {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(cx+25, cy+20, 12, 0, Math.PI*2); ctx.fill();
        } else {
            const bounce = tile.isRotten ? 0 : Math.sin(animTimer) * 2;
            ctx.fillStyle = tile.isRotten ? '#5D4037' : '#E65100';
            ctx.fillRect(cx+15, cy+15+bounce, 20, 20);
            ctx.strokeStyle = tile.isRotten ? '#D32F2F' : '#FFFFFF';
            ctx.lineWidth = 2; ctx.strokeRect(cx+4, cy+4, TILE_SIZE-8, TILE_SIZE-8); ctx.lineWidth = 1;
        }
    } else if (tile.type === 5) {
        ctx.fillStyle = '#5D4037'; ctx.fillRect(cx+22, cy+20, 6, 26);
        if (tile.progress < 100) {
            ctx.fillStyle = '#388E3C';
            ctx.beginPath(); ctx.arc(cx+25, cy+16, 14, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath(); ctx.arc(cx+25, cy+14, 18, 0, Math.PI*2); ctx.fill();
            if (currentSeason === '가을' && !tile.isRotten) {
                ctx.fillStyle = '#D32F2F';
                ctx.beginPath(); ctx.arc(cx+16, cy+12, 4, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx+34, cy+16, 4, 0, Math.PI*2); ctx.fill();
            }
        }
    } else if (tile.type >= 6 && SEASONAL_CROPS[tile.type]) {
        // 계절 작물 — 색상 팔레트로 구분
        const palette = {
            6:  { seed:'#f48fb1', grow:'#e91e63', ripe:'#c2185b' }, // 튤립 (핑크)
            7:  { seed:'#ef9a9a', grow:'#f44336', ripe:'#b71c1c' }, // 산딸기 (빨강)
            8:  { seed:'#fff176', grow:'#ffeb3b', ripe:'#f9a825' }, // 해바라기 (노랑)
            9:  { seed:'#a5d6a7', grow:'#66bb6a', ripe:'#2e7d32' }, // 에다마메 (초록)
            10: { seed:'#bcaaa4', grow:'#8d6e63', ripe:'#4e342e' }, // 송이버섯 (갈색)
            11: { seed:'#ffcc80', grow:'#ffa726', ripe:'#e65100' }, // 고구마 (주황)
        };
        const p = palette[tile.type];
        if (!p) return;
        const col = tile.isRotten ? '#424242' : tile.progress < 30 ? p.seed : tile.progress < 100 ? p.grow : p.ripe;

        if (tile.progress < 30) {
            ctx.fillStyle = col; ctx.fillRect(cx+22, cy+22, 6, 8);
        } else if (tile.progress < 60) {
            ctx.fillStyle = col; ctx.fillRect(cx+14, cy+16, 22, 12);
        } else if (tile.progress < 100) {
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(cx+25, cy+20, 13, 0, Math.PI*2); ctx.fill();
        } else {
            const bounce = tile.isRotten ? 0 : Math.sin(animTimer) * 2;
            ctx.fillStyle = tile.isRotten ? '#5D4037' : p.ripe;
            ctx.beginPath(); ctx.arc(cx+25, cy+20+bounce, 14, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = tile.isRotten ? '#D32F2F' : '#fff';
            ctx.lineWidth = 2; ctx.strokeRect(cx+4, cy+4, TILE_SIZE-8, TILE_SIZE-8); ctx.lineWidth = 1;
        }
    }
}

// ── 가족 UI 갱신 ─────────────────────────────────────
function updateFamilyUI() {
    const retireRemain = RETIRE_DAY - absoluteDays;
    let html = '';

    if (retireRemain <= 100 && retireRemain > 0)
        html += `<div style="font-size:10px;color:#ff9800;margin-bottom:4px;">⏳ 은퇴까지 ${retireRemain}일 — 후계자를 준비하세요!</div>`;

    html += `<div class="member-row">🧑‍🌾 ${generation}대 가장 ${playerName}: <span class="member-status status-work">${currentTool==='select'?'대기중':'도구 장착'}</span></div>`;

    if (hasSpouse) {
        const action = isPregnant ? spouseActionText : `${spouseActionText}`;
        const gradeColor = spouseGrade === 'SS' ? '#ff8c00'
                         : spouseGrade === 'S'  ? '#FFD700'
                         : spouseGrade === 'A'  ? '#4ff3a6'
                         : spouseGrade === 'B'  ? '#64b5f6' : '#aaa';
        const skillDesc = spouseGrade === 'SS' ? {
            beatrice: '병충해 전체 제거 / 명문가 엔딩 완화 / 귀족 승격 엔딩',
            joan:     '자동 급수·배수 (수분 50~70 유지)',
            scarlet:  '판매가 +10% 영구 / S급 행동',
        }[ssSpouse] || 'SS급 스킬' : {
            S: '병충해 자동 탐지·제거 / 출하×5',
            A: '3x3 광역 수확 / 출하×3',
            B: '출하×2 / 살수×2',
            C: '출하×1 / 살수×1'
        }[spouseGrade];
        const gradeTag = spouseGrade === 'SS' ? `👑 SS급 — ${spouseName}` : `[${spouseGrade}급]`;
        html += `<div class="member-row">👰 부인 ${spouseName}:
            <span class="member-status status-work" style="background:#ad1457;font-size:10px;">${action}</span>
        </div>
        <div style="font-size:10px;color:${gradeColor};margin:-2px 0 4px 18px;">${gradeTag} ${skillDesc}</div>`;
    }

    children.forEach((child, i) => {
        const isAdult = child.age >= 31;
        const icon = i === 0 ? '👶' : '🧒';
        const succeedBtn = isAdult
            ? `<button onclick="succeedFarm(${i})" style="font-size:9px;padding:1px 5px;background:#ff9800;color:#000;border:none;border-radius:3px;cursor:pointer;margin-left:4px;">승계</button>`
            : '';
        html += `<div class="member-row">${icon} ${generation+1}대 ${child.name}:
            <span class="member-status status-work" style="background:#0288d1;font-size:10px;">${child.actionText} [${child.grade}급]</span>
            ${succeedBtn}</div>`;
    });

    // 은퇴 가족 패시브
    if (retiredFamily.length > 0) {
        html += `<div style="font-size:10px;color:#888;margin:4px 0 2px;">👴 은퇴 가족 패시브 지원</div>`;
        retiredFamily.forEach(r => {
            html += `<div class="member-row" style="opacity:0.7;">👴 ${r.name}:
                <span class="member-status" style="background:#555;font-size:10px;">${r.actionText}</span>
            </div>`;
        });
    }

    document.getElementById('family-list').innerHTML = html;

    // 임신 버튼
    const btn = document.getElementById('btn-pregnancy');
    if (btn) {
        const canShow = hasSpouse && !isPregnant && children.length < MAX_CHILDREN;
        btn.style.display = canShow ? 'block' : 'none';
        if (canShow) {
            btn.innerText = pregnancyCooldown > 0
                ? `⏳ 재시도 대기 중 (${pregnancyCooldown}일 남음)`
                : '👶 2세 계획 시도 ($6,000 / 50칸 필요)';
            btn.style.background = pregnancyCooldown > 0 ? '#555' : '#ad1457';
        }
    }

    updateSeasonalButtons();
}
