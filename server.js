const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;
const DATA_DIR = path.join(DIR, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'payment-config.json');
const TOPUPS_FILE = path.join(DATA_DIR, 'topups.json');
const MARKET_FILE = path.join(DATA_DIR, 'market.json');
const VIP_FILE = path.join(DATA_DIR, 'vip.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'withdrawals.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SAVES_DIR = path.join(DATA_DIR, 'saves');
const ADMIN_SESSIONS = new Map(); // token -> { username, expiresAt }
const ADMIN_FAIL_TRACKER = new Map(); // ip -> { count, resetAt }
const ACTIVE_AD_SESSIONS = new Map(); // token -> { token, placement, startTime, minDurationMs, used, ip }
const AD_SECRET_KEY = process.env.AD_SECRET_KEY || 'monetag_anti_cheat_secret_sunflower_2026';

// Dọn dẹp session quảng cáo Monetag cũ sau 15 phút
setInterval(() => {
    const now = Date.now();
    for (const [token, s] of ACTIVE_AD_SESSIONS.entries()) {
        if (now - s.startTime > 15 * 60 * 1000) {
            ACTIVE_AD_SESSIONS.delete(token);
        }
    }
}, 60 * 1000);

const MARKET_FEE_NORMAL = 0.20; // Phí sàn mặc định 20% cho người chơi thường
const MARKET_FEE_VIP = 0.125; // Phí sàn ưu đãi 12,5% cho thành viên VIP

// Giá sàn cố định 15 loại nông sản & 4 loại tài nguyên đảo trên Chợ P2P và biên độ tối đa +3%
const P2P_ITEM_FLOOR_PRICES = {
    // 15 loại nông sản
    rau_mam: 10,
    anh_dao: 15,
    dau_tay: 20,
    nam_linh_chi: 25,
    khoai_tay: 30,
    carrot: 70,
    tomato: 100,
    rice: 120,
    bap_ngo: 150,
    sunflower: 180,
    dua_mat: 200,
    nho_tim: 220,
    watermelon: 250,
    bi_ngo: 270,
    lucky_tree: 300,
    // 4 loại tài nguyên tự nhiên (Gỗ, Đá, Sắt, Vàng)
    wood: 200,
    stone: 500,
    iron: 1000,
    gold_ore: 2000,
    gold: 2000,
    // Trứng Gà
    egg_normal: 300,
    egg: 300
};
const P2P_CROP_FLOOR_PRICES = P2P_ITEM_FLOOR_PRICES;
const P2P_MAX_PRICE_SURCHARGE_RATE = 0.03; // Tối đa không vượt quá 3% giá sàn cố định

const VIP_PLANS = {
    vip_1m: { id: 'vip_1m', label: '1 Tháng', days: 30, diamonds: 1500 },
    vip_3m: { id: 'vip_3m', label: '3 Tháng', days: 90, diamonds: 2500 },
    vip_6m: { id: 'vip_6m', label: '6 Tháng', days: 180, diamonds: 4500 }
};

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

// Danh mục gói nạp chuẩn trên Server (Bao gồm VND chợ + Vàng + Kim Cương)
function calcTopupVndReward(priceVnd) {
    const amt = Math.max(0, Math.floor(Number(priceVnd) || 0));
    return amt > 100000 ? Math.round(amt * 1.1) : amt;
}

const TOPUP_PACKS = [
    { id: 'pack_20k', name: 'Nạp 20.000đ', priceVnd: 20000, vnd: calcTopupVndReward(20000), gold: 0, diamonds: 0, vipMinutes: 0, badge: 'Tỉ lệ 1:1' },
    { id: 'pack_50k', name: 'Nạp 50.000đ', priceVnd: 50000, vnd: calcTopupVndReward(50000), gold: 0, diamonds: 0, vipMinutes: 0, badge: 'Tỉ lệ 1:1' },
    { id: 'pack_100k', name: 'Nạp 100.000đ', priceVnd: 100000, vnd: calcTopupVndReward(100000), gold: 0, diamonds: 0, vipMinutes: 0, badge: 'Tỉ lệ 1:1' },
    { id: 'pack_200k', name: 'Nạp 200.000đ', priceVnd: 200000, vnd: calcTopupVndReward(200000), gold: 0, diamonds: 0, vipMinutes: 0, badge: '🔥 1:1,1 (+10%)' },
    { id: 'pack_500k', name: 'Nạp 500.000đ', priceVnd: 500000, vnd: calcTopupVndReward(500000), gold: 0, diamonds: 0, vipMinutes: 0, badge: '💎 1:1,1 (+10%)' }
];

function ensureDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
        const defaultCfg = {
            adminPin: process.env.ADMIN_PIN || '123456',
            publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
            momo: {
                phone: process.env.MOMO_PHONE || '',
                name: process.env.MOMO_NAME || '',
                qrDataUrl: '',
                gatewayEnabled: false,
                partnerCode: process.env.MOMO_PARTNER_CODE || '',
                accessKey: process.env.MOMO_ACCESS_KEY || '',
                secretKey: process.env.MOMO_SECRET_KEY || '',
                sandbox: true
            },
            zalopay: {
                phone: process.env.ZALOPAY_PHONE || '',
                name: process.env.ZALOPAY_NAME || '',
                qrDataUrl: '',
                gatewayEnabled: false,
                appId: process.env.ZALOPAY_APP_ID || '',
                key1: process.env.ZALOPAY_KEY1 || '',
                key2: process.env.ZALOPAY_KEY2 || '',
                sandbox: true
            },
            bank: {
                bankName: process.env.BANK_NAME || '',
                phone: process.env.BANK_ACCOUNT || '',
                name: process.env.BANK_OWNER || '',
                qrDataUrl: ''
            }
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultCfg, null, 2), 'utf8');
    }
    if (!fs.existsSync(TOPUPS_FILE)) {
        fs.writeFileSync(TOPUPS_FILE, '[]', 'utf8');
    }
    if (!fs.existsSync(MARKET_FILE)) {
        const emptyMarket = {
            listings: [],
            pendingPayouts: [],
            treasury: {
                feeRate: MARKET_FEE_NORMAL,
                normalFeeRate: MARKET_FEE_NORMAL,
                vipFeeRate: MARKET_FEE_VIP,
                totalFeeVnd: 0,
                totalVolumeVnd: 0,
                totalTrades: 0,
                recentFees: []
            }
        };
        fs.writeFileSync(MARKET_FILE, JSON.stringify(emptyMarket, null, 2), 'utf8');
    }
    if (!fs.existsSync(VIP_FILE)) {
        fs.writeFileSync(VIP_FILE, '{}', 'utf8');
    }
    if (!fs.existsSync(SAVES_DIR)) {
        fs.mkdirSync(SAVES_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
        writeJsonAtomic(USERS_FILE, { users: {}, sessions: {} });
    }
}

function writeJsonAtomic(filePath, obj) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    const bakPath = `${filePath}.bak`;
    const serialized = JSON.stringify(obj, null, 2);
    fs.writeFileSync(tmpPath, serialized, 'utf8');
    if (fs.existsSync(filePath)) {
        try { fs.copyFileSync(filePath, bakPath); } catch (e) {}
    }
    fs.renameSync(tmpPath, filePath);
}

function readUsersStore() {
    ensureDataFiles();
    for (const p of [USERS_FILE, `${USERS_FILE}.bak`]) {
        if (!fs.existsSync(p)) continue;
        try {
            const d = JSON.parse(fs.readFileSync(p, 'utf8'));
            return {
                users: (d && typeof d.users === 'object' && !Array.isArray(d.users)) ? d.users : {},
                sessions: (d && typeof d.sessions === 'object' && !Array.isArray(d.sessions)) ? d.sessions : {}
            };
        } catch (e) {}
    }
    return { users: {}, sessions: {} };
}

function writeUsersStore(store) {
    ensureDataFiles();
    writeJsonAtomic(USERS_FILE, store);
}

