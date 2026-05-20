// ── 상수 ────────────────────────────────────────────
const TILE_SIZE = 50;
const GRID_SIZE = 25;
const LOAN_LIMIT = 3000;
const MAX_CHILDREN = 3;
const RETIRE_DAY = 550;
const BILLIONAIRE_GOAL = 50000;

// ── 게임 상태 변수 ───────────────────────────────────
let money = 1000;
let currentTool = 'select';
let gameDays = 1;
let absoluteDays = 1;
let fullUnlockDay = -1;

let gameSpeed = 1;
let gameInterval = null;
let animTimer = 0;
let currentSeason = '봄';
let currentWeather = '맑음';

let totalRevenue = 0;
let totalExpense = 0;
let fixedLoanAmount = 0;

let ledgerLog = [];
let harvestLog = [];

// ── 가문 상태 ────────────────────────────────────────
let playerName = '플레이어';
let generation = 1;
let endingFired = false;
let dynastyStartDay  = -1;    // 3대 승계 시작일 (-1 = 미승계)
let mortgageActive   = false; // 담보 대출 진행 중
let mortgageDaysLeft = 120;   // 상환 남은 일수
let mortgageAmount   = 0;     // 담보 대출 잔액

// ── 배우자 상태 ─────────────────────────────────────
let hasSpouse = false;
let spouseName = '';
let spouseGrade = 'C';
let isPregnant = false;
let pregnancyDays = 0;
let pregnancyCooldown = 0;
let spouseActionText = '대기 중';
let marriageEventFired = false;

// ── 자녀 상태 ────────────────────────────────────────
let children = [];

// ── 은퇴 가족 (승계 후 패시브 지원) ─────────────────
let retiredFamily = []; 
// 구조: [{ name, grade, actionText }]

// ── 치트 상태 ────────────────────────────────────────
let cheatUnlocked = false;
let currentDiceEvent = '';

// ── 범위 도구 내구도 ─────────────────────────────────
// 각 도구별 잔여 횟수 (-1 = 미구매)
let toolDurability = {
    waterArea:    -1,  // 광역 살수기
    drainArea:    -1,  // 광역 배수펌프
    weedArea:     -1,  // 광역 제초기
    harvestArea:  -1,  // 광역 수확기
    pesticideArea:-1,  // 광역 농약분무기
};

const TOOL_SHOP = {
    waterArea:     { label: '광역 살수기',    price: 300, maxDur: 20, emoji: '💦' },
    drainArea:     { label: '광역 배수펌프',  price: 300, maxDur: 20, emoji: '🚿' },
    weedArea:      { label: '광역 제초기',    price: 500, maxDur: 15, emoji: '✂️' },
    harvestArea:   { label: '광역 수확기',    price: 800, maxDur: 10, emoji: '🌾' },
    pesticideArea: { label: '광역 농약분무기',price: 600, maxDur: 12, emoji: '🧪' },
};

// ── SS급 배우자 관련 ─────────────────────────────────
let festivalCount    = 0;     // 마을 축제 참가 횟수 (조앤 조건)
let harvestTypeSet   = new Set(); // 수확한 작물 종류 (스칼렛 조건)
let totalHarvestCount = 0;   // 누적 수확 횟수 (스칼렛 조건)
let sellBonusPct     = 0;    // 판매가 보너스 % (스칼렛 스킬)
let loanLimitBonus   = 0;    // 대출 한도 추가 보너스
let ssSpouse         = '';   // SS급 배우자 이름 ('베아트리체'|'조앤'|'스칼렛'|'')
let nobleEnding      = false; // 귀족 승격 엔딩 조건 (베아트리체 아들 출산)
let ssMarriageEventFired = { beatrice: false, joan: false, scarlet: false };

// 동적 대출 한도 (loanLimitBonus 반영)
function getLoanLimit() { return LOAN_LIMIT + loanLimitBonus; }
// type: 6~11 (기존 1~5 이후)
const SEASONAL_CROPS = {
    6:  { name: '튤립',    season: '봄',  cost: 40,  value: 120, growth: 20, emoji: '🌷', special: null },
    7:  { name: '산딸기',  season: '봄',  cost: 70,  value: 200, growth: 14, emoji: '🍓', special: null },
    8:  { name: '해바라기',season: '여름',cost: 80,  value: 220, growth: 12, emoji: '🌻', special: 'pestResist' },
    9:  { name: '풋콩',    season: '여름',cost: 60,  value: 160, growth: 16, emoji: '🫘', special: 'weedResist' },
    10: { name: '호박',    season: '가을',cost: 100, value: 350, growth: 8,  emoji: '🎃', special: null },
    11: { name: '고구마',  season: '가을',cost: 60,  value: 180, growth: 13, emoji: '🍠', special: 'frostResist' },
};