function getSaveFilePath(username) {
    const clean = String(username || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    return path.join(SAVES_DIR, `${clean}.json`);
}

function readUserSave(username) {
    ensureDataFiles();
    const fp = getSaveFilePath(username);
    for (const p of [fp, `${fp}.bak`]) {
        if (!fs.existsSync(p)) continue;
        try {
            const data = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (data && typeof data === 'object' && Array.isArray(data.plots)) {
                return data;
            }
        } catch (e) {}
    }
    return null;
}

function writeUserSave(username, saveData) {
    ensureDataFiles();
    if (!saveData || typeof saveData !== 'object' || !Array.isArray(saveData.plots)) {
        return false;
    }
    writeJsonAtomic(getSaveFilePath(username), saveData);
    return true;
}

function createInitialUserSave(username) {
    return {
        economyVersion: 3,
        level: 1,
        exp: 0,
        gold: 500,       // Thưởng đúng 500 vàng khi mới vào game
        diamonds: 0,     // Tuyệt đối không có Kim Cương
        vnd: 0,          // Tuyệt đối không có VND
        energy: 20,
        maxEnergy: 20,
        selectedSeed: 'rau_mam',
        plots: Array.from({ length: 108 }, (_, i) => ({
            id: i,
            tier: i < 36 ? 1 : (i < 72 ? 2 : 3),
            unlocked: false,
            crop: null,
            plantedAt: 0,
            watered: false
        })),
        plot0AdsWatched: 0,
        resourceNodes: [
            { uid: 1, type: 'tree', harvestedAt: 0 },
            { uid: 2, type: 'tree', harvestedAt: 0 },
            { uid: 3, type: 'tree', harvestedAt: 0 },
            { uid: 4, type: 'stone', harvestedAt: 0 }
        ],
        nextNodeUid: 5,
        tools: { pick_wood: 0, pick_stone: 0, pick_iron: 0, pick_gold: 0 },
        coopTier: 1,
        chickens: [],
        coopFood: 0,
        eggsOnGround: [],
        chickenBoostUntil: 0,
        phoenixUntil: 0,
        inventory: {},
        seedBag: {},
        seedBagMigrated15: true,
        totalCakesCooked: 0,
        bakeryFilter: 'all',
        bakingSlots: {},
        rodLevel: 1,
        isVipRod: false,
        totalFishCount: 0,
        scrapQuest: {
            date: new Date().toISOString().slice(0, 10),
            claimed: false
        },
        savedAt: Date.now()
    };
}

function hashPassword(password, saltHex) {
    return crypto.scryptSync(String(password), String(saltHex), 64).toString('hex');
}

function timingSafeStrEqual(aStr, bStr) {
    const a = Buffer.from(String(aStr || ''));
    const b = Buffer.from(String(bStr || ''));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function getAuthSession(req, tokenOverride = '') {
    const token = String(tokenOverride || req.headers['x-auth-token'] || '').trim();
    if (!token) return null;
    const store = readUsersStore();
    const sess = store.sessions[token];
    if (!sess || !sess.username) return null;
    const user = store.users[sess.username];
    if (!user) return null;
    return { token, user, store };
}

function readPaymentConfig() {
    ensureDataFiles();
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function writePaymentConfig(cfg) {
    ensureDataFiles();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

function readTopups() {
    ensureDataFiles();
    try {
        return JSON.parse(fs.readFileSync(TOPUPS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeTopups(list) {
    ensureDataFiles();
    fs.writeFileSync(TOPUPS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function readMarket() {
    ensureDataFiles();
    try {
        const m = JSON.parse(fs.readFileSync(MARKET_FILE, 'utf8'));
        return {
            listings: Array.isArray(m.listings) ? m.listings : [],
            pendingPayouts: Array.isArray(m.pendingPayouts) ? m.pendingPayouts : [],
            treasury: m.treasury || {
                feeRate: MARKET_FEE_NORMAL,
                normalFeeRate: MARKET_FEE_NORMAL,
                vipFeeRate: MARKET_FEE_VIP,
                totalFeeVnd: 0,
                totalVolumeVnd: 0,
                totalTrades: 0,
                recentFees: []
            }
        };
    } catch (e) {
        return {
            listings: [],
            pendingPayouts: [],
            treasury: {
                feeRate: MARKET_FEE_NORMAL,
                normalFeeRate: MARKET_FEE_NORMAL,
                vipFeeRate: MARKET_FEE_VIP,
                totalFeeVnd: 0,
                totalVolumeVnd: 0,
                totalTrades: 0,
                recentFees: []
            }
        };
    }
}

function writeMarket(market) {
    ensureDataFiles();
    fs.writeFileSync(MARKET_FILE, JSON.stringify(market, null, 2), 'utf8');
}

function readVipStore() {
    ensureDataFiles();
    try {
        const obj = JSON.parse(fs.readFileSync(VIP_FILE, 'utf8'));
        return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
    } catch (e) {
        return {};
    }
}

function writeVipStore(store) {
    ensureDataFiles();
    fs.writeFileSync(VIP_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function readWithdrawals() {
    ensureDataFiles();
    try {
        if (!fs.existsSync(WITHDRAWALS_FILE)) return [];
        const arr = JSON.parse(fs.readFileSync(WITHDRAWALS_FILE, 'utf8'));
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function writeWithdrawals(list) {
    ensureDataFiles();
    fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function isPlayerVip(playerId) {
    if (!playerId) return false;
    const store = readVipStore();
    const rec = store[String(playerId)];
    return !!(rec && Number(rec.vipUntil || 0) > Date.now());
}

function getPlayerMarketFeeRate(playerId, landTier = 1) {
    const isVip = isPlayerVip(playerId);
    const base = isVip ? MARKET_FEE_VIP : MARKET_FEE_NORMAL;
    let discount = 0;
    if (landTier >= 3) discount = 0.05; // Lên Đất Cấp 3 giảm 5% phí chợ
    else if (landTier === 2) discount = 0.025; // Lên Đất Cấp 2 giảm 2.5% phí chợ
    return Math.max(0.01, Number((base - discount).toFixed(4)));
}

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-pin, x-admin-token, x-auth-token'
    });
    res.end(JSON.stringify(data));
}

function readJsonBody(req, maxBytes = 1024 * 1024) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on('data', chunk => {
            size += chunk.length;
            if (size > maxBytes) {
                reject(new Error('PAYLOAD_TOO_LARGE'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch (e) {
                reject(new Error('INVALID_JSON'));
            }
        });
        req.on('error', reject);
    });
}

function verifyAdminPin(req, cfg) {
    const adminToken = String(req.headers['x-admin-token'] || '').trim();
    if (adminToken) {
        const sess = ADMIN_SESSIONS.get(adminToken);
        if (sess && sess.expiresAt > Date.now()) {
            sess.expiresAt = Date.now() + 6 * 60 * 60 * 1000;
            return true;
        }
        ADMIN_SESSIONS.delete(adminToken);
    }
    const provided = String(req.headers['x-admin-pin'] || '');
    if (!provided) return false;
    const actual = String(cfg.adminPin || '123456');
    return timingSafeStrEqual(provided, actual);
}

function postHttpsJson(targetUrl, payload, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(targetUrl);
        const data = JSON.stringify(payload);
        const options = {
            hostname: u.hostname,
            port: u.port || 443,
            path: u.pathname + u.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...extraHeaders
            },
            timeout: 10000
        };
        const req = https.request(options, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
                } catch (e) {
                    reject(new Error('INVALID_GATEWAY_RESPONSE'));
                }
            });
        });
        req.on('timeout', () => {
            req.destroy(new Error('GATEWAY_TIMEOUT'));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function hmacSha256(key, data) {
    return crypto.createHmac('sha256', String(key)).update(String(data)).digest('hex');
}

function formatYyMmDd(date = new Date()) {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
}

async function createMomoGatewayPayment(cfg, order, baseUrl) {
    const m = cfg.momo || {};
    const endpoint = m.sandbox
        ? 'https://test-payment.momo.vn/v2/gateway/api/create'
        : 'https://payment.momo.vn/v2/gateway/api/create';

    const requestId = order.id + '_' + Date.now();
    const orderInfo = `Nap ${order.packName} - ${order.playerName}`.slice(0, 120);
    const redirectUrl = `${baseUrl}/?topup_order=${encodeURIComponent(order.id)}`;
    const ipnUrl = `${baseUrl}/api/webhook/momo`;
    const extraData = '';
    const requestType = 'captureWallet';

    const rawSig =
        `accessKey=${m.accessKey}` +
        `&amount=${order.amountVnd}` +
        `&extraData=${extraData}` +
        `&ipnUrl=${ipnUrl}` +
        `&orderId=${order.id}` +
        `&orderInfo=${orderInfo}` +
        `&partnerCode=${m.partnerCode}` +
        `&redirectUrl=${redirectUrl}` +
        `&requestId=${requestId}` +
        `&requestType=${requestType}`;

    const signature = hmacSha256(m.secretKey, rawSig);

    const res = await postHttpsJson(endpoint, {
        partnerCode: m.partnerCode,
        accessKey: m.accessKey,
        requestId,
        amount: order.amountVnd,
        orderId: order.id,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: 'vi'
    });

    if (res && res.resultCode === 0 && res.payUrl) {
        return { payUrl: res.payUrl, qrCodeUrl: res.qrCodeUrl || '' };
    }
    throw new Error((res && res.message) || 'MoMo API error');
}

async function createZaloPayGatewayPayment(cfg, order, baseUrl) {
    const z = cfg.zalopay || {};
    const endpoint = z.sandbox
        ? 'https://sb-openapi.zalopay.vn/v2/create'
        : 'https://openapi.zalopay.vn/v2/create';

    const appId = parseInt(z.appId, 10);
    const appTransId = `${formatYyMmDd()}_${order.id}`;
    const appUser = String(order.playerId || 'player').slice(0, 48);
    const amount = order.amountVnd;
    const appTime = Date.now();
    const embedData = JSON.stringify({ redirecturl: `${baseUrl}/?topup_order=${encodeURIComponent(order.id)}` });
    const item = JSON.stringify([{
        itemid: order.packId,
        itemname: order.packName,
        itemprice: order.amountVnd,
        itemquantity: 1
    }]);

    const hmacInput = [appId, appTransId, appUser, amount, appTime, embedData, item].join('|');
    const mac = hmacSha256(z.key1, hmacInput);

    const res = await postHttpsJson(endpoint, {
        app_id: appId,
        app_user: appUser,
        app_time: appTime,
        amount,
        app_trans_id: appTransId,
        embed_data: embedData,
        item,
        description: `Nap ${order.packName} (${order.id})`,
        bank_code: 'zalopayapp',
        callback_url: `${baseUrl}/api/webhook/zalopay`,
        mac
    });

    if (res && res.return_code === 1 && res.order_url) {
        return { payUrl: res.order_url, appTransId };
    }
    throw new Error((res && (res.sub_return_message || res.return_message)) || 'ZaloPay API error');
}

function getRequestBaseUrl(req, cfg) {
    if (cfg.publicBaseUrl && /^https?:\/\//i.test(cfg.publicBaseUrl)) {
        return cfg.publicBaseUrl.replace(/\/+$/, '');
    }
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || `localhost:${PORT}`;
    return `${proto}://${host}`;
}

async function handleApi(req, res, cleanUrl, urlObj) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-admin-pin, x-admin-token, x-auth-token'
        });
        res.end();
        return;
    }

    const cfg = readPaymentConfig();

    // ==========================================
    // MONETAG ADS & ANTI-CHEAT VERIFICATION APIS
    // ==========================================
    // Khởi tạo phiên xem quảng cáo Monetag (Tạo token bí mật và ghi nhận thời gian bắt đầu trên Server)
    if (req.method === 'POST' && cleanUrl === '/api/ad/session/start') {
        try {
            const body = await readJsonBody(req);
            const placement = String(body.placement || 'general').slice(0, 64);
            const token = crypto.randomBytes(24).toString('hex');
            const minDurationMs = 15000; // 15 giây xem tối thiểu không thể bỏ qua

            ACTIVE_AD_SESSIONS.set(token, {
                token,
                placement,
                startTime: Date.now(),
                minDurationMs,
                used: false,
                ip: req.socket.remoteAddress
            });

            return sendJson(res, 200, {
                ok: true,
                token,
                minDurationSec: 15,
                provider: 'monetag'
            });
        } catch (e) {
            return sendJson(res, 500, { ok: false, error: 'Không thể khởi tạo phiên quảng cáo Monetag.' });
        }
    }

    // Xác thực hoàn thành quảng cáo Monetag (Chống gian lận: bắt buộc đúng thời gian thực tế trên Server)
    if (req.method === 'POST' && cleanUrl === '/api/ad/session/verify') {
        try {
            const body = await readJsonBody(req);
            const token = String(body.token || '').trim();

            if (!token || !ACTIVE_AD_SESSIONS.has(token)) {
                return sendJson(res, 400, {
                    ok: false,
                    cheatDetected: true,
                    error: 'Phiên quảng cáo không hợp lệ hoặc đã hết hạn (chống gian lận)!'
                });
            }

            const s = ACTIVE_AD_SESSIONS.get(token);
            if (s.used) {
                return sendJson(res, 400, {
                    ok: false,
                    cheatDetected: true,
                    error: 'Mã xác thực quảng cáo này đã được sử dụng trước đó (chống gian lận)!'
                });
            }

            const elapsed = Date.now() - s.startTime;
            // Cho phép bù trừ độ trễ mạng tối đa 1.0 giây
            if (elapsed < (s.minDurationMs - 1000)) {
                return sendJson(res, 400, {
                    ok: false,
                    cheatDetected: true,
                    error: `Phát hiện gian lận quảng cáo: Thời gian xem thực tế (${Math.round(elapsed / 1000)}s) chưa đủ tối thiểu 15s!`
                });
            }

            s.used = true;
            const proof = crypto.createHmac('sha256', AD_SECRET_KEY)
                .update(`${token}:${s.placement}:${s.startTime}`)
                .digest('hex');

            return sendJson(res, 200, {
                ok: true,
                verified: true,
                proof,
                placement: s.placement,
                elapsedSec: Math.round(elapsed / 1000)
            });
        } catch (e) {
            return sendJson(res, 500, { ok: false, error: 'Lỗi xác minh quảng cáo.' });
        }
    }

    // Monetag S2S Postback URL
    if ((req.method === 'GET' || req.method === 'POST') && cleanUrl === '/api/monetag/postback') {
        const params = urlObj.searchParams;
        console.log('[Monetag Postback] Received S2S notification:', Object.fromEntries(params.entries()));
        return sendJson(res, 200, { ok: true, received: true });
    }

    // 0A. Đăng ký tài khoản người chơi mới (Bắt buộc trước khi vào game)
    if (req.method === 'POST' && cleanUrl === '/api/auth/register') {
        try {
            const body = await readJsonBody(req, 2 * 1024 * 1024);
            const rawUser = String(body.username || '').trim();
            const username = rawUser.toLowerCase();
            const password = String(body.password || '');
            const displayName = String(body.displayName || rawUser).trim().slice(0, 32) || rawUser;

            if (!/^[a-z0-9_]{3,24}$/.test(username)) {
                return sendJson(res, 400, { ok: false, error: 'Tên tài khoản dài 3-24 ký tự (chỉ gồm chữ không dấu, số hoặc dấu _).' });
            }
            if (password.length < 4) {
                return sendJson(res, 400, { ok: false, error: 'Mật khẩu phải có ít nhất 4 ký tự.' });
            }

            const store = readUsersStore();
            if (store.users[username]) {
                return sendJson(res, 409, { ok: false, error: 'Tên tài khoản này đã tồn tại! Vui lòng chọn tên khác hoặc Đăng nhập.' });
            }

            const salt = crypto.randomBytes(16).toString('hex');
            const passwordHash = hashPassword(password, salt);
            const playerId = `ACC_${username}`;
            store.users[username] = {
                username,
                displayName,
                playerId,
                salt,
                passwordHash,
                createdAt: Date.now(),
                lastLoginAt: Date.now()
            };

            const token = crypto.randomBytes(24).toString('hex');
            store.sessions[token] = { username, createdAt: Date.now() };
            writeUsersStore(store);

            let savedData = null;
            if (body.initialData && typeof body.initialData === 'object' && Array.isArray(body.initialData.plots)) {
                savedData = body.initialData;
            } else {
                savedData = createInitialUserSave(username);
            }
            // Quy định tuyệt đối: Tài khoản mới tạo CHỈ CÓ 500 VÀNG, 0 Kim Cương, 0 VND!
            savedData.gold = 500;
            savedData.diamonds = 0;
            savedData.vnd = 0;
            writeUserSave(username, savedData);

            return sendJson(res, 200, {
                ok: true,
                token,
                user: {
                    username,
                    displayName,
                    playerId,
                    isAdmin: !!(cfg.ownerUsername && cfg.ownerUsername === username)
                },
                saveData: savedData
            });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    // 0B. Đăng nhập tài khoản người chơi
    if (req.method === 'POST' && cleanUrl === '/api/auth/login') {
        try {
            const body = await readJsonBody(req);
            const username = String(body.username || '').trim().toLowerCase();
            const password = String(body.password || '');
            const store = readUsersStore();
            const user = store.users[username];
            if (!user) {
                return sendJson(res, 401, { ok: false, error: 'Tài khoản không tồn tại!' });
            }
            const actualHash = hashPassword(password, user.salt);
            if (!timingSafeStrEqual(actualHash, user.passwordHash)) {
                return sendJson(res, 401, { ok: false, error: 'Mật khẩu không chính xác!' });
            }

            const token = crypto.randomBytes(24).toString('hex');
            user.lastLoginAt = Date.now();
            store.sessions[token] = { username, createdAt: Date.now() };
            writeUsersStore(store);

            const saveData = readUserSave(username);
            return sendJson(res, 200, {
                ok: true,
                token,
                user: {
                    username: user.username,
                    displayName: user.displayName,
                    playerId: user.playerId,
                    isAdmin: !!(cfg.ownerUsername && cfg.ownerUsername === user.username)
                },
                saveData
            });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    // 0C. Kiểm tra phiên đăng nhập & lấy tiến độ game trên server
    if (req.method === 'GET' && cleanUrl === '/api/auth/me') {
        const auth = getAuthSession(req, urlObj.searchParams.get('token'));
        if (!auth) {
            return sendJson(res, 401, { ok: false, error: 'Chưa đăng nhập' });
        }
        const saveData = readUserSave(auth.user.username);
        const adminTok = String(req.headers['x-admin-token'] || '').trim();
        const adminSess = adminTok ? ADMIN_SESSIONS.get(adminTok) : null;
        const isOwner = !!(cfg.ownerUsername && cfg.ownerUsername === auth.user.username)
            || !!(adminSess && adminSess.expiresAt > Date.now());
        return sendJson(res, 200, {
            ok: true,
            user: {
                username: auth.user.username,
                displayName: auth.user.displayName,
                playerId: auth.user.playerId,
                isAdmin: isOwner
            },
            saveData
        });
    }

    // 0D. Lưu dữ liệu tiến độ người chơi (Atomic Write + Backup .bak, hỗ trợ sendBeacon)
    if (req.method === 'POST' && cleanUrl === '/api/save') {
        try {
            const body = await readJsonBody(req, 3 * 1024 * 1024);
            const auth = getAuthSession(req, body.token);
            if (!auth) {
                return sendJson(res, 401, { ok: false, error: 'Phiên đăng nhập không hợp lệ.' });
            }
            const ok = writeUserSave(auth.user.username, body.saveData);
            if (!ok) {
                return sendJson(res, 400, { ok: false, error: 'Dữ liệu lưu không hợp lệ.' });
            }
            return sendJson(res, 200, { ok: true, savedAt: Date.now() });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    // 0E. Đăng xuất (Lưu dữ liệu lần cuối trước khi hủy session)
    if (req.method === 'POST' && cleanUrl === '/api/auth/logout') {
        try {
            const body = await readJsonBody(req, 3 * 1024 * 1024);
            const auth = getAuthSession(req, body.token);
            if (auth) {
                if (body.saveData) {
                    writeUserSave(auth.user.username, body.saveData);
                }
                delete auth.store.sessions[auth.token];
                writeUsersStore(auth.store);
            }
            const adminTok = String(req.headers['x-admin-token'] || body.adminToken || '').trim();
            if (adminTok) ADMIN_SESSIONS.delete(adminTok);
            return sendJson(res, 200, { ok: true });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    // 1. Public Payment Info (KHÔNG bao giờ trả ra adminPin hay secretKey/key1/key2)
    if (req.method === 'GET' && cleanUrl === '/api/payment/public-info') {
        const m = cfg.momo || {};
        const z = cfg.zalopay || {};
        const b = cfg.bank || {};
        const momoGatewayReady = !!(m.gatewayEnabled && m.partnerCode && m.accessKey && m.secretKey);
        const zaloGatewayReady = !!(z.gatewayEnabled && z.appId && z.key1 && z.key2);
        return sendJson(res, 200, {
            ok: true,
            packs: TOPUP_PACKS,
            rateRule: {
                thresholdVnd: 100000,
                baseRate: 1,
                bonusRate: 1.1,
                minCustomVnd: 10000
            },
            momo: {
                phone: m.phone || '',
                name: m.name || '',
                qrDataUrl: m.qrDataUrl || '',
                gatewayEnabled: momoGatewayReady,
                configured: !!(m.phone || m.qrDataUrl || momoGatewayReady)
            },
            zalopay: {
                phone: z.phone || '',
                name: z.name || '',
                qrDataUrl: z.qrDataUrl || '',
                gatewayEnabled: zaloGatewayReady,
                configured: !!(z.phone || z.qrDataUrl || zaloGatewayReady)
            },
            bank: {
                bankName: b.bankName || '',
                phone: b.phone || '',
                name: b.name || '',
                qrDataUrl: b.qrDataUrl || '',
                gatewayEnabled: false,
                configured: !!(b.phone || b.qrDataUrl || b.bankName)
            }
        });
    }

    // 2. Tạo đơn nạp tiền (chỉ nạp VND: <=100k tỉ lệ 1:1, >100k tỉ lệ 1:1,1; qua MoMo / ZaloPay / Ngân Hàng)
    if (req.method === 'POST' && cleanUrl === '/api/topup/create') {
        try {
            const body = await readJsonBody(req);
            const pack = body.packId ? TOPUP_PACKS.find(p => p.id === body.packId) : null;
            const allowedMethods = ['momo', 'zalopay', 'bank'];
            const method = allowedMethods.includes(body.method) ? body.method : null;
            const playerId = String(body.playerId || '').trim().slice(0, 64);
            const playerName = String(body.playerName || 'Nông Dân').trim().slice(0, 48);

            let amountVnd = 0;
            let packId = 'custom_vnd';
            let packName = 'Nạp VND Chợ';
            if (pack) {
                amountVnd = pack.priceVnd;
                packId = pack.id;
                packName = pack.name;
            } else if (body.amountVnd !== undefined && body.amountVnd !== null) {
                const customAmt = Math.floor(Number(body.amountVnd) || 0);
                if (customAmt >= 10000 && customAmt <= 50000000) {
                    amountVnd = customAmt;
                    packName = `Nạp ${customAmt.toLocaleString('vi-VN')}đ VND`;
                }
            }

            if (!amountVnd || !method || !playerId) {
                return sendJson(res, 400, { ok: false, error: 'Số tiền nạp (tối thiểu 10.000đ) hoặc kênh thanh toán không hợp lệ.' });
            }

            const vndReward = calcTopupVndReward(amountVnd);
            const methodCfg = cfg[method] || {};
            const gatewayReady = method === 'momo'
                ? !!(methodCfg.gatewayEnabled && methodCfg.partnerCode && methodCfg.accessKey && methodCfg.secretKey)
                : (method === 'zalopay'
                    ? !!(methodCfg.gatewayEnabled && methodCfg.appId && methodCfg.key1 && methodCfg.key2)
                    : false);
            const personalReady = method === 'bank'
                ? !!(methodCfg.phone || methodCfg.qrDataUrl || methodCfg.bankName)
                : !!(methodCfg.phone || methodCfg.qrDataUrl);

            if (!gatewayReady && !personalReady) {
                const methodLabel = method === 'momo' ? 'MoMo' : (method === 'zalopay' ? 'ZaloPay' : 'Ngân Hàng');
                return sendJson(res, 400, {
                    ok: false,
                    code: 'WALLET_NOT_CONFIGURED',
                    error: `Chủ game chưa cấu hình tài khoản ${methodLabel} nhận tiền. Hãy vào Cài Đặt ⚙️ -> Quản Trị Nạp Tiền để điền thông tin/QR!`
                });
            }

            const randomCode = crypto.randomBytes(2).toString('hex').toUpperCase();
            const orderId = `NAP${Date.now().toString().slice(-6)}${randomCode}`;

            const order = {
                id: orderId,
                playerId,
                playerName,
                method,
                packId,
                packName,
                amountVnd,
                vndReward,
                goldReward: 0,
                diamondReward: 0,
                vipMinutes: 0,
                transferNote: orderId,
                mode: gatewayReady ? 'gateway' : 'personal',
                status: 'awaiting_payment',
                claimed: false,
                gatewayPayUrl: '',
                appTransId: '',
                rejectReason: '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            if (gatewayReady) {
                const baseUrl = getRequestBaseUrl(req, cfg);
                if (method === 'momo') {
                    const gw = await createMomoGatewayPayment(cfg, order, baseUrl);
                    order.gatewayPayUrl = gw.payUrl;
                } else if (method === 'zalopay') {
                    const gw = await createZaloPayGatewayPayment(cfg, order, baseUrl);
                    order.gatewayPayUrl = gw.payUrl;
                    order.appTransId = gw.appTransId;
                }
            }

            const topups = readTopups();
            topups.unshift(order);
            if (topups.length > 500) topups.length = 500;
            writeTopups(topups);

            return sendJson(res, 200, {
                ok: true,
                order,
                receiver: {
                    bankName: methodCfg.bankName || '',
                    phone: methodCfg.phone || '',
                    name: methodCfg.name || '',
                    qrDataUrl: methodCfg.qrDataUrl || ''
                }
            });
        } catch (err) {
            return sendJson(res, 500, { ok: false, error: 'Lỗi tạo đơn nạp: ' + err.message });
        }
    }

    // 3. Người chơi báo đã chuyển khoản (chỉ chuyển sang pending_review, KHÔNG cộng tiền trước khi Admin duyệt)
    if (req.method === 'POST' && cleanUrl === '/api/topup/mark-transferred') {
        try {
            const body = await readJsonBody(req);
            const orderId = String(body.orderId || '');
            const playerId = String(body.playerId || '');
            const topups = readTopups();
            const order = topups.find(o => o.id === orderId && o.playerId === playerId);

            if (!order) return sendJson(res, 404, { ok: false, error: 'Không tìm thấy đơn nạp.' });
            if (order.status === 'awaiting_payment') {
                order.status = 'pending_review';
                order.updatedAt = Date.now();
                writeTopups(topups);
            }
            return sendJson(res, 200, { ok: true, order });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    // 4. Lấy danh sách đơn của người chơi để theo dõi trạng thái & tự động nhận quà khi đã duyệt
    if (req.method === 'GET' && cleanUrl === '/api/topup/my-orders') {
        const playerId = String(urlObj.searchParams.get('playerId') || '');
        if (!playerId) return sendJson(res, 400, { ok: false, error: 'Thiếu playerId' });
        const topups = readTopups().filter(o => o.playerId === playerId).slice(0, 20);
        return sendJson(res, 200, { ok: true, orders: topups });
    }

    // 5. Nhận quà đơn đã được duyệt (Idempotent - chỉ cộng 1 lần duy nhất)
    if (req.method === 'POST' && cleanUrl === '/api/topup/claim') {
        try {
            const body = await readJsonBody(req);
            const orderId = String(body.orderId || '');
            const playerId = String(body.playerId || '');
            const topups = readTopups();
            const order = topups.find(o => o.id === orderId && o.playerId === playerId);

            if (!order) return sendJson(res, 404, { ok: false, error: 'Không tìm thấy đơn nạp.' });
            if (order.status !== 'approved') {
                return sendJson(res, 400, { ok: false, error: 'Đơn chưa được xác nhận thanh toán.' });
            }
            if (order.claimed) {
                return sendJson(res, 409, { ok: false, error: 'Gói nạp này đã được cộng quà trước đó.' });
            }

            order.claimed = true;
            order.updatedAt = Date.now();
            writeTopups(topups);

            return sendJson(res, 200, {
                ok: true,
                rewards: {
                    orderId: order.id,
                    packName: order.packName,
                    vnd: order.vndReward || 0,
                    gold: order.goldReward,
                    diamonds: order.diamondReward,
                    vipMinutes: order.vipMinutes || 0
                }
            });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    // 6A. Webhook IPN chính thức từ MoMo v2
    if (req.method === 'POST' && cleanUrl === '/api/webhook/momo') {
        try {
            const body = await readJsonBody(req);
            const m = cfg.momo || {};
            if (!m.accessKey || !m.secretKey) return sendJson(res, 400, { message: 'MoMo API not configured' });

            const rawSig =
                `accessKey=${m.accessKey}` +
                `&amount=${body.amount}` +
                `&extraData=${body.extraData || ''}` +
                `&message=${body.message}` +
                `&orderId=${body.orderId}` +
                `&orderInfo=${body.orderInfo}` +
                `&orderType=${body.orderType}` +
                `&partnerCode=${body.partnerCode}` +
                `&payType=${body.payType}` +
                `&requestId=${body.requestId}` +
                `&responseTime=${body.responseTime}` +
                `&resultCode=${body.resultCode}` +
                `&transId=${body.transId}`;

            const expectedSig = hmacSha256(m.secretKey, rawSig);
            if (expectedSig !== body.signature) {
                return sendJson(res, 403, { message: 'Invalid signature' });
            }

            if (Number(body.resultCode) === 0) {
                const topups = readTopups();
                const order = topups.find(o => o.id === body.orderId);
                if (order && Number(order.amountVnd) === Number(body.amount)) {
                    order.status = 'approved';
                    order.gatewayTransId = body.transId;
                    order.updatedAt = Date.now();
                    writeTopups(topups);
                }
            }
            return sendJson(res, 200, { message: 'OK' });
        } catch (err) {
            return sendJson(res, 400, { message: err.message });
        }
    }

    // 6B. Webhook Callback chính thức từ ZaloPay v2
    if (req.method === 'POST' && cleanUrl === '/api/webhook/zalopay') {
        try {
            const body = await readJsonBody(req);
            const z = cfg.zalopay || {};
            if (!z.key2) return sendJson(res, 200, { return_code: 2, return_message: 'Key2 not configured' });

            const expectedMac = hmacSha256(z.key2, body.data || '');
            if (expectedMac !== body.mac) {
                return sendJson(res, 200, { return_code: -1, return_message: 'mac not equal' });
            }

            const dataJson = JSON.parse(body.data);
            const topups = readTopups();
            const order = topups.find(o => o.appTransId === dataJson.app_trans_id);
            if (order && Number(order.amountVnd) === Number(dataJson.amount)) {
                order.status = 'approved';
                order.gatewayTransId = dataJson.zp_trans_id;
                order.updatedAt = Date.now();
                writeTopups(topups);
            }
            return sendJson(res, 200, { return_code: 1, return_message: 'success' });
        } catch (err) {
            return sendJson(res, 200, { return_code: 0, return_message: err.message });
        }
    }

    // ==============================================
    // VIP ACCESS SYSTEM (MUA VIP KIM CƯƠNG / GIẢM PHÍ CHỢ 20% -> 12.5%)
    // ==============================================
    if (req.method === 'GET' && cleanUrl === '/api/vip/status') {
        const playerId = String(urlObj.searchParams.get('playerId') || '');
        const store = readVipStore();
        const rec = playerId ? store[playerId] : null;
        const vipUntil = rec ? Number(rec.vipUntil || 0) : 0;
        const isVip = vipUntil > Date.now();
        return sendJson(res, 200, {
            ok: true,
            isVip,
            vipUntil: isVip ? vipUntil : 0,
            planId: isVip ? (rec.planId || 'vip_1m') : null,
            feeRate: isVip ? MARKET_FEE_VIP : MARKET_FEE_NORMAL,
            normalFeeRate: MARKET_FEE_NORMAL,
            vipFeeRate: MARKET_FEE_VIP,
            plans: Object.values(VIP_PLANS)
        });
    }

    if (req.method === 'POST' && cleanUrl === '/api/vip/activate') {
        try {
            const body = await readJsonBody(req);
            const playerId = String(body.playerId || '').trim();
            const playerName = String(body.playerName || 'Nông Dân').trim().slice(0, 40);
            const planId = String(body.planId || '').trim();
            const plan = VIP_PLANS[planId] || (planId === 'vip_2y' ? VIP_PLANS.vip_6m : null);
            if (!playerId || !plan) {
                return sendJson(res, 400, { ok: false, error: 'Thiếu playerId hoặc gói VIP không hợp lệ' });
            }

            const store = readVipStore();
            const prev = store[playerId] || {};
            const baseMs = Math.max(Date.now(), Number(prev.vipUntil || 0));
            const vipUntil = baseMs + plan.days * 86400 * 1000;
            store[playerId] = {
                playerId,
                playerName,
                planId: plan.id,
                planLabel: plan.label,
                diamondsCost: plan.diamonds,
                vipUntil,
                updatedAt: Date.now()
            };
            writeVipStore(store);

            return sendJson(res, 200, {
                ok: true,
                isVip: true,
                vipUntil,
                planId: plan.id,
                plan,
                feeRate: MARKET_FEE_VIP
            });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    // ==============================================
    // RÚT TIỀN VND TỈ LỆ 1:1 (NGÂN HÀNG / MOMO / ZALOPAY)
    // ==============================================
    if (req.method === 'POST' && cleanUrl === '/api/withdraw/request') {
        try {
            const body = await readJsonBody(req);
            const playerId = String(body.playerId || '').trim();
            const playerName = String(body.playerName || 'Cần Thủ').trim();
            const method = String(body.method || 'bank').trim();
            const destination = String(body.destination || '').trim();
            const amountVnd = Math.floor(Number(body.amountVnd || 0));

            if (!playerId || !destination || amountVnd < 5000) {
                return sendJson(res, 400, { ok: false, error: 'Thông tin rút tiền không hợp lệ hoặc dưới 5.000đ' });
            }

            const list = readWithdrawals();
            const newRequest = {
                id: 'wd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                playerId,
                playerName,
                method,
                destination,
                amountVnd,
                rate: '1:1',
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            list.unshift(newRequest);
            writeWithdrawals(list);

            return sendJson(res, 200, { ok: true, request: newRequest });
        } catch (err) {
            return sendJson(res, 500, { ok: false, error: err.message });
        }
    }

    // ==============================================
    // CHỢ P2P NGƯỜI CHƠI VỚI NGƯỜI CHƠI (THƯỜNG 20% / VIP 12.5%)
    // ==============================================
    if (req.method === 'GET' && cleanUrl === '/api/market/listings') {
        const playerId = String(urlObj.searchParams.get('playerId') || '');
        const landTier = Number(urlObj.searchParams.get('landTier') || 1);
        const market = readMarket();
        const activeListings = market.listings.filter(l => l.status === 'active');
        const unclaimedPayouts = playerId
            ? market.pendingPayouts.filter(p => p.sellerId === playerId && !p.claimed)
            : [];
        const isVip = isPlayerVip(playerId);
        const feeRate = getPlayerMarketFeeRate(playerId, landTier);
        return sendJson(res, 200, {
            ok: true,
            isVip,
            landTier,
            feeRate,
            normalFeeRate: MARKET_FEE_NORMAL,
            vipFeeRate: MARKET_FEE_VIP,
            listings: activeListings,
            unclaimedPayouts,
            treasuryStats: {
                totalTrades: market.treasury.totalTrades || 0,
                totalVolumeVnd: market.treasury.totalVolumeVnd || 0
            }
        });
    }

    if (req.method === 'POST' && cleanUrl === '/api/market/create') {
        try {
            const body = await readJsonBody(req);
            const sellerId = String(body.sellerId || '').trim().slice(0, 64);
            const sellerName = String(body.sellerName || 'Nông Dân').trim().slice(0, 48);
            const itemId = String(body.itemId || '').trim().slice(0, 48);
            const itemName = String(body.itemName || '').trim().slice(0, 64);
            const itemIcon = String(body.itemIcon || '📦').slice(0, 12);
            const category = String(body.category || 'crop').slice(0, 24);
            const qty = Math.floor(Number(body.qty || 0));
            const totalPriceVnd = Math.round(Number(body.totalPriceVnd || 0) * 10) / 10;
            const sellerLandTier = Math.max(1, Math.min(3, Math.floor(Number(body.sellerLandTier || 1))));

            if (!sellerId || !itemId || !itemName || qty < 1 || qty > 9999 || totalPriceVnd < 10) {
                return sendJson(res, 400, { ok: false, error: 'Thông tin đăng bán không hợp lệ (giá tối thiểu 10đ).' });
            }

            if (itemId.startsWith('chicken_') || itemId.startsWith('cake_') || itemId.startsWith('fish_') || itemId === 'chest') {
                return sendJson(res, 400, { ok: false, error: 'Cá không thể đăng bán trên Chợ P2P! Cá chỉ dùng để tăng EXP hoặc trả nhiệm vụ cho Long Nữ.' });
            }

            // Kiểm tra giá sàn cố định & biên độ tối đa +3% đối với Nông Sản và Tài Nguyên (hỗ trợ số lẻ 1 chữ số thập phân)
            if (P2P_ITEM_FLOOR_PRICES[itemId]) {
                const floor = P2P_ITEM_FLOOR_PRICES[itemId];
                const minTotalPrice = Math.round(qty * floor * 10) / 10;
                const maxTotalPrice = Math.floor(qty * floor * (1 + P2P_MAX_PRICE_SURCHARGE_RATE) * 10) / 10;
                if (totalPriceVnd < minTotalPrice) {
                    return sendJson(res, 400, {
                        ok: false,
                        error: `Tổng giá bán ${itemName} không được dưới tổng giá sàn (${qty} món x ${floor}đ = tối thiểu ${minTotalPrice.toLocaleString('vi-VN')}đ)!`
                    });
                }
                if (totalPriceVnd > maxTotalPrice) {
                    return sendJson(res, 400, {
                        ok: false,
                        error: `Tổng giá bán ${itemName} không được vượt quá +3% tổng giá sàn (${qty} món x ${floor}đ = ${minTotalPrice.toLocaleString('vi-VN')}đ, tối đa ${maxTotalPrice.toLocaleString('vi-VN')}đ sau +3%)!`
                    });
                }
            }

            const isVip = isPlayerVip(sellerId);
            const market = readMarket();

            // Nếu không mua VIP thì chỉ bán được 1 món hàng mỗi ngày trên Chợ
            if (!isVip) {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayStartMs = todayStart.getTime();

                const listingsToday = market.listings.filter(l => l.sellerId === sellerId && l.createdAt >= todayStartMs).length;
                if (listingsToday >= 1) {
                    return sendJson(res, 403, {
                        ok: false,
                        error: 'Tài khoản thường chỉ được đăng bán 1 món hàng mỗi ngày trên Chợ! Hãy mua VIP để bán không giới hạn.'
                    });
                }
            }

            const myActive = market.listings.filter(l => l.sellerId === sellerId && l.status === 'active');
            if (myActive.length >= 20) {
                return sendJson(res, 400, { ok: false, error: 'Bạn chỉ có thể treo tối đa 20 sạp hàng cùng lúc!' });
            }

            const id = `MKT${Date.now().toString().slice(-6)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            const listing = {
                id,
                sellerId,
                sellerName,
                sellerLandTier,
                itemId,
                itemName,
                itemIcon,
                category,
                qty,
                totalPriceVnd,
                unitPriceVnd: Math.round((totalPriceVnd / qty) * 10) / 10,
                status: 'active',
                createdAt: Date.now()
            };

            market.listings.unshift(listing);
            if (market.listings.length > 500) market.listings.length = 500;
            writeMarket(market);

            return sendJson(res, 200, { ok: true, listing });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    if (req.method === 'POST' && cleanUrl === '/api/market/cancel') {
        try {
            const body = await readJsonBody(req);
            const listingId = String(body.listingId || '');
            const playerId = String(body.playerId || '');
            const market = readMarket();
            const listing = market.listings.find(l => l.id === listingId && l.sellerId === playerId);

            if (!listing) return sendJson(res, 404, { ok: false, error: 'Không tìm thấy sạp hàng.' });
            if (listing.status !== 'active') {
                return sendJson(res, 409, { ok: false, error: 'Sạp hàng này đã được mua hoặc đã hủy trước đó.' });
            }

            listing.status = 'cancelled';
            listing.updatedAt = Date.now();
            writeMarket(market);

            return sendJson(res, 200, { ok: true, itemId: listing.itemId, qty: listing.qty, itemName: listing.itemName });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    if (req.method === 'POST' && cleanUrl === '/api/market/buy') {
        try {
            const body = await readJsonBody(req);
            const listingId = String(body.listingId || '');
            const buyerId = String(body.buyerId || '').trim().slice(0, 64);
            const buyerName = String(body.buyerName || 'Khách Mua').trim().slice(0, 48);

            if (!listingId || !buyerId) {
                return sendJson(res, 400, { ok: false, error: 'Thiếu thông tin người mua.' });
            }

            const market = readMarket();
            const listing = market.listings.find(l => l.id === listingId);
            if (!listing) return sendJson(res, 404, { ok: false, error: 'Không tìm thấy sạp hàng.' });
            if (listing.status !== 'active') {
                return sendJson(res, 409, { ok: false, error: 'Món hàng này vừa có người khác mua mất rồi!' });
            }
            if (listing.sellerId === buyerId) {
                return sendJson(res, 400, { ok: false, error: 'Bạn không thể tự mua sạp hàng của chính mình! Hãy bấm Thu Hồi nếu muốn lấy lại.' });
            }

            const sellerIsVip = isPlayerVip(listing.sellerId);
            const sellerLandTier = Number(listing.sellerLandTier || 1);
            const appliedFeeRate = getPlayerMarketFeeRate(listing.sellerId, sellerLandTier);
            const normalFeeVnd = Math.max(1, Math.round(listing.totalPriceVnd * MARKET_FEE_NORMAL * 10) / 10);
            const feeVnd = Math.max(1, Math.round(listing.totalPriceVnd * appliedFeeRate * 10) / 10);
            const netVnd = Math.round((listing.totalPriceVnd - feeVnd) * 10) / 10;
            const savedFeeVnd = Math.max(0, Math.round((normalFeeVnd - feeVnd) * 10) / 10);

            listing.status = 'sold';
            listing.buyerId = buyerId;
            listing.buyerName = buyerName;
            listing.soldAt = Date.now();

            market.pendingPayouts.unshift({
                id: `PAY${Date.now().toString().slice(-6)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
                listingId: listing.id,
                sellerId: listing.sellerId,
                buyerName,
                itemName: listing.itemName,
                itemIcon: listing.itemIcon,
                qty: listing.qty,
                grossVnd: listing.totalPriceVnd,
                feeVnd,
                netVnd,
                appliedFeeRate,
                sellerIsVip,
                savedFeeVnd,
                isOwnerFee: false,
                claimed: false,
                createdAt: Date.now()
            });

            // Tự động chuyển phí chênh lệch sàn P2P (feeVnd) về tài khoản của chủ game (mặc định lequocviet94nb)
            if (feeVnd > 0) {
                const ownerUsername = cfg.ownerUsername || 'lequocviet94nb';
                const usersStore = readUsersStore();
                let ownerPlayerId = 'ACC_' + ownerUsername;
                let ownerDisplayName = 'Chủ Game';
                if (usersStore.users && usersStore.users[ownerUsername]) {
                    if (usersStore.users[ownerUsername].playerId) {
                        ownerPlayerId = usersStore.users[ownerUsername].playerId;
                    }
                    if (usersStore.users[ownerUsername].displayName) {
                        ownerDisplayName = usersStore.users[ownerUsername].displayName;
                    }
                }

                market.pendingPayouts.unshift({
                    id: `FEE${Date.now().toString().slice(-6)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
                    listingId: listing.id,
                    sellerId: ownerPlayerId,
                    isOwnerFee: true,
                    ownerUsername,
                    ownerDisplayName,
                    buyerName,
                    sellerName: listing.sellerName,
                    itemName: listing.itemName,
                    itemIcon: listing.itemIcon,
                    qty: listing.qty,
                    grossVnd: listing.totalPriceVnd,
                    feeVnd: 0,
                    netVnd: feeVnd,
                    appliedFeeRate,
                    claimed: false,
                    createdAt: Date.now()
                });
            }

            if (market.pendingPayouts.length > 500) market.pendingPayouts.length = 500;

            market.treasury.feeRate = MARKET_FEE_NORMAL;
            market.treasury.normalFeeRate = MARKET_FEE_NORMAL;
            market.treasury.vipFeeRate = MARKET_FEE_VIP;
            market.treasury.totalFeeVnd = (market.treasury.totalFeeVnd || 0) + feeVnd;
            market.treasury.totalVolumeVnd = (market.treasury.totalVolumeVnd || 0) + listing.totalPriceVnd;
            market.treasury.totalTrades = (market.treasury.totalTrades || 0) + 1;
            market.treasury.recentFees = market.treasury.recentFees || [];
            market.treasury.recentFees.unshift({
                listingId: listing.id,
                itemName: listing.itemName,
                qty: listing.qty,
                grossVnd: listing.totalPriceVnd,
                feeVnd,
                appliedFeeRate,
                sellerIsVip,
                sellerName: listing.sellerName,
                buyerName,
                at: Date.now()
            });
            if (market.treasury.recentFees.length > 50) market.treasury.recentFees.length = 50;

            writeMarket(market);
            return sendJson(res, 200, { ok: true, listing, feeVnd, netVnd, appliedFeeRate, sellerIsVip, savedFeeVnd });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    if (req.method === 'POST' && cleanUrl === '/api/market/claim-payouts') {
        try {
            const body = await readJsonBody(req);
            const playerId = String(body.playerId || '');
            if (!playerId) return sendJson(res, 400, { ok: false, error: 'Thiếu playerId' });

            const market = readMarket();
            const ready = market.pendingPayouts.filter(p => p.sellerId === playerId && !p.claimed);
            let totalNetVnd = 0;
            let totalSavedFeeVnd = 0;
            let totalOwnerFeeVnd = 0;
            let ownerFeeCount = 0;
            let sellerSaleCount = 0;

            ready.forEach(p => {
                p.claimed = true;
                p.claimedAt = Date.now();
                const net = Number(p.netVnd || 0);
                totalNetVnd += net;
                if (p.isOwnerFee) {
                    totalOwnerFeeVnd += net;
                    ownerFeeCount++;
                } else {
                    sellerSaleCount++;
                    totalSavedFeeVnd += Number(p.savedFeeVnd || 0);
                }
            });
            if (ready.length > 0) writeMarket(market);

            return sendJson(res, 200, {
                ok: true,
                totalNetVnd,
                totalSavedFeeVnd,
                totalOwnerFeeVnd,
                ownerFeeCount,
                sellerSaleCount,
                payouts: ready
            });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    // ==============================================
    // ADMIN APIs (CHỦ GAME - BẢO VỆ BẰNG MÃ PIN + CHỐNG DÒ PIN)
    // ==============================================
    if (req.method === 'POST' && cleanUrl === '/api/admin/login') {
        try {
            const clientIp = String(req.socket?.remoteAddress || 'local');
            const now = Date.now();
            let tracker = ADMIN_FAIL_TRACKER.get(clientIp);
            if (tracker && tracker.resetAt > now && tracker.count >= 5) {
                const waitSec = Math.ceil((tracker.resetAt - now) / 1000);
                return sendJson(res, 429, { ok: false, error: `Nhập sai mã PIN quá nhiều lần! Vui lòng thử lại sau ${waitSec} giây.` });
            }

            const body = await readJsonBody(req);
            const pin = String(body.pin || '').trim();
            const actual = String(cfg.adminPin || '123456');
            const auth = getAuthSession(req);

            if (!pin || !timingSafeStrEqual(pin, actual)) {
                if (!tracker || tracker.resetAt <= now) {
                    tracker = { count: 1, resetAt: now + 5 * 60 * 1000 };
                } else {
                    tracker.count += 1;
                }
                ADMIN_FAIL_TRACKER.set(clientIp, tracker);
                const left = Math.max(0, 5 - tracker.count);
                return sendJson(res, 401, {
                    ok: false,
                    error: left > 0 ? `Sai mã PIN Quản Trị! Còn ${left} lần thử.` : 'Sai mã PIN quá 5 lần! Đã tạm khóa 5 phút.'
                });
            }

            if (cfg.ownerUsername && auth && auth.user.username !== cfg.ownerUsername) {
                return sendJson(res, 403, { ok: false, error: 'Tài khoản này không phải Chủ Game được ủy quyền!' });
            }

            ADMIN_FAIL_TRACKER.delete(clientIp);
            if (!cfg.ownerUsername && auth) {
                cfg.ownerUsername = auth.user.username;
                writePaymentConfig(cfg);
            }

            const adminToken = crypto.randomBytes(24).toString('hex');
            ADMIN_SESSIONS.set(adminToken, {
                username: auth ? auth.user.username : (cfg.ownerUsername || 'owner'),
                expiresAt: now + 6 * 60 * 60 * 1000
            });

            return sendJson(res, 200, {
                ok: true,
                adminToken,
                ownerUsername: cfg.ownerUsername || '',
                usingDefaultPin: actual === '123456'
            });
        } catch (err) {
            return sendJson(res, 400, { ok: false, error: err.message });
        }
    }

    if (cleanUrl.startsWith('/api/admin/')) {
        if (!verifyAdminPin(req, cfg)) {
            return sendJson(res, 401, { ok: false, error: 'Sai mã PIN Quản Trị hoặc phiên quản trị đã hết hạn!' });
        }
        const auth = getAuthSession(req);
        if (cfg.ownerUsername && auth && auth.user.username !== cfg.ownerUsername) {
            return sendJson(res, 403, { ok: false, error: 'Chỉ tài khoản Chủ Game mới có quyền truy cập cài đặt này!' });
        }

        if (req.method === 'POST' && cleanUrl === '/api/admin/bind-owner') {
            if (!auth) {
                return sendJson(res, 401, { ok: false, error: 'Cần đăng nhập tài khoản để gắn quyền Chủ Game.' });
            }
            cfg.ownerUsername = auth.user.username;
            writePaymentConfig(cfg);
            return sendJson(res, 200, { ok: true, ownerUsername: cfg.ownerUsername });
        }

        if (req.method === 'GET' && cleanUrl === '/api/admin/dashboard') {
            const topups = readTopups();
            const market = readMarket();
            const approvedList = topups.filter(o => o.status === 'approved');
            const pendingCount = topups.filter(o => o.status === 'pending_review').length;
            const totalRevenueVnd = approvedList.reduce((s, o) => s + Number(o.amountVnd || 0), 0);

            const safeCfg = {
                publicBaseUrl: cfg.publicBaseUrl || '',
                usingDefaultPin: String(cfg.adminPin || '123456') === '123456',
                ownerUsername: cfg.ownerUsername || '',
                momo: cfg.momo || {},
                zalopay: cfg.zalopay || {},
                bank: cfg.bank || {}
            };

            return sendJson(res, 200, {
                ok: true,
                stats: { totalRevenueVnd, pendingCount, approvedCount: approvedList.length },
                marketTreasury: {
                    feeRate: market.treasury.feeRate || MARKET_FEE_NORMAL,
                    normalFeeRate: MARKET_FEE_NORMAL,
                    vipFeeRate: MARKET_FEE_VIP,
                    totalFeeVnd: market.treasury.totalFeeVnd || 0,
                    totalVolumeVnd: market.treasury.totalVolumeVnd || 0,
                    totalTrades: market.treasury.totalTrades || 0,
                    activeListingsCount: market.listings.filter(l => l.status === 'active').length,
                    recentFees: (market.treasury.recentFees || []).slice(0, 15)
                },
                config: safeCfg,
                topups: topups.slice(0, 100)
            });
        }

        if (req.method === 'POST' && cleanUrl === '/api/admin/config') {
            try {
                const body = await readJsonBody(req);
                const oldPin = String(body.oldAdminPin || '').trim();
                const newPin = String(body.newAdminPin || '').trim();
                const confirmPin = String(body.confirmNewAdminPin || '').trim();

                if (oldPin || newPin || confirmPin) {
                    const actualPin = String(cfg.adminPin || '123456');
                    if (!oldPin || !timingSafeStrEqual(oldPin, actualPin)) {
                        return sendJson(res, 400, { ok: false, error: 'Mã PIN cũ không chính xác! Bắt buộc nhập đúng mã PIN hiện tại để đổi PIN mới.' });
                    }
                    if (!newPin || newPin.length < 4) {
                        return sendJson(res, 400, { ok: false, error: 'Mã PIN mới phải có ít nhất 4 ký tự!' });
                    }
                    if (newPin !== confirmPin) {
                        return sendJson(res, 400, { ok: false, error: 'Xác nhận mã PIN mới lần 2 không khớp!' });
                    }
                    cfg.adminPin = newPin;
                }

                if (typeof body.publicBaseUrl === 'string') {
                    cfg.publicBaseUrl = body.publicBaseUrl.trim();
                }
                delete cfg.vietqrClientId;
                delete cfg.vietqrApiKey;
                if (body.momo) {
                    cfg.momo = {
                        phone: String(body.momo.phone || '').trim(),
                        name: String(body.momo.name || '').trim(),
                        qrDataUrl: typeof body.momo.qrDataUrl === 'string' ? body.momo.qrDataUrl : (cfg.momo?.qrDataUrl || ''),
                        gatewayEnabled: !!body.momo.gatewayEnabled,
                        partnerCode: String(body.momo.partnerCode || '').trim(),
                        accessKey: String(body.momo.accessKey || '').trim(),
                        secretKey: String(body.momo.secretKey || '').trim(),
                        sandbox: body.momo.sandbox !== false
                    };
                }
                if (body.zalopay) {
                    cfg.zalopay = {
                        phone: String(body.zalopay.phone || '').trim(),
                        name: String(body.zalopay.name || '').trim(),
                        qrDataUrl: typeof body.zalopay.qrDataUrl === 'string' ? body.zalopay.qrDataUrl : (cfg.zalopay?.qrDataUrl || ''),
                        gatewayEnabled: !!body.zalopay.gatewayEnabled,
                        appId: String(body.zalopay.appId || '').trim(),
                        key1: String(body.zalopay.key1 || '').trim(),
                        key2: String(body.zalopay.key2 || '').trim(),
                        sandbox: body.zalopay.sandbox !== false
                    };
                }
                if (body.bank) {
                    cfg.bank = {
                        bankName: String(body.bank.bankName || '').trim(),
                        phone: String(body.bank.phone || '').trim(),
                        name: String(body.bank.name || '').trim(),
                        qrDataUrl: typeof body.bank.qrDataUrl === 'string' ? body.bank.qrDataUrl : (cfg.bank?.qrDataUrl || '')
                    };
                }
                writePaymentConfig(cfg);
                return sendJson(res, 200, { ok: true });
            } catch (err) {
                return sendJson(res, 400, { ok: false, error: err.message });
            }
        }

        if (req.method === 'POST' && cleanUrl === '/api/admin/topup/approve') {
            try {
                const body = await readJsonBody(req);
                const topups = readTopups();
                const order = topups.find(o => o.id === body.orderId);
                if (!order) return sendJson(res, 404, { ok: false, error: 'Không tìm thấy đơn' });
                if (order.status === 'rejected') return sendJson(res, 400, { ok: false, error: 'Đơn đã bị từ chối trước đó' });
                order.status = 'approved';
                order.updatedAt = Date.now();
                writeTopups(topups);
                return sendJson(res, 200, { ok: true, order });
            } catch (err) {
                return sendJson(res, 400, { ok: false, error: err.message });
            }
        }

        if (req.method === 'POST' && cleanUrl === '/api/admin/topup/reject') {
            try {
                const body = await readJsonBody(req);
                const topups = readTopups();
                const order = topups.find(o => o.id === body.orderId);
                if (!order) return sendJson(res, 404, { ok: false, error: 'Không tìm thấy đơn' });
                if (order.claimed) return sendJson(res, 400, { ok: false, error: 'Đơn đã cộng quà, không thể từ chối' });
                order.status = 'rejected';
                order.rejectReason = String(body.reason || 'Chưa nhận được tiền khớp nội dung').slice(0, 120);
                order.updatedAt = Date.now();
                writeTopups(topups);
                return sendJson(res, 200, { ok: true, order });
            } catch (err) {
                return sendJson(res, 400, { ok: false, error: err.message });
            }
        }
    }

    return sendJson(res, 404, { ok: false, error: 'API route not found' });
}

const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let cleanUrl = urlObj.pathname;

    if (cleanUrl.startsWith('/api/')) {
        handleApi(req, res, cleanUrl, urlObj);
        return;
    }

    if (cleanUrl === '/' || cleanUrl === '') {
        cleanUrl = '/index.html';
    }

    const resolvedDir = path.resolve(DIR);
    let filePath = path.resolve(resolvedDir, cleanUrl.replace(/^\/+/, ''));
    const rel = path.relative(resolvedDir, filePath);
    if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(resolvedDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error: ' + err.code);
            return;
        }
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
    });
});

ensureDataFiles();
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Game server is listening on port ${PORT}`);
});
