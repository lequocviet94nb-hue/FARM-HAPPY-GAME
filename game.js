/**
 * Lucky Farm & Fishing Game Logic
 * Quản lý trạng thái Nông trại, Hồ câu, Chợ, Vòng quay và Tích điểm rút thưởng
 */

// 3 Nhóm Hạt Giống & Giới Hạn Mua (Mua hết đặt lại toàn bộ hạt giống bằng 200 Kim Cương)
const SEED_RESET_DIAMONDS = 200;
const RESOURCE_RESET_DIAMONDS = 200;

// Giá sàn cố định 15 loại nông sản, 4 loại tài nguyên & Trứng Gà trên Chợ P2P và biên độ tối đa +3%
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
    // 4 loại tài nguyên đảo (Gỗ: 200đ, Đá: 500đ, Sắt: 1.000đ, Vàng: 2.000đ)
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

const SEED_TIER_META = {
    normal: {
        id: 'normal',
        label: 'Hạt Giống Thường',
        shortLabel: 'Thường',
        icon: '🌿',
        maxStock: 100,
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-500'
    },
    medium: {
        id: 'medium',
        label: 'Hạt Giống Trung Bình',
        shortLabel: 'Trung Bình',
        icon: '💠',
        maxStock: 30,
        badgeClass: 'bg-sky-100 text-sky-900 border-sky-500'
    },
    premium: {
        id: 'premium',
        label: 'Hạt Giống Cao Cấp',
        shortLabel: 'Cao Cấp',
        icon: '👑',
        maxStock: 10,
        badgeClass: 'bg-amber-100 text-amber-950 border-amber-500'
    }
};

// Định nghĩa 15 Loại Hạt Giống từ Nhỏ đến To (5 Thường Max 100, 5 Trung Bình Max 30, 5 Cao Cấp Max 10)
// EXP 15 loại nông sản xếp theo thứ tự từ ít đến nhiều vàng: 1 -> 15 EXP khi thu hoạch và sử dụng
const SEED_TYPES = {
    rau_mam: {
        order: 1, id: 'rau_mam', tier: 'normal', name: 'Rau Mầm', icon: '🌱',
        seedCost: 1, sellGold: 1.1, cropBuyGold: 2, sellVnd: 10, p2pFloorPrice: 10,
        growTime: 300, growTimeLabel: '5 phút', exp: 1, diamonds: 0, color: '#4ade80',
        desc: 'Mầm rau xanh non mềm, dễ trồng và nảy mầm nhanh trên mọi ô đất.'
    },
    anh_dao: {
        order: 2, id: 'anh_dao', tier: 'normal', name: 'Anh Đào', icon: '🍒',
        seedCost: 1.5, sellGold: 1.7, cropBuyGold: 3, sellVnd: 15, p2pFloorPrice: 15,
        growTime: 600, growTimeLabel: '10 phút', exp: 2, diamonds: 0, color: '#f43f5e',
        desc: 'Trái anh đào đỏ mọng căng bóng, vị ngọt thanh tự nhiên.'
    },
    dau_tay: {
        order: 3, id: 'dau_tay', tier: 'normal', name: 'Dâu Tây', icon: '🍓',
        seedCost: 2, sellGold: 2.5, cropBuyGold: 4, sellVnd: 20, p2pFloorPrice: 20,
        growTime: 1800, growTimeLabel: '30 phút', exp: 3, diamonds: 0, color: '#fb7185',
        desc: 'Quả dâu tây thơm lừng mùi vườn sớm, được rất nhiều nông dân ưa chuộng.'
    },
    nam_linh_chi: {
        order: 4, id: 'nam_linh_chi', tier: 'normal', name: 'Nấm Linh Chi', icon: '🍄',
        seedCost: 2.5, sellGold: 3.2, cropBuyGold: 5, sellVnd: 25, p2pFloorPrice: 25,
        growTime: 3600, growTimeLabel: '1h', exp: 4, diamonds: 0, color: '#ef4444',
        desc: 'Nấm rừng quý tán đỏ chấm trắng, mọc khỏe trên nền đất ẩm.'
    },
    khoai_tay: {
        order: 5, id: 'khoai_tay', tier: 'normal', name: 'Khoai Tây', icon: '🥔',
        seedCost: 3, sellGold: 6, cropBuyGold: 8, sellVnd: 30, p2pFloorPrice: 30,
        growTime: 7200, growTimeLabel: '2h', exp: 5, diamonds: 0, color: '#d97706',
        desc: 'Củ khoai tây chắc nịch giàu dinh dưỡng, bội thu từng mùa vụ.'
    },
    carrot: {
        order: 6, id: 'carrot', tier: 'medium', name: 'Cà Rốt', icon: '🥕',
        seedCost: 7, sellGold: 10, cropBuyGold: 15, sellVnd: 70, p2pFloorPrice: 70,
        growTime: 14400, growTimeLabel: '4h', exp: 6, diamonds: 0, color: '#f97316',
        desc: 'Củ cà rốt cam rực giòn ngọt, lá xanh rậm rạp phủ kín luống đất.',
        maxStock: 50
    },
    tomato: {
        order: 7, id: 'tomato', tier: 'medium', name: 'Cà Chua', icon: '🍅',
        seedCost: 10, sellGold: 12, cropBuyGold: 22, sellVnd: 100, p2pFloorPrice: 100,
        growTime: 28800, growTimeLabel: '8h', exp: 7, diamonds: 0, color: '#dc2626',
        desc: 'Trái cà chua chín đỏ tròn đều, sai trĩu quả trên từng giàn leo.',
        maxStock: 50
    },
    rice: {
        order: 8, id: 'rice', tier: 'medium', name: 'Lúa Nước', icon: '🌾',
        seedCost: 12, sellGold: 14, cropBuyGold: 25, sellVnd: 120, p2pFloorPrice: 120,
        growTime: 36000, growTimeLabel: '10h', exp: 8, diamonds: 0, color: '#eab308',
        desc: 'Bông lúa vàng trĩu hạt, biểu tượng no ấm của trang trại truyền thống.',
        maxStock: 50
    },
    bap_ngo: {
        order: 9, id: 'bap_ngo', tier: 'medium', name: 'Bắp Ngô', icon: '🌽',
        seedCost: 15, sellGold: 17, cropBuyGold: 28, sellVnd: 150, p2pFloorPrice: 150,
        growTime: 43200, growTimeLabel: '12h', exp: 9, diamonds: 0, color: '#facc15',
        desc: 'Bắp ngô nếp vàng óng đều hạt, chắc bắp từ gốc đến ngọn.',
        maxStock: 30
    },
    sunflower: {
        order: 10, id: 'sunflower', tier: 'medium', name: 'Hướng Dương', icon: '🌻',
        seedCost: 18, sellGold: 20, cropBuyGold: 30, sellVnd: 180, p2pFloorPrice: 180,
        growTime: 50400, growTimeLabel: '14h', exp: 10, diamonds: 0, color: '#f59e0b',
        desc: 'Đóa hoa hướng dương rực rỡ luôn hướng về phía mặt trời.',
        maxStock: 30
    },
    dua_mat: {
        order: 11, id: 'dua_mat', tier: 'premium', name: 'Dứa Mật', icon: '🍍',
        seedCost: 20, sellGold: 22, cropBuyGold: 33, sellVnd: 200, p2pFloorPrice: 200,
        growTime: 57600, growTimeLabel: '16h', exp: 11, diamonds: 0, color: '#ca8a04',
        desc: 'Trái dứa mật vỏ vàng ươm thơm ngát hương nắng miền nhiệt đới.'
    },
    nho_tim: {
        order: 12, id: 'nho_tim', tier: 'premium', name: 'Nho Tím', icon: '🍇',
        seedCost: 22, sellGold: 24, cropBuyGold: 37, sellVnd: 220, p2pFloorPrice: 220,
        growTime: 64800, growTimeLabel: '18h', exp: 12, diamonds: 0, color: '#9333ea',
        desc: 'Chùm nho tím căng mọng phủ lớp phấn mịn tự nhiên quý giá.'
    },
    watermelon: {
        order: 13, id: 'watermelon', tier: 'premium', name: 'Dưa Hấu', icon: '🍉',
        seedCost: 25, sellGold: 27, cropBuyGold: 40, sellVnd: 250, p2pFloorPrice: 250,
        growTime: 72000, growTimeLabel: '20h', exp: 13, diamonds: 0, color: '#22c55e',
        desc: 'Quả dưa hấu sọc xanh ruột đỏ mọng nước, giải nhiệt cực đã.'
    },
    bi_ngo: {
        order: 14, id: 'bi_ngo', tier: 'premium', name: 'Bí Ngô', icon: '🎃',
        seedCost: 27, sellGold: 29, cropBuyGold: 42, sellVnd: 270, p2pFloorPrice: 270,
        growTime: 79200, growTimeLabel: '22h', exp: 14, diamonds: 0, color: '#ea580c',
        desc: 'Quả bí ngô khổng lồ vỏ cam óng, đặc sản mùa thu hoạch lớn.'
    },
    lucky_tree: {
        order: 15, id: 'lucky_tree', tier: 'premium', name: 'Hoa Thần Tài', icon: '🌸',
        seedCost: 30, sellGold: 32, cropBuyGold: 45, sellVnd: 300, p2pFloorPrice: 300,
        growTime: 86400, growTimeLabel: '24h', exp: 15, diamonds: 0, color: '#ec4899',
        desc: 'Loài hoa linh thiêng rực hồng phát sáng, mang lại tài lộc viên mãn.'
    }
};

// ==========================================
// ĐỊNH NGHĨA CÁC LOẠI CÁ SUNFLOWER LAND THEO 3 CẤP ĐỘ MỒI CÂU
// - Cần câu: 3 Gỗ + 1 Đá + 20 Vàng
// - 1 Ngày tối đa 20 lượt câu, 100% trúng cá
// - Cá Thường: 1 Cần + 5 Nông sản thường (random 1 loại/ngày) -> Ngẫu nhiên 1 trong 3 loại Cá Thường
// - Cá Trung Bình: 1 Cần + 5 Nông sản trung bình (random 1 loại/ngày) -> Ngẫu nhiên 1 trong 3 loại Cá Trung Bình
// - Cá Cao Cấp: 1 Cần + 5 Nông sản cao cấp (random 1 loại/ngày) -> Ngẫu nhiên 1 trong 3 loại Cá Cao Cấp
// - Ăn cá trực tiếp hoặc kết hợp nấu ăn để tăng EXP tài khoản
// ==========================================
const VIP_ROD_PRICE_GOLD = 2500;
const FISH_TYPES = [
    // TIER 1: Mồi Câu Thường -> Câu Cá Rô Đồng (100%) - Sử dụng: +30 EXP hoặc giao Long Nữ nhận Vàng
    { id: 'fish_ro', name: 'Cá Rô Đồng', icon: '🐟', tier: 'normal', weight: 100, sellVnd: 0, exp: 30, diamonds: 0, rarity: 'Cá Thường', isBigFish: false, desc: 'Cá rô đồng tươi ngon thịt ngọt bùi, dùng tăng +30 EXP hoặc giao nộp Long Nữ nhận Vàng.' },
    { id: 'fish_diec', name: 'Cá Diếc Bạc', icon: '🐟', tier: 'normal', weight: 0, sellVnd: 0, exp: 30, diamonds: 0, rarity: 'Cá Thường', isBigFish: false, desc: 'Cá diếc vảy bạc óng ánh giàu dinh dưỡng, dùng tăng +30 EXP hoặc giao nộp Long Nữ.' },
    { id: 'fish_bong', name: 'Cá Bống Biển', icon: '🐡', tier: 'normal', weight: 0, sellVnd: 0, exp: 30, diamonds: 0, rarity: 'Cá Thường', isBigFish: false, desc: 'Cá bống nhỏ nhắn săn chắc, dùng tăng +30 EXP hoặc giao nộp Long Nữ.' },

    // TIER 2: Mồi Câu Trung Bình -> Câu Cá Chép Vàng (100%) - Sử dụng: +60 EXP hoặc giao Long Nữ nhận Vàng
    { id: 'fish_chep', name: 'Cá Chép Vàng', icon: '🐠', tier: 'medium', weight: 100, sellVnd: 0, exp: 60, diamonds: 0, rarity: 'Cá Trung Cấp', isBigFish: false, desc: 'Cá chép vảy vàng biểu tượng tài lộc ấm no, dùng tăng +60 EXP hoặc giao nộp Long Nữ nhận Vàng.' },
    { id: 'fish_loc', name: 'Cá Quả Đen', icon: '🐟', tier: 'medium', weight: 0, sellVnd: 0, exp: 60, diamonds: 0, rarity: 'Cá Trung Cấp', isBigFish: false, desc: 'Cá quả đồng chắc thịt đậm đà, dùng tăng +60 EXP hoặc giao nộp Long Nữ.' },
    { id: 'fish_tram', name: 'Cá Trắm Cỏ', icon: '🐡', tier: 'medium', weight: 0, sellVnd: 0, exp: 60, diamonds: 0, rarity: 'Cá Trung Cấp', isBigFish: false, desc: 'Cá trắm cỏ to khỏe quẫy sóng, dùng tăng +60 EXP hoặc giao nộp Long Nữ.' },

    // TIER 3: Mồi Câu Cao Cấp -> Câu Cá Hồi (100%) - Sử dụng: +90 EXP hoặc giao Long Nữ nhận Vàng
    { id: 'fish_hoi', name: 'Cá Hồi', icon: '🍣', tier: 'high', weight: 100, sellVnd: 0, exp: 90, diamonds: 0, rarity: '👑 Cá Cao Cấp', isBigFish: true, desc: 'Cá hồi vân mỡ hồng béo ngậy thượng hạng, dùng tăng +90 EXP hoặc giao nộp Long Nữ nhận Vàng.' },
    { id: 'fish_lang', name: 'Cá Lăng Suối', icon: '🐟', tier: 'high', weight: 0, sellVnd: 0, exp: 90, diamonds: 0, rarity: '👑 Cá Cao Cấp', isBigFish: true, desc: 'Cá lăng suối nước xiết thịt dai ngọt, dùng tăng +90 EXP hoặc giao nộp Long Nữ.' },
    { id: 'fish_tam', name: 'Cá Hải Tượng Khổng Lồ', icon: '🐳', tier: 'high', weight: 0, sellVnd: 0, exp: 90, diamonds: 0, rarity: '👑 Cá Thần Thoại', isBigFish: true, desc: 'Thần ngư khổng lồ dưới hồ sâu, dùng tăng +90 EXP hoặc giao nộp Long Nữ.' },
    { id: 'chest', name: 'Rương Kho Báu', icon: '📦', tier: 'high', weight: 0, sellVnd: 0, exp: 120, diamonds: 6, rarity: '👑 Kho Báu VIP', isBigFish: true, desc: 'Rương báu cổ tích chứa đầy châu báu ngọc ngà.' }
];

// Định nghĩa 3 Cấp Độ Mồi Câu Nông Sản
const BAIT_TYPES = {
    bait_normal: { id: 'bait_normal', tier: 'normal', name: 'Mồi Câu Thường', icon: '🐟', targetFish: 'fish_ro', targetFishName: 'Cá Rô Đồng' },
    bait_medium: { id: 'bait_medium', tier: 'medium', name: 'Mồi Câu Trung Bình', icon: '🐠', targetFish: 'fish_chep', targetFishName: 'Cá Chép Vàng' },
    bait_high: { id: 'bait_high', tier: 'high', name: 'Mồi Câu Cao Cấp', icon: '👑', targetFish: 'fish_hoi', targetFishName: 'Cá Hồi' }
};

// Công thức Nấu Ăn Kết Hợp Cá + Nông Sản (Tăng EXP Tài Khoản Siêu Tốc)
const FISH_COOKING_RECIPES = [
    {
        id: 'fcook_ro',
        name: 'Chả Cá Rô Chiên Giòn',
        icon: '🍲',
        minLevel: 1,
        exp: 250,
        desc: 'Món chả cá rô rán giòn ruộm béo ngậy, bồi bổ năng lượng đầu bếp.',
        ingredients: [
            { id: 'fish_ro', name: 'Cá Rô Đồng', icon: '🐟', qty: 1 },
            { id: 'rau_mam', name: 'Rau Mầm', icon: '🌱', qty: 2 }
        ]
    },
    {
        id: 'fcook_diec',
        name: 'Canh Cá Diếc Nấu Ngọt',
        icon: '🥣',
        minLevel: 1,
        exp: 280,
        desc: 'Bát canh ngọt mát giải nhiệt trưa hè từ cá diếc và quả anh đào.',
        ingredients: [
            { id: 'fish_diec', name: 'Cá Diếc Bạc', icon: '🐟', qty: 1 },
            { id: 'anh_dao', name: 'Anh Đào', icon: '🍒', qty: 2 }
        ]
    },
    {
        id: 'fcook_chep',
        name: 'Cá Chép Om Cà Chua',
        icon: '🥘',
        minLevel: 3,
        exp: 650,
        desc: 'Cá chép vàng om cà chua mọng nước, vị chua ngọt thấm từng thớ cá.',
        ingredients: [
            { id: 'fish_chep', name: 'Cá Chép Vàng', icon: '🐠', qty: 1 },
            { id: 'tomato', name: 'Cà Chua', icon: '🍅', qty: 2 },
            { id: 'carrot', name: 'Cà Rốt', icon: '🥕', qty: 1 }
        ]
    },
    {
        id: 'fcook_loc',
        name: 'Cá Quả Kho Tộ Đậm Đà',
        icon: '🍲',
        minLevel: 4,
        exp: 950,
        desc: 'Nồi cá quả kho tộ cay cay thơm nồng ăn cùng cơm gạo nếp lúa mới.',
        ingredients: [
            { id: 'fish_loc', name: 'Cá Quả Đen', icon: '🐟', qty: 1 },
            { id: 'rice', name: 'Lúa Nước', icon: '🌾', qty: 2 },
            { id: 'bap_ngo', name: 'Bắp Ngô', icon: '🌽', qty: 1 }
        ]
    },
    {
        id: 'fcook_lang',
        name: 'Chả Cá Lăng Nướng Vàng',
        icon: '🍱',
        minLevel: 5,
        exp: 1800,
        desc: 'Đặc sản cá lăng nướng than hoa thơm lừng trên chảo dầu nóng.',
        ingredients: [
            { id: 'fish_lang', name: 'Cá Lăng Suối', icon: '🐟', qty: 1 },
            { id: 'sunflower', name: 'Hướng Dương', icon: '🌻', qty: 2 }
        ]
    },
    {
        id: 'fcook_hoi',
        name: 'Sashimi Cá Hồi Sốt Nho',
        icon: '🍣',
        minLevel: 7,
        exp: 2600,
        desc: 'Sashimi cá hồi đại dương thượng hạng chấm sốt nho tím quyến rũ.',
        ingredients: [
            { id: 'fish_hoi', name: 'Cá Hồi Đại Dương', icon: '🍣', qty: 1 },
            { id: 'nho_tim', name: 'Nho Tím', icon: '🍇', qty: 2 }
        ]
    },
    {
        id: 'fcook_tam',
        name: 'Đại Tiệc Cá Hải Tượng Hoàng Gia',
        icon: '👑',
        minLevel: 8,
        exp: 4200,
        desc: 'Món ăn tối thượng của vương quốc nông trại, mang lại lượng EXP thăng cấp khổng lồ!',
        ingredients: [
            { id: 'fish_tam', name: 'Cá Hải Tượng Khổng Lồ', icon: '🐳', qty: 1 },
            { id: 'dua_mat', name: 'Dứa Mật', icon: '🍍', qty: 2 },
            { id: 'watermelon', name: 'Dưa Hấu', icon: '🍉', qty: 1 }
        ]
    }
];

// ==========================================
// ĐỊNH NGHĨA TRẠI GÀ 5 CẤP (QUY CHUẨN MỚI)
// - Lv 1 đến Lv 10: Trại Cấp 1 (Max 10 gà, có sẵn ban đầu)
// - Lv 11 đến Lv 20: Mua được Trại Cấp 2 (+10 gà, Max 20 con)
// - Lv 21 đến Lv 30: Mua được Trại Cấp 3 (+10 gà, Max 30 con)
// - Lv 31 đến Lv 40: Mua được Trại Cấp 4 (+10 gà, Max 40 con)
// - Lv 41 đến Lv 50: Mua được Trại Cấp 5 (+10 gà, Max 50 con)
// - Giá mỗi con gà là 100 vàng
// - Cho gà ăn 2 lúa -> 24h sau đẻ trứng
// - Trứng gà CHỈ bán được bằng VND (không bán bằng Vàng)
// ==========================================
const COOP_TIERS = {
    1: { tier: 1, name: 'Trại Gà Cấp 1', minLevel: 1, maxLevel: 10, maxChickens: 10, wood: 0, iron: 0, gold_ore: 0, diamonds: 0, priceGold: 0, icon: '🛖', label: 'Cấp 1 (Lv 1-10)' },
    2: { tier: 2, name: 'Trại Gà Cấp 2', minLevel: 11, maxLevel: 20, maxChickens: 20, wood: 100, iron: 50, gold_ore: 20, diamonds: 200, priceGold: 200, icon: '🏡', label: 'Cấp 2 (Lv 11-20)' },
    3: { tier: 3, name: 'Trại Gà Cấp 3', minLevel: 21, maxLevel: 30, maxChickens: 30, wood: 150, iron: 100, gold_ore: 30, diamonds: 400, priceGold: 400, icon: '🏰', label: 'Cấp 3 (Lv 21-30)' },
    4: { tier: 4, name: 'Trại Gà Cấp 4', minLevel: 31, maxLevel: 40, maxChickens: 40, wood: 200, iron: 150, gold_ore: 40, diamonds: 600, priceGold: 600, icon: '🏭', label: 'Cấp 4 (Lv 31-40)' },
    5: { tier: 5, name: 'Trại Gà Cấp 5', minLevel: 41, maxLevel: 50, maxChickens: 50, wood: 300, iron: 200, gold_ore: 50, diamonds: 1000, priceGold: 1000, icon: '👑', label: 'Cấp 5 (Lv 41-50)' }
};

const CHICKEN_PRICE_GOLD = 100; // Giá mỗi con gà là 100 vàng
const CHICKEN_FEED_RICE_QTY = 2; // Cho gà ăn 2 lúa
const CHICKEN_LAY_TIME_MS = 24 * 3600 * 1000; // Gà 24h sẽ đẻ trứng (24 giờ)
const EGG_SELL_VND = 50; // Trứng gà chỉ bán được bằng VND (50đ / quả)

// Định nghĩa Giống Gà & Các Loại Trứng (Mua Gà bằng Vàng, Bán Gà & Trứng thu VND!)
const CHICKEN_TYPES = {
    ri: { id: 'ri', name: 'Gà Đẻ Trứng', icon: '🐔', cost: 100, sellVnd: 80, layTime: 86400, eggId: 'egg_normal', bodyColor: '#fef08a', wingColor: '#ca8a04', desc: 'Đẻ Trứng Gà (300 VND)' },
    dong_tao: { id: 'dong_tao', name: 'Gà Đông Tảo', icon: '🐓', cost: 350, sellVnd: 280, layTime: 22, eggId: 'egg_big', bodyColor: '#fed7aa', wingColor: '#c2410c', desc: 'Đẻ Trứng Lớn (95 VND)' },
    gold_hen: { id: 'gold_hen', name: 'Thần Kê Vàng', icon: '🦚', cost: 900, sellVnd: 720, layTime: 26, eggId: 'egg_gold', bodyColor: '#facc15', wingColor: '#eab308', desc: 'Trứng Vàng (240 VND +1💎)' },
    phoenix: { id: 'phoenix', name: 'Phượng Hoàng VIP', icon: '🔥', cost: 2200, sellVnd: 1750, layTime: 18, eggId: 'egg_diamond', bodyColor: '#fb7185', wingColor: '#f59e0b', desc: 'Trứng KC (520 VND +2💎)' }
};

const EGG_TYPES = {
    egg_normal: { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', sellVnd: 300, p2pFloorPrice: 300, exp: 6, diamonds: 0, color: '#fef3c7' },
    egg_big: { id: 'egg_big', name: 'Trứng Gà Lớn', icon: '🥚', sellVnd: 95, exp: 14, diamonds: 0, color: '#fde68a' },
    egg_gold: { id: 'egg_gold', name: 'Trứng Vàng', icon: '🌟', sellVnd: 240, exp: 35, diamonds: 1, color: '#facc15' },
    egg_diamond: { id: 'egg_diamond', name: 'Trứng Kim Cương', icon: '💎', sellVnd: 520, exp: 80, diamonds: 2, color: '#38bdf8' }
};

// Icon thỏi vàng SVG chuẩn HTML/CSS (tránh lỗi ô vuông font trên Windows)
const GOLD_ICON = '<span class="gold-bar-icon" aria-label="Vàng"></span>';

// ==========================================
// CÔNG THỨC BẾP NẤU BÁNH (15 CÔNG THỨC TỪ 15 LOẠI NÔNG SẢN TỰ TRỒNG + 2 TRỨNG GÀ)
// ==========================================
// BẾP BÁNH NÔNG TRẠI (15 LOẠI BÁNH TỪ 15 LOẠI NÔNG SẢN + 2 QUẢ TRỨNG)
// NẤU BÁNH MỖI LOẠI CẦN 1 NÔNG SẢN + 2 TRỨNG GÀ: EXP = EXP CŨ (1->15) + 60 EXP TRỨNG = 61 -> 75 EXP
// ==========================================
const BAKERY_RECIPES = [
    {
        id: 'cake_rau_mam',
        name: 'Bánh Mầm Thanh Mát',
        icon: '🥗',
        minLevel: 1,
        exp: 61,
        cookTimeSec: 600,
        cookTimeLabel: '10 phút',
        tier: 'tier1',
        desc: 'Món bánh mầm xanh kết hợp 2 quả trứng thơm ngon bổ dưỡng, vị thanh mát khởi nguồn cho mọi đầu bếp tập sự.',
        ingredients: [
            { id: 'rau_mam', name: 'Rau Mầm', icon: '🌱', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_anh_dao',
        name: 'Bánh Tart Anh Đào',
        icon: '🍒',
        minLevel: 1,
        exp: 62,
        cookTimeSec: 1200,
        cookTimeLabel: '20 phút',
        tier: 'tier1',
        desc: 'Bánh tart nướng giòn rụm từ 2 quả trứng vàng óng phủ mứt anh đào đỏ mọng ngọt thanh đầu mùa.',
        ingredients: [
            { id: 'anh_dao', name: 'Anh Đào', icon: '🍒', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_dau_tay',
        name: 'Bánh Mousse Dâu Tây',
        icon: '🍓',
        minLevel: 1,
        exp: 63,
        cookTimeSec: 1800,
        cookTimeLabel: '30 phút',
        tier: 'tier1',
        desc: 'Lớp kem dâu tây hòa cùng lòng trắng 2 quả trứng béo ngậy mềm mịn xếp tầng trên cốt bánh bông lan xốp mềm.',
        ingredients: [
            { id: 'dau_tay', name: 'Dâu Tây', icon: '🍓', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_nam_linh_chi',
        name: 'Bánh Nấm Nướng Phô Mai',
        icon: '🍄',
        minLevel: 1,
        exp: 64,
        cookTimeSec: 3000,
        cookTimeLabel: '50 phút',
        tier: 'tier1',
        desc: 'Món bánh nướng đút lò nóng hổi với 2 quả trứng tươi, nấm rừng bổ dưỡng và phô mai thơm ngậy.',
        ingredients: [
            { id: 'nam_linh_chi', name: 'Nấm Linh Chi', icon: '🍄', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_khoai_tay',
        name: 'Bánh Khoai Tây Phô Mai',
        icon: '🥔',
        minLevel: 1,
        exp: 65,
        cookTimeSec: 4800,
        cookTimeLabel: '80 phút',
        tier: 'tier1',
        desc: 'Khoai tây nghiền mịn quyện cùng 2 quả trứng gà đút lò nướng vàng ruộm, bùi béo kích thích vị giác.',
        ingredients: [
            { id: 'khoai_tay', name: 'Khoai Tây', icon: '🥔', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_carrot',
        name: 'Bánh Cà Rốt Hạnh Nhân Quế',
        icon: '🥕',
        minLevel: 1,
        exp: 66,
        cookTimeSec: 7200,
        cookTimeLabel: '2 giờ',
        tier: 'tier1',
        desc: 'Bánh cà rốt đánh nhuyễn cùng 2 quả trứng gà nướng xốp ẩm thoang thoảng hương quế ấm áp.',
        ingredients: [
            { id: 'carrot', name: 'Cà Rốt', icon: '🥕', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_tomato',
        name: 'Bánh Pizza Cà Chua Thảo Mộc',
        icon: '🍅',
        minLevel: 1,
        exp: 67,
        cookTimeSec: 9000,
        cookTimeLabel: '2.5 giờ',
        tier: 'tier2',
        desc: 'Đế bánh nhào từ bột và 2 quả trứng gà nướng thơm lừng với sốt cà chua tươi mọng vườn nhà.',
        ingredients: [
            { id: 'tomato', name: 'Cà Chua', icon: '🍅', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_rice',
        name: 'Bánh Bông Lan Gạo Nếp Sữa',
        icon: '🌾',
        minLevel: 1,
        exp: 68,
        cookTimeSec: 12000,
        cookTimeLabel: '3 giờ 20p',
        tier: 'tier2',
        desc: 'Món bánh bông lan cốt lúa nước đánh bông cùng 2 quả trứng gà thơm dẻo xốp mịn như mây.',
        ingredients: [
            { id: 'rice', name: 'Lúa Nước', icon: '🌾', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_bap_ngo',
        name: 'Bánh Ngô Nướng Bơ Mật',
        icon: '🌽',
        minLevel: 1,
        exp: 69,
        cookTimeSec: 15000,
        cookTimeLabel: '4 giờ 10p',
        tier: 'tier2',
        desc: 'Bắp ngô nếp vàng ươm xay nhuyễn hòa quyện bơ mật và 2 quả trứng gà ngọt bùi khó quên.',
        ingredients: [
            { id: 'bap_ngo', name: 'Bắp Ngô', icon: '🌽', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_sunflower',
        name: 'Bánh Quy Hướng Dương Giòn',
        icon: '🌻',
        minLevel: 1,
        exp: 70,
        cookTimeSec: 18000,
        cookTimeLabel: '5 giờ',
        tier: 'tier2',
        desc: 'Bánh quy bơ trứng giòn tan từ 2 quả trứng gà tươi rắc hạt hướng dương bùi ngậy đón ánh mặt trời.',
        ingredients: [
            { id: 'sunflower', name: 'Hướng Dương', icon: '🌻', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_dua_mat',
        name: 'Bánh Dứa Nướng Hoàng Gia',
        icon: '🍍',
        minLevel: 1,
        exp: 71,
        cookTimeSec: 24000,
        cookTimeLabel: '6 giờ 40p',
        tier: 'tier2',
        desc: 'Món bánh dứa caramen đượm vị 2 quả trứng gà thơm ngát mật vàng óng ả chuẩn phong vị cung đình.',
        ingredients: [
            { id: 'dua_mat', name: 'Dứa Mật', icon: '🍍', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_nho_tim',
        name: 'Bánh Tart Nho Tím Men Rượu',
        icon: '🍇',
        minLevel: 1,
        exp: 72,
        cookTimeSec: 30000,
        cookTimeLabel: '8 giờ 20p',
        tier: 'tier3',
        desc: 'Bánh tart đế trứng kem nướng từ 2 quả trứng gà cùng nho tím quý phái căng mọng men rượu vang.',
        ingredients: [
            { id: 'nho_tim', name: 'Nho Tím', icon: '🍇', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_watermelon',
        name: 'Bánh Thạch Dưa Hấu Mát Lạnh',
        icon: '🍉',
        minLevel: 1,
        exp: 73,
        cookTimeSec: 36000,
        cookTimeLabel: '10 giờ',
        tier: 'tier3',
        desc: 'Bánh thạch dưa hấu nhiều tầng cốt bánh trứng tươi trong veo mát rượi xua tan mọi mệt mỏi ngày hè.',
        ingredients: [
            { id: 'watermelon', name: 'Dưa Hấu', icon: '🍉', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_bi_ngo',
        name: 'Bánh Pie Bí Ngô Mùa Lễ Hội',
        icon: '🎃',
        minLevel: 1,
        exp: 74,
        cookTimeSec: 54000,
        cookTimeLabel: '15 giờ',
        tier: 'tier3',
        desc: 'Chiếc bánh pie bí ngô thơm nức hòa quyện nhân sữa trứng mịn mượt từ 2 quả trứng gà vườn nhà.',
        ingredients: [
            { id: 'bi_ngo', name: 'Bí Ngô', icon: '🎃', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    },
    {
        id: 'cake_lucky',
        name: 'Bánh Thần Tài Đại Phú Quý',
        icon: '🌸',
        minLevel: 1,
        exp: 75,
        cookTimeSec: 72000,
        cookTimeLabel: '20 giờ',
        tier: 'tier3',
        desc: 'Tuyệt phẩm bánh thần thoại kết tinh từ Hoa Thần Tài và 2 quả trứng gà tươi, phát sáng hào quang phú quý!',
        ingredients: [
            { id: 'lucky_tree', name: 'Hoa Thần Tài', icon: '🌸', qty: 1 },
            { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 }
        ]
    }
];

// NHIỆM VỤ THƯƠNG GIA (GIAO NÔNG SẢN ĐỔI VÀNG MỖI NGÀY)
// - Đơn thường: 5 loại nông sản thường, mỗi loại 5 quả -> nhận 85 Vàng (Ai cũng trả được)
// - Đơn trung bình (VIP): 5 loại nông sản trung bình, mỗi loại 5 quả -> nhận 330 Vàng
// - Đơn cao cấp (VIP): 5 loại nông sản cao cấp, mỗi loại 5 quả -> nhận 650 Vàng
const MERCHANT_QUESTS_META = [
    {
        id: 'q_merchant_normal',
        title: 'Đơn Hàng Nông Sản Thường',
        subTitle: 'Nhiệm vụ thường ngày (Tất cả người chơi)',
        tier: 'normal',
        tierLabel: 'Thường',
        tierBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        isVipOnly: false,
        rewardGold: 85,
        requirements: [
            { id: 'rau_mam', qty: 5 },
            { id: 'anh_dao', qty: 5 },
            { id: 'dau_tay', qty: 5 },
            { id: 'nam_linh_chi', qty: 5 },
            { id: 'khoai_tay', qty: 5 }
        ]
    },
    {
        id: 'q_merchant_medium',
        title: 'Đơn Hàng Nông Sản Trung Bình',
        subTitle: 'Nhiệm vụ đặc quyền VIP',
        tier: 'medium',
        tierLabel: 'Trung Bình',
        tierBadgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        isVipOnly: true,
        rewardGold: 330,
        requirements: [
            { id: 'carrot', qty: 5 },
            { id: 'tomato', qty: 5 },
            { id: 'rice', qty: 5 },
            { id: 'bap_ngo', qty: 5 },
            { id: 'sunflower', qty: 5 }
        ]
    },
    {
        id: 'q_merchant_premium',
        title: 'Đơn Hàng Nông Sản Cao Cấp',
        subTitle: 'Nhiệm vụ đặc quyền VIP',
        tier: 'premium',
        tierLabel: 'Cao Cấp',
        tierBadgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        isVipOnly: true,
        rewardGold: 650,
        requirements: [
            { id: 'dua_mat', qty: 5 },
            { id: 'nho_tim', qty: 5 },
            { id: 'watermelon', qty: 5 },
            { id: 'bi_ngo', qty: 5 },
            { id: 'lucky_tree', qty: 5 }
        ]
    }
];

// NHIỆM VỤ ĐỒNG NÁT (GIAO TÀI NGUYÊN ĐẢO ĐỔI LẤY VÀNG - MỖI NGÀY 1 NHIỆM VỤ TỰ ĐỘNG XOAY VÒNG)
// 1. Trả 20 Gỗ nhận 420 Vàng
// 2. Trả 5 Đá nhận 430 Vàng
// 3. Trả 1 Sắt nhận 500 Vàng
// 4. Trả 1 Cục Vàng nhận 2500 Vàng
const SCRAP_QUESTS_META = [
    {
        id: 'scrap_wood_20',
        index: 0,
        dayLabel: 'Ngày 1',
        title: 'Nhiệm vụ 1: Giao Nộp 20 Gỗ',
        resourceId: 'wood',
        resourceName: 'Gỗ',
        resourceIcon: '🌳',
        qty: 20,
        rewardGold: 420,
        desc: 'Thu gom 20 khúc Gỗ từ Cây Rừng giao cho Đồng Nát'
    },
    {
        id: 'scrap_stone_5',
        index: 1,
        dayLabel: 'Ngày 2',
        title: 'Nhiệm vụ 2: Giao Nộp 5 Đá',
        resourceId: 'stone',
        resourceName: 'Đá',
        resourceIcon: '⛰️',
        qty: 5,
        rewardGold: 430,
        desc: 'Khai thác 5 tảng Đá từ Mỏ Đá giao cho Đồng Nát'
    },
    {
        id: 'scrap_iron_1',
        index: 2,
        dayLabel: 'Ngày 3',
        title: 'Nhiệm vụ 3: Giao Nộp 1 Sắt',
        resourceId: 'iron',
        resourceName: 'Cục Sắt',
        resourceIcon: '⚙️',
        qty: 1,
        rewardGold: 500,
        desc: 'Đào được 1 Cục Sắt nguyên chất giao cho Đồng Nát'
    },
    {
        id: 'scrap_gold_ore_1',
        index: 3,
        dayLabel: 'Ngày 4',
        title: 'Nhiệm vụ 4: Giao Nộp 1 Cục Vàng',
        resourceId: 'gold_ore',
        resourceName: 'Cục Vàng',
        resourceIcon: '✨',
        qty: 1,
        rewardGold: 2500,
        desc: 'Đào được 1 Cục Vàng quý hiếm giao cho Đồng Nát'
    }
];

// Nhiệm Vụ Trả Tài Nguyên Hàng Ngày (Dùng Nông sản, Cá, Trứng, Vật nuôi trong kho - CHỈ thưởng Vàng)
// Chú ý: Cá câu được giao cho Long Nữ nhận Vàng = Giá mua Phú Nông của tổng 5 mồi câu hôm đó + 140 vàng + 10 vàng
const DAILY_QUESTS_META = [
    ...MERCHANT_QUESTS_META,
    // NHIỆM VỤ LONG NỮ (GIAO CÁ ĐỔI VÀNG = GIÁ MUA PHÚ NÔNG 5 MỒI CÂU + 140 + 10)
    {
        id: 'q_long_nu_ro',
        title: '🧜‍♀️ Long Nữ: Giao Nộp Cá Rô Đồng',
        requirements: [{ id: 'fish_ro', qty: 1 }],
        isLongNu: true,
        fishId: 'fish_ro',
        rewardGold: 162.5
    },
    {
        id: 'q_long_nu_chep',
        title: '🧜‍♀️ Long Nữ: Giao Nộp Cá Chép Vàng',
        requirements: [{ id: 'fish_chep', qty: 1 }],
        isLongNu: true,
        fishId: 'fish_chep',
        rewardGold: 240
    },
    {
        id: 'q_long_nu_hoi',
        title: '🧜‍♀️ Long Nữ: Giao Nộp Cá Hồi',
        requirements: [{ id: 'fish_hoi', qty: 1 }],
        isLongNu: true,
        fishId: 'fish_hoi',
        rewardGold: 250
    },
    {
        id: 'q_farm_basic',
        title: '🌱 Đơn Nông Trại Khởi Đầu',
        requirements: [{ id: 'rau_mam', qty: 3 }, { id: 'anh_dao', qty: 2 }],
        rewardGold: 25
    },
    {
        id: 'q_farm_veggie',
        title: '🍓 Giỏ Quả & Nấm Tươi Sạch',
        requirements: [{ id: 'dau_tay', qty: 2 }, { id: 'nam_linh_chi', qty: 1 }],
        rewardGold: 55
    },
    {
        id: 'q_eggs_basket',
        title: '🥚 Thu Mua Trứng Trang Trại',
        requirements: [{ id: 'egg_normal', qty: 3 }],
        rewardGold: 220
    },
    {
        id: 'q_farm_harvest',
        title: '🥕 Đơn Củ Quả Trung Cấp',
        requirements: [{ id: 'khoai_tay', qty: 2 }, { id: 'carrot', qty: 1 }],
        rewardGold: 100
    },
    {
        id: 'q_farm_luxury',
        title: '🍉 Hoa Quả Thượng Hạng',
        requirements: [{ id: 'nho_tim', qty: 1 }, { id: 'watermelon', qty: 1 }],
        rewardGold: 220
    }
];

// Gói VIP Access (Mua bằng Kim Cương: 1500 / 2500 / 4500)
const VIP_ACCESS_PLANS = {
    vip_1m: { id: 'vip_1m', label: '1 Tháng', days: 30, diamonds: 1500, icon: '🧰' },
    vip_3m: { id: 'vip_3m', label: '3 Tháng', days: 90, diamonds: 2500, icon: '💼', badge: 'HOT' },
    vip_6m: { id: 'vip_6m', label: '6 Tháng', days: 180, diamonds: 4500, icon: '👑' },
    vip_2y: { id: 'vip_6m', label: '6 Tháng', days: 180, diamonds: 4500, icon: '👑' }
};

// Tài Nguyên Tự Nhiên Trên Đảo Kiểu Sunflower Land (Dùng mở đất mới & bán Chợ P2P)
const RESOURCE_ITEMS = {
    wood: { id: 'wood', name: 'Gỗ (Wood)', icon: '🌳', sellVnd: 200, p2pFloorPrice: 200, exp: 3, category: 'resource' },
    stone: { id: 'stone', name: 'Đá (Stone)', icon: '⛰️', sellVnd: 500, p2pFloorPrice: 500, exp: 5, category: 'resource' },
    iron: { id: 'iron', name: 'Cục Sắt', icon: '⚙️', sellVnd: 1000, p2pFloorPrice: 1000, exp: 8, category: 'resource' },
    gold_ore: { id: 'gold_ore', name: 'Cục Vàng', icon: '✨', sellVnd: 2000, p2pFloorPrice: 2000, exp: 14, category: 'resource' }
};

const TOOL_TYPES = {
    pick_wood: {
        id: 'pick_wood',
        name: 'Cuốc Gỗ',
        icon: '⛏️',
        headColor: '#b45309',
        edgeColor: '#fde68a',
        desc: 'Dùng để chặt Gỗ',
        goldCost: 20,
        materials: [],
        dailyStock: 50
    },
    pick_stone: {
        id: 'pick_stone',
        name: 'Cuốc Đá',
        icon: '⛏️',
        headColor: '#64748b',
        edgeColor: '#e2e8f0',
        desc: 'Dùng để chặt Đá',
        goldCost: 20,
        materials: [{ id: 'wood', qty: 3 }],
        dailyStock: 30
    },
    pick_iron: {
        id: 'pick_iron',
        name: 'Cuốc Sắt',
        icon: '⛏️',
        headColor: '#94a3b8',
        edgeColor: '#ffffff',
        desc: 'Dùng để chặt Sắt',
        goldCost: 20,
        materials: [{ id: 'wood', qty: 3 }, { id: 'stone', qty: 5 }],
        dailyStock: 20
    },
    pick_gold: {
        id: 'pick_gold',
        name: 'Cuốc Vàng',
        icon: '⛏️',
        headColor: '#eab308',
        edgeColor: '#fef9c3',
        desc: 'Dùng để chặt Vàng',
        goldCost: 80,
        materials: [{ id: 'wood', qty: 3 }, { id: 'iron', qty: 5 }],
        dailyStock: 10
    }
};

const RESOURCE_NODES_META = {
    tree: {
        id: 'tree',
        name: 'Cây Gỗ',
        dropItemId: 'wood',
        dropQty: 1,
        cooldownSec: 7200, // 2 giờ
        exp: 4,
        requiredTool: 'pick_wood',
        actionLabel: 'Chặt',
        readyBg: 'bg-gradient-to-b from-emerald-100/95 to-emerald-200/95 border-emerald-700 text-emerald-950'
    },
    stone: {
        id: 'stone',
        name: 'Mỏ Đá',
        dropItemId: 'stone',
        dropQty: 1,
        cooldownSec: 14400, // 4 giờ
        exp: 6,
        requiredTool: 'pick_stone',
        actionLabel: 'Chặt',
        readyBg: 'bg-gradient-to-b from-slate-100/95 to-slate-200/95 border-slate-700 text-slate-900'
    },
    iron: {
        id: 'iron',
        name: 'Mỏ Sắt',
        dropItemId: 'iron',
        dropQty: 1,
        cooldownSec: 28800, // 8 giờ
        exp: 10,
        requiredTool: 'pick_iron',
        actionLabel: 'Chặt',
        readyBg: 'bg-gradient-to-b from-amber-50/95 to-orange-200/95 border-amber-800 text-amber-950'
    },
    gold_rock: {
        id: 'gold_rock',
        name: 'Mỏ Vàng',
        dropItemId: 'gold_ore',
        dropQty: 1,
        cooldownSec: 86400, // 1 ngày (24 giờ)
        exp: 16,
        requiredTool: 'pick_gold',
        actionLabel: 'Chặt',
        readyBg: 'bg-gradient-to-b from-yellow-100/95 to-amber-300/95 border-amber-700 text-amber-950'
    }
};

// Chuỗi 7 Ngày Nhận Vàng VIP Hàng Ngày (Tuần xoay vòng: 5, 10, 15, 20, 25, 30, 35 Vàng)
const VIP_DAILY_REWARDS = [
    { day: 1, title: 'Hôm nay', icon: '💰', label: '+5 Vàng', gold: 5 },
    { day: 2, title: 'Ngày 2', icon: '💰', label: '+10 Vàng', gold: 10 },
    { day: 3, title: 'Ngày 3', icon: '💰', label: '+15 Vàng', gold: 15 },
    { day: 4, title: 'Ngày 4', icon: '💰', label: '+20 Vàng', gold: 20 },
    { day: 5, title: 'Ngày 5', icon: '💰', label: '+25 Vàng', gold: 25 },
    { day: 6, title: 'Ngày 6', icon: '💰', label: '+30 Vàng', gold: 30 },
    { day: 7, title: 'Ngày 7 MEGA', icon: '💰', label: '+35 Vàng', gold: 35 }
];

class GameEngine {
    constructor() {
        const tgName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;
        this.playerName = tgName ? `${tgName}` : 'Bạn (Cần Thủ)';

        const nowDate = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        this.sessionEntryTime = `${pad(nowDate.getHours())}:${pad(nowDate.getMinutes())}`;

        this.data = this.createDefaultData();
        this.currentLandTier = 1; // 1 | 2 | 3
        this.pendingUnlockIndex = null;

        this.fishingState = 'idle';
        this.fishBiteTimer = null;
        this.minigameAnim = null;
        this.tensionFishPos = 50;
        this.tensionSafePos = 50;
        this.tensionProgress = 30;
        this.isReeling = false;
        this.currentCatch = null;

        // Hồ Cá Visual State
        this.playerBobber = { x: 0.52, y: 0.56 };
        this.castAnimProgress = 0;
        this.catchFlyAnim = null;
        this.ripples = [];
        this.npcAnglers = this.createNpcAnglers();

        // Chicken Visual State
        this.chickenVisuals = [];
        this.chickenFloats = [];

        // Chợ P2P (Người chơi giao dịch trực tiếp - Thường 20% / VIP 12,5%)
        this.marketListings = [];
        this.marketFilter = 'all';
        this.marketCategory = 'all';
        this.pendingListItemId = null;
        this.isMarketBusy = false;
        this.withdrawMethod = 'momo';

        // Tài khoản người chơi & Đồng bộ chống mất dữ liệu
        this.authToken = '';
        this.currentUser = null;
        this.isOwnerAdmin = false;
        this.isServerSyncDirty = false;
        this.isSavingToServer = false;
        this._serverSaveDebounce = null;
        this.lastSyncedAt = 0;

        // Cổng xác minh cộng đồng Telegram (@thongbaofarmhappy & @nhomchatfarmhappy)
        this.channelGateOpened = false;
        this.groupGateOpened = false;

        // NPC Phú Nông (Mua & Bán trực tiếp với game bằng Vàng)
        this.npcShopTab = 'buy';
        this.npcBuyKind = 'seed';
        this.npcSeedTierFilter = 'all';
        this.npcSelectedBuyKey = 'seed_rau_mam';
        this.npcSelectedSellId = 'rau_mam';

        // VIP Access Center
        this.vipCenterTab = 'buy';
        this.selectedVipPlanId = 'vip_1m';

        // Thợ Rèn & Công Cụ (Ảnh 1 & 2)
        this.blacksmithTab = 'tools';
        this.selectedToolId = 'pick_wood';

        // Kho Đồ Tổng Hợp
        this.warehouseCategory = 'all';

        this.init();
    }

    createDefaultData() {
        return {
            economyVersion: 3,
            level: 1,
            exp: 0,
            gold: 500,       // Thưởng 500 vàng khi mới vào game
            diamonds: 0,     // Kim Cương bằng 0
            vnd: 0,          // Việt Nam Đồng bằng 0
            energy: 20,
            maxEnergy: 20,
            selectedSeed: 'rau_mam',
            // 108 ô đất (36 Cấp 1 + 36 Cấp 2 + 36 Cấp 3) — Ban đầu CHƯA MỞ, cần xem 2 quảng cáo để mở ô đầu tiên (#1)
            plots: Array.from({ length: 108 }, (_, i) => ({
                id: i,
                tier: i < 36 ? 1 : (i < 72 ? 2 : 3),
                unlocked: false,
                crop: null,
                plantedAt: 0,
                watered: false
            })),
            plot0AdsWatched: 0,
            // Mỏ tài nguyên ban đầu trên Đảo: 3 Cây Gỗ + 1 Mỏ Đá (mở thêm khi mở rộng ô đất)
            resourceNodes: [
                { uid: 1, type: 'tree', harvestedAt: 0 },
                { uid: 2, type: 'tree', harvestedAt: 0 },
                { uid: 3, type: 'tree', harvestedAt: 0 },
                { uid: 4, type: 'stone', harvestedAt: 0 }
            ],
            nextNodeUid: 5,
            tools: { pick_wood: 0, pick_stone: 0, pick_iron: 0, pick_gold: 0 },
            smithStock: this.createFreshSmithStock(),
            coopTier: 1,
            chickens: [],
            coopFood: 0,
            eggsOnGround: [],
            chickenBoostUntil: 0,
            phoenixUntil: 0,
            dailyQuests: this.createFreshDailyQuests(),
            inventory: {},
            seedBag: {},
            seedBagMigrated15: true,
            npcStock: this.createFreshNpcStock(),
            totalCakesCooked: 0,
            bakeryFilter: 'all',
            bakingSlots: {},
            rodLevel: 1,
            hasVipRodPermanent: false,
            isVipRod: false,
            vipRodUntil: 0,
            vipTicketUntil: 0,
            vipAccessUntil: 0,
            vipPlanId: null,
            vipDailyStreak: 0,
            vipLastGiftDate: '',
            vipStats: {
                dailyGoldClaimed: 0,
                vndFeeSaved: 0,
                dailyGiftsClaimed: 0
            },
            adGold2h: {
                date: this.getTodayDateKey(),
                claimsToday: 0,
                nextClaimAt: 0
            },
            marketListingsToday: {
                date: this.getTodayDateKey(),
                count: 0
            },
            scrapQuest: {
                date: this.getTodayDateKey(),
                claimed: false
            },
            totalFishCount: 0,
            lastEnergyTime: Date.now()
        };
    }

    createFreshSmithStock() {
        const items = {};
        Object.keys(TOOL_TYPES).forEach(k => {
            items[k] = TOOL_TYPES[k].dailyStock;
        });
        return {
            date: this.getTodayDateKey(),
            limitVersion: 2,
            items
        };
    }

    createFreshNpcStock() {
        const items = {};
        this.getOrderedSeedTypes().forEach(seed => {
            const tierMeta = SEED_TIER_META[seed.tier] || SEED_TIER_META.normal;
            const maxS = seed.maxStock !== undefined ? seed.maxStock : tierMeta.maxStock;
            items[`seed_${seed.id}`] = maxS;
        });
        return {
            date: this.getTodayDateKey(),
            seedLimitVersion: 5,
            items
        };
    }

    getOrderedSeedTypes() {
        return Object.values(SEED_TYPES).sort((a, b) => a.order - b.order);
    }

    formatCountdownClock(totalSec) {
        const sec = Math.max(0, Math.floor(totalSec));
        if (sec < 60) return `${sec}s`;
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
        return `${m}p${String(s).padStart(2, '0')}`;
    }

    getTodayDateKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    createFreshDailyQuests() {
        const claimed = {};
        DAILY_QUESTS_META.forEach(q => { claimed[q.id] = false; });
        return {
            date: this.getTodayDateKey(),
            claimed
        };
    }

    createNpcAnglers() {
        const leftNames = [
            { name: 'Vương vui vẻ', shirt: '#38bdf8', rod: 2 },
            { name: 'Chú Bé Đần', shirt: '#fb7185', rod: 1 },
            { name: 'Nhật Lệ', shirt: '#34d399', rod: 2 },
            { name: 'Minh Hiếu', shirt: '#a78bfa', rod: 3 },
            { name: 'Nhật GoodBoy', shirt: '#60a5fa', rod: 1 }
        ];
        const rightNames = [
            { name: 'Ngọc Miu', shirt: '#f472b6', rod: 3 },
            { name: 'Minh Anh', shirt: '#facc15', rod: 4 },
            { name: 'Phú Thịnh', shirt: '#2dd4bf', rod: 3 },
            { name: 'Duy 11cb', shirt: '#818cf8', rod: 2 },
            { name: 'Phan Tâm', shirt: '#f97316', rod: 4 }
        ];

        const npcs = [];
        leftNames.forEach((n, idx) => {
            const t = (idx + 0.6) / 5.5;
            npcs.push({ ...n, side: 'left', t, bobberJitter: Math.random() * 10, hookTimer: 0, floatText: null });
        });
        rightNames.forEach((n, idx) => {
            const t = (idx + 0.6) / 5.5;
            npcs.push({ ...n, side: 'right', t, bobberJitter: Math.random() * 10, hookTimer: 0, floatText: null });
        });
        return npcs;
    }

    isBrowserHttpEnv() {
        return typeof window !== 'undefined' && !!window.location && /^https?:/.test(window.location.protocol);
    }

    init() {
        if (window.Telegram?.WebApp) {
            try {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
            } catch(e) {}
        }
        this.loadSave();
        this.syncChickenVisuals();
        this.setupEventListeners();
        this.initFishingCanvas();
        this.initChickenCanvas();
        this.renderBakeryUI();
        this.renderAll();

        setInterval(() => {
            this.updateTick();
        }, 1000);

        setInterval(() => {
            this.simulateNpcCatch();
        }, 2200);

        if (this.isBrowserHttpEnv()) {
            this.bootstrapAuthSession();

            // Tự động quét và nhận tiền bán hàng & phí sàn P2P mỗi 25 giây
            setInterval(() => {
                if (this.currentUser && this.authToken) {
                    this.refreshP2PMarket(true);
                }
            }, 25000);

            setInterval(() => {
                if (this.currentUser && this.authToken && this.isServerSyncDirty) {
                    this.syncSaveToServer(false);
                }
            }, 10000);

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.flushSaveBeacon();
                }
            });
            window.addEventListener('pagehide', () => this.flushSaveBeacon());
            window.addEventListener('beforeunload', () => this.flushSaveBeacon());

            // Phím tắt bí mật chỉ dành cho Chủ Game mở xác thực Quản Trị (Ctrl + Shift + A)
            document.addEventListener('keydown', e => {
                if (e.ctrlKey && e.shiftKey && String(e.key || '').toLowerCase() === 'a') {
                    e.preventDefault();
                    if (window.paymentManager) window.paymentManager.openAdminModal();
                }
            });
        } else {
            setTimeout(() => {
                this.syncVipStatusFromServer();
                this.refreshP2PMarket(false);
            }, 700);
        }
    }

    getSaveStorageKey(username = this.currentUser?.username) {
        return username ? `lucky_farm_save_${username}` : 'lucky_farm_fishing_data';
    }

    normalizeLoadedData(parsed) {
        if (!parsed || typeof parsed !== 'object') return this.createDefaultData();
        if (!parsed.economyVersion || parsed.economyVersion < 2) {
            return this.createDefaultData();
        }
        const normalized = { ...this.createDefaultData(), ...parsed, economyVersion: 3 };
        if (typeof normalized.plot0AdsWatched !== 'number') {
            normalized.plot0AdsWatched = (normalized.plots && normalized.plots[0]?.unlocked) ? 2 : 0;
        }
        if (normalized.level > 108) normalized.level = 108;
        // Chuyển đổi mượt mà từ 48 ô/cấp (144) sang 36 ô/cấp (108)
        if (!Array.isArray(parsed.plots) || parsed.plots.length !== 108) {
            const prevUnlocked = Array.isArray(parsed.plots) ? parsed.plots.filter(p => p.unlocked).length : 1;
            const keepUnlocked = Math.max(1, Math.min(108, prevUnlocked));
            normalized.plots = Array.from({ length: 108 }, (_, i) => {
                const oldPlot = Array.isArray(parsed.plots) ? parsed.plots[i] : null;
                return {
                    id: i,
                    tier: i < 36 ? 1 : (i < 72 ? 2 : 3),
                    unlocked: i < keepUnlocked,
                    crop: i < keepUnlocked && oldPlot ? (oldPlot.crop || null) : null,
                    plantedAt: i < keepUnlocked && oldPlot ? (oldPlot.plantedAt || 0) : 0,
                    watered: i < keepUnlocked && oldPlot ? !!oldPlot.watered : false
                };
            });
        }
        if (!SEED_TYPES[normalized.selectedSeed]) normalized.selectedSeed = 'rau_mam';
        if (!normalized.coopTier || normalized.coopTier < 1) normalized.coopTier = 1;
        if (normalized.coopTier > 5) normalized.coopTier = 5;
        if (!Array.isArray(normalized.chickens)) {
            normalized.chickens = [];
        } else {
            normalized.chickens = normalized.chickens.map((c, idx) => ({
                id: c.id || (idx + 1),
                breed: c.breed || 'ri',
                fedAt: typeof c.fedAt === 'number' ? c.fedAt : 0,
                readyAt: typeof c.readyAt === 'number' ? c.readyAt : 0
            }));
        }
        if (!Array.isArray(normalized.eggsOnGround)) normalized.eggsOnGround = [];
        // Bỏ gà khỏi kho (Gà sống trực tiếp trong Chuồng Gà, kho chỉ chứa Trứng) - Giới hạn theo sức chứa tối đa của Cấp Trại Gà
        const maxCoopChickens = (COOP_TIERS[normalized.coopTier] && COOP_TIERS[normalized.coopTier].maxChickens) || 10;
        if (normalized.inventory && normalized.inventory.chicken_ri) {
            const chickenCount = Number(normalized.inventory.chicken_ri || 0);
            delete normalized.inventory.chicken_ri;
            const now = Date.now();
            const spaceLeft = Math.max(0, maxCoopChickens - normalized.chickens.length);
            const toAdd = Math.min(chickenCount, spaceLeft);
            const overflow = chickenCount - toAdd;
            for (let i = 0; i < toAdd; i++) {
                normalized.chickens.push({
                    id: now + i + Math.floor(Math.random() * 1000),
                    breed: 'ri',
                    startedAt: now,
                    readyAt: now + CHICKEN_LAY_TIME_MS,
                    fedAt: now
                });
            }
            if (overflow > 0) {
                normalized.gold = Math.round(((normalized.gold || 0) + overflow * CHICKEN_PRICE_GOLD) * 10) / 10;
            }
        }
        if (typeof normalized.coopFood !== 'number') normalized.coopFood = 0;
        if (!normalized.dailyQuests || normalized.dailyQuests.date !== this.getTodayDateKey()) {
            normalized.dailyQuests = this.createFreshDailyQuests();
        } else if (normalized.dailyQuests.claimed) {
            DAILY_QUESTS_META.forEach(q => {
                if (normalized.dailyQuests.claimed[q.id] === undefined) {
                    normalized.dailyQuests.claimed[q.id] = false;
                }
            });
        }
        if (!normalized.seedBag || typeof normalized.seedBag !== 'object') {
            normalized.seedBag = {};
        } else if (!normalized.seedBagMigrated15) {
            normalized.selectedSeed = 'rau_mam';
            normalized.seedBagMigrated15 = true;
        }
        if (!normalized.vipStats || typeof normalized.vipStats !== 'object') {
            normalized.vipStats = this.createDefaultData().vipStats;
        }
        if (!normalized.tools || typeof normalized.tools !== 'object') {
            normalized.tools = { pick_wood: 0, pick_stone: 0, pick_iron: 0, pick_gold: 0 };
        } else if (normalized.tools.pick_wood === undefined) {
            normalized.tools = {
                pick_wood: Number(normalized.tools.axe ?? 0),
                pick_stone: Number(normalized.tools.pickaxe ?? 0),
                pick_iron: Number(normalized.tools.stone_pickaxe ?? 0),
                pick_gold: Number(normalized.tools.iron_pickaxe ?? 0)
            };
        }
        if (!normalized.smithStock || normalized.smithStock.date !== this.getTodayDateKey() || normalized.smithStock.items?.pick_wood === undefined) {
            normalized.smithStock = this.createFreshSmithStock();
        }
        if (!normalized.adGold2h || typeof normalized.adGold2h !== 'object') {
            normalized.adGold2h = {
                date: this.getTodayDateKey(),
                claimsToday: 0,
                nextClaimAt: 0
            };
        } else if (normalized.adGold2h.date !== this.getTodayDateKey()) {
            normalized.adGold2h.date = this.getTodayDateKey();
            normalized.adGold2h.claimsToday = 0;
        }
        if (!normalized.marketListingsToday || typeof normalized.marketListingsToday !== 'object' || normalized.marketListingsToday.date !== this.getTodayDateKey()) {
            normalized.marketListingsToday = { date: this.getTodayDateKey(), count: 0 };
        }
        if (!normalized.scrapQuest || typeof normalized.scrapQuest !== 'object' || normalized.scrapQuest.date !== this.getTodayDateKey()) {
            normalized.scrapQuest = { date: this.getTodayDateKey(), claimed: false };
        }
        if (!normalized.bakingSlots || typeof normalized.bakingSlots !== 'object') {
            normalized.bakingSlots = {};
        }
        if (Array.isArray(normalized.resourceNodes)) {
            const treeCount = normalized.resourceNodes.filter(n => n.type === 'tree').length;
            const stoneCount = normalized.resourceNodes.filter(n => n.type === 'stone').length;
            let maxUid = normalized.resourceNodes.reduce((max, n) => Math.max(max, n.uid || 0), 0);
            if (treeCount < 3) {
                for (let i = treeCount; i < 3; i++) {
                    normalized.resourceNodes.push({ uid: ++maxUid, type: 'tree', harvestedAt: 0 });
                }
            }
            if (stoneCount < 1) {
                normalized.resourceNodes.push({ uid: ++maxUid, type: 'stone', harvestedAt: 0 });
            }
            if ((normalized.nextNodeUid || 0) <= maxUid) {
                normalized.nextNodeUid = maxUid + 1;
            }
        } else {
            normalized.resourceNodes = this.createDefaultData().resourceNodes;
            normalized.nextNodeUid = 5;
        }
        return normalized;
    }

    applyLoadedSaveData(parsed) {
        this.data = this.normalizeLoadedData(parsed);
        this.ensureNpcStock();
        if (!Array.isArray(this.data.resourceNodes)) {
            this.syncInitialResourceNodesForSave();
        }
    }

    // Load dữ liệu lưu
    loadSave() {
        const key = this.getSaveStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.applyLoadedSaveData(parsed);
            } catch (e) {
                console.error("Save load error", e);
            }
        }
    }

    save() {
        if (this.isBrowserHttpEnv() && !this.currentUser) {
            return;
        }
        this.data.savedAt = Date.now();
        try {
            localStorage.setItem(this.getSaveStorageKey(), JSON.stringify(this.data));
        } catch (e) {
            console.error("Local save error", e);
        }
        if (this.isBrowserHttpEnv() && this.authToken && this.currentUser) {
            this.isServerSyncDirty = true;
            this.scheduleServerSync();
        }
    }

    scheduleServerSync() {
        clearTimeout(this._serverSaveDebounce);
        this._serverSaveDebounce = setTimeout(() => {
            this.syncSaveToServer(false);
        }, 200);
    }

    async syncSaveToServer(force = false) {
        if (!this.isBrowserHttpEnv() || !this.authToken || !this.currentUser) return false;
        if (!force && !this.isServerSyncDirty) return true;
        if (this.isSavingToServer && !force) return false;
        this.isSavingToServer = true;
        try {
            this.data.savedAt = Date.now();
            localStorage.setItem(this.getSaveStorageKey(), JSON.stringify(this.data));
            const res = await fetch('/api/save', {
                method: 'POST',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.authToken
                },
                body: JSON.stringify({ token: this.authToken, saveData: this.data })
            });
            if (res.ok) {
                this.isServerSyncDirty = false;
                this.lastSyncedAt = Date.now();
                return true;
            }
        } catch (e) {}
        finally {
            this.isSavingToServer = false;
        }
        return false;
    }

    flushSaveBeacon() {
        if (!this.isBrowserHttpEnv() || !this.authToken || !this.currentUser) return;
        this.data.savedAt = Date.now();
        try {
            localStorage.setItem(this.getSaveStorageKey(), JSON.stringify(this.data));
        } catch (e) {}
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            try {
                const payload = JSON.stringify({ token: this.authToken, saveData: this.data });
                navigator.sendBeacon('/api/save', new Blob([payload], { type: 'application/json' }));
                this.isServerSyncDirty = false;
            } catch (e) {}
        }
    }

    setOwnerAdminState(isAdmin) {
        this.isOwnerAdmin = !!isAdmin;
        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) {
            btnSettings.classList.toggle('hidden', !this.isOwnerAdmin);
        }
    }

    isCommunityVerified() {
        return localStorage.getItem('lucky_farm_community_verified') === 'true';
    }

    showCommunityGate() {
        const modal = document.getElementById('modal-community-gate');
        if (!modal) return;
        this.hideAuthModal();
        modal.classList.remove('hidden');
    }

    hideCommunityGate() {
        const modal = document.getElementById('modal-community-gate');
        if (modal) modal.classList.add('hidden');
    }

    showAuthModal(defaultTab = 'register', message = '') {
        if (defaultTab === 'register' && !this.isCommunityVerified()) {
            this.showCommunityGate();
            return;
        }
        this.hideCommunityGate();
        const modal = document.getElementById('modal-auth');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.switchAuthTab(defaultTab);
        this.setAuthError(message);
    }

    hideAuthModal() {
        const modal = document.getElementById('modal-auth');
        if (modal) modal.classList.add('hidden');
        this.setAuthError('');
    }

    switchAuthTab(tab) {
        if (tab === 'register' && !this.isCommunityVerified()) {
            this.hideAuthModal();
            this.showCommunityGate();
            if (window.adsgramManager?.showToast) {
                window.adsgramManager.showToast('⚠️ Vui lòng tham gia cộng đồng Telegram trước khi tạo tài khoản!', 'warning');
            }
            return;
        }
        const isReg = tab === 'register';
        const regPanel = document.getElementById('auth-panel-register');
        const loginPanel = document.getElementById('auth-panel-login');
        const regBtn = document.getElementById('auth-tab-register');
        const loginBtn = document.getElementById('auth-tab-login');
        if (regPanel) regPanel.classList.toggle('hidden', !isReg);
        if (loginPanel) loginPanel.classList.toggle('hidden', isReg);
        if (regBtn) {
            regBtn.classList.toggle('bg-emerald-600', isReg);
            regBtn.classList.toggle('text-white', isReg);
            regBtn.classList.toggle('shadow', isReg);
            regBtn.classList.toggle('text-slate-600', !isReg);
        }
        if (loginBtn) {
            loginBtn.classList.toggle('bg-amber-500', !isReg);
            loginBtn.classList.toggle('text-slate-900', !isReg);
            loginBtn.classList.toggle('shadow', !isReg);
            loginBtn.classList.toggle('text-slate-600', isReg);
        }
        this.setAuthError('');
    }

    setAuthError(msg) {
        const el = document.getElementById('auth-error-msg');
        if (!el) return;
        if (msg) {
            el.innerText = msg;
            el.classList.remove('hidden');
        } else {
            el.innerText = '';
            el.classList.add('hidden');
        }
    }

    async onAuthenticatedUser(token, user, serverSaveData) {
        this.authToken = token;
        this.currentUser = user;
        this.playerName = user.displayName || user.username;
        localStorage.setItem('lucky_farm_auth_token', token);
        localStorage.setItem('lucky_farm_last_username', user.username);
        if (window.paymentManager && typeof window.paymentManager.syncPlayerId === 'function') {
            window.paymentManager.syncPlayerId(user.playerId);
        }
        this.setOwnerAdminState(!!user.isAdmin);

        let localData = null;
        try {
            const rawLocal = localStorage.getItem(this.getSaveStorageKey(user.username));
            if (rawLocal) localData = JSON.parse(rawLocal);
        } catch (e) {}

        const srvTs = Number(serverSaveData?.savedAt || 0);
        const locTs = Number(localData?.savedAt || 0);
        let chosen = null;
        let shouldPushToServer = false;

        if (serverSaveData && localData) {
            if (locTs > srvTs) {
                chosen = localData;
                shouldPushToServer = true;
            } else {
                chosen = serverSaveData;
            }
        } else if (serverSaveData) {
            chosen = serverSaveData;
        } else if (localData) {
            chosen = localData;
            shouldPushToServer = true;
        } else {
            chosen = this.createDefaultData();
            shouldPushToServer = true;
        }

        this.applyLoadedSaveData(chosen);
        this.data.savedAt = Number(this.data.savedAt || Date.now());
        localStorage.setItem(this.getSaveStorageKey(user.username), JSON.stringify(this.data));

        if (shouldPushToServer) {
            this.isServerSyncDirty = true;
            await this.syncSaveToServer(true);
        } else {
            this.isServerSyncDirty = false;
            this.lastSyncedAt = Date.now();
        }

        this.syncChickenVisuals();
        this.renderAll();
        this.hideAuthModal();
        setTimeout(() => {
            this.syncVipStatusFromServer();
            this.refreshP2PMarket(true);
            if (window.paymentManager) {
                window.paymentManager.checkAndClaimApprovedOrders(false);
            }
        }, 250);
    }

    async bootstrapAuthSession() {
        const savedToken = localStorage.getItem('lucky_farm_auth_token') || '';
        if (!savedToken) {
            const hadAccount = !!localStorage.getItem('lucky_farm_last_username');
            if (!hadAccount && !this.isCommunityVerified()) {
                this.showCommunityGate();
                return;
            }
            this.showAuthModal(hadAccount ? 'login' : 'register');
            return;
        }
        try {
            const adminTok = sessionStorage.getItem('lucky_farm_admin_token') || '';
            const headers = { 'x-auth-token': savedToken };
            if (adminTok) headers['x-admin-token'] = adminTok;
            const res = await fetch('/api/auth/me', { headers });
            const data = await res.json();
            if (!res.ok || !data.ok || !data.user) {
                localStorage.removeItem('lucky_farm_auth_token');
                this.showAuthModal('login', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại để tiếp tục!');
                return;
            }
            await this.onAuthenticatedUser(savedToken, data.user, data.saveData);
        } catch (err) {
            // Nếu mạng tạm chập chờn nhưng đã có username local thì vẫn cảnh báo thay vì xóa dữ liệu
            this.showAuthModal('login', 'Không kết nối được máy chủ xác thực, vui lòng đăng nhập lại!');
        }
    }

    async submitRegister() {
        const username = (document.getElementById('auth-reg-username')?.value || '').trim().toLowerCase();
        const displayName = (document.getElementById('auth-reg-displayname')?.value || '').trim();
        const password = document.getElementById('auth-reg-password')?.value || '';
        const password2 = document.getElementById('auth-reg-password2')?.value || '';

        if (!/^[a-z0-9_]{3,24}$/.test(username)) {
            this.setAuthError('Tên đăng nhập dài 3-24 ký tự, chỉ gồm chữ thường không dấu, số hoặc dấu _.');
            return;
        }
        if (password.length < 4) {
            this.setAuthError('Mật khẩu phải có ít nhất 4 ký tự.');
            return;
        }
        if (password !== password2) {
            this.setAuthError('Mật khẩu nhập lại không khớp!');
            return;
        }

        // Khi tạo tài khoản mới: Tuyệt đối chỉ nhận 500 Vàng ban đầu, 0 Kim Cương, 0 VND!
        const initialData = this.createDefaultData();
        initialData.gold = 500;
        initialData.diamonds = 0;
        initialData.vnd = 0;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, displayName: displayName || username, password, initialData })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                this.setAuthError(data.error || 'Không thể tạo tài khoản!');
                return;
            }
            if (initialData) {
                localStorage.setItem('lucky_farm_legacy_claimed', data.user.username);
            }
            await this.onAuthenticatedUser(data.token, data.user, data.saveData);
            window.adsgramManager.showToast(`🎉 Chào mừng @${data.user.username}! Tài khoản đã sẵn sàng.`, 'success');
        } catch (err) {
            this.setAuthError('Lỗi kết nối máy chủ khi tạo tài khoản!');
        }
    }

    async submitLogin() {
        const username = (document.getElementById('auth-login-username')?.value || '').trim().toLowerCase();
        const password = document.getElementById('auth-login-password')?.value || '';
        if (!username || !password) {
            this.setAuthError('Vui lòng nhập đủ tên đăng nhập và mật khẩu!');
            return;
        }
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                this.setAuthError(data.error || 'Sai tên đăng nhập hoặc mật khẩu!');
                return;
            }
            await this.onAuthenticatedUser(data.token, data.user, data.saveData);
            window.adsgramManager.showToast(`👋 Chào mừng @${data.user.username} trở lại! Dữ liệu đã được khôi phục đầy đủ.`, 'success');
        } catch (err) {
            this.setAuthError('Lỗi kết nối máy chủ khi đăng nhập!');
        }
    }

    openAccountMenu() {
        const modal = document.getElementById('modal-account-menu');
        if (!modal) return;
        const lvEl = document.getElementById('account-menu-lv');
        const nameEl = document.getElementById('account-menu-displayname');
        const userEl = document.getElementById('account-menu-username');
        const expEl = document.getElementById('account-menu-exp');
        if (lvEl) lvEl.innerText = this.data?.level || 1;
        if (nameEl) nameEl.innerText = this.currentUser?.displayName || this.playerName || 'Nông Dân';
        if (userEl) userEl.innerText = this.currentUser?.username ? `@${this.currentUser.username}` : '@guest';
        if (expEl) {
            const reqExp = this.getRequiredExp();
            const currentExp = this.data?.exp || 0;
            const isMax = (this.data?.level || 1) >= 108 || !isFinite(reqExp);
            expEl.innerText = isMax ? 'Cấp tối đa (Lv.108)' : `EXP: ${currentExp.toLocaleString()} / ${reqExp.toLocaleString()} (Cần ${(reqExp - currentExp).toLocaleString()})`;
        }
        modal.classList.remove('hidden');
    }

    async logoutAccount() {
        const btnLogout = document.getElementById('btn-logout-account');
        if (btnLogout) btnLogout.disabled = true;
        try {
            if (this.authToken && this.currentUser) {
                this.data.savedAt = Date.now();
                localStorage.setItem(this.getSaveStorageKey(this.currentUser.username), JSON.stringify(this.data));
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': this.authToken,
                        'x-admin-token': sessionStorage.getItem('lucky_farm_admin_token') || ''
                    },
                    body: JSON.stringify({
                        token: this.authToken,
                        saveData: this.data
                    })
                }).catch(() => {});
            }
        } finally {
            clearTimeout(this._serverSaveDebounce);
            this.authToken = '';
            this.currentUser = null;
            this.isServerSyncDirty = false;
            this.setOwnerAdminState(false);
            localStorage.removeItem('lucky_farm_auth_token');
            if (window.paymentManager && typeof window.paymentManager.logoutAdminSession === 'function') {
                window.paymentManager.logoutAdminSession();
            }
            const accModal = document.getElementById('modal-account-menu');
            if (accModal) accModal.classList.add('hidden');
            this.data = this.createDefaultData();
            this.renderAll();
            this.showAuthModal('login');
            window.adsgramManager.showToast('💾 Đã lưu toàn bộ dữ liệu và đăng xuất an toàn!', 'info');
            if (btnLogout) btnLogout.disabled = false;
        }
    }

    // ==========================================
    // RENDER & UI UPDATES
    // ==========================================
    renderAll() {
        this.updateHeaderUI();
        this.renderPlots();
        this.renderIslandResourceNodes();
        this.renderChickenUI();
        this.renderSunflowerFishingUI();
        this.renderQuestsUI();
        const npcModal = document.getElementById('modal-npc-shop');
        if (npcModal && !npcModal.classList.contains('hidden')) {
            this.renderNpcShop();
        }
        this.updateVipUI();
        const vipModal = document.getElementById('modal-vip-center');
        if (vipModal && !vipModal.classList.contains('hidden')) {
            this.renderVipCenter();
        }
        const smithModal = document.getElementById('modal-blacksmith');
        if (smithModal && !smithModal.classList.contains('hidden')) {
            this.renderBlacksmithModal();
        }
        const warehouseView = document.getElementById('view-warehouse');
        if (warehouseView && !warehouseView.classList.contains('hidden')) {
            this.renderWarehouseModal();
        }
        const spinView = document.getElementById('view-spin');
        if (spinView && !spinView.classList.contains('hidden')) {
            this.renderBakeryUI();
        }
    }

    hasVipPass() {
        return Date.now() < (this.data.vipAccessUntil || 0);
    }

    getHighestLandTier() {
        if (!this.data || !Array.isArray(this.data.plots)) return 1;
        const t3Count = this.data.plots.slice(72, 108).filter(p => p.unlocked).length;
        if (t3Count > 0) return 3;
        const t2Count = this.data.plots.slice(36, 72).filter(p => p.unlocked).length;
        if (t2Count >= 36) return 3;
        if (t2Count > 0) return 2;
        const t1Count = this.data.plots.slice(0, 36).filter(p => p.unlocked).length;
        if (t1Count >= 36) return 2;
        return 1;
    }

    getLandFeeDiscount() {
        const tier = this.getHighestLandTier();
        if (tier >= 3) return 0.05; // Lên Đất Cấp 3 giảm 5% phí chợ
        if (tier === 2) return 0.025; // Lên Đất Cấp 2 giảm 2.5% phí chợ
        return 0;
    }

    getMarketFeeRate() {
        const base = this.hasVipPass() ? 0.125 : 0.20;
        const discount = this.getLandFeeDiscount();
        return Math.max(0.01, Number((base - discount).toFixed(4)));
    }

    getDailyMarketListingsCount() {
        if (!this.data.marketListingsToday || this.data.marketListingsToday.date !== this.getTodayDateKey()) {
            this.data.marketListingsToday = { date: this.getTodayDateKey(), count: 0 };
        }
        return Number(this.data.marketListingsToday.count || 0);
    }

    canListOnMarket() {
        if (this.hasVipPass()) {
            return { allowed: true, isVip: true, count: this.getDailyMarketListingsCount(), max: Infinity };
        }
        const count = this.getDailyMarketListingsCount();
        return { allowed: count < 1, isVip: false, count, max: 1 };
    }

    canClaimVipDailyGift() {
        if (!this.hasVipPass()) return false;
        return this.data.vipLastGiftDate !== this.getTodayDateKey();
    }

    updateVipUI() {
        const isVip = this.hasVipPass();
        const canClaim = this.canClaimVipDailyGift();

        const btnHeader = document.getElementById('btn-open-vip');
        if (btnHeader) {
            const labelSpan = btnHeader.querySelector('span:first-child');
            if (labelSpan) labelSpan.innerText = isVip ? '👑 VIP ✓' : '👑 VIP';
            btnHeader.classList.toggle('ring-2', isVip);
            btnHeader.classList.toggle('ring-yellow-200', isVip);
        }

        const headerDot = document.getElementById('vip-header-dot');
        if (headerDot) headerDot.classList.toggle('hidden', !canClaim);

        const dailyDot = document.getElementById('vip-daily-dot');
        if (dailyDot) dailyDot.classList.toggle('hidden', !canClaim);

        const banner = document.getElementById('market-fee-banner');
        if (banner) {
            const tier = this.getHighestLandTier();
            const feeRate = this.getMarketFeeRate();
            const feePctStr = (feeRate * 100).toFixed(1).replace('.0', '').replace('.', ',') + '%';

            let tierTag = '';
            if (tier === 3) tierTag = ' • 🌟 Đất Cấp 3: Giảm 5% phí';
            else if (tier === 2) tierTag = ' • 🌿 Đất Cấp 2: Giảm 2,5% phí';
            else tierTag = ' • 🔒 Mở Đất Cấp 2 giảm 2,5%, Đất Cấp 3 giảm 5%';

            if (isVip) {
                banner.innerHTML = `👑 Đặc quyền VIP: Phí bán Chợ P2P là <b>${feePctStr}</b>${tierTag}`;
            } else {
                banner.innerHTML = `Phí bán Chợ P2P: <b>${feePctStr}</b>${tierTag} (<button type="button" id="btn-market-open-vip" class="underline text-rose-700 font-black" onclick="game.openVipCenterModal('buy')">MUA VIP</button>)`;
            }
        }
    }

    isVipTicketActive() {
        return Date.now() < (this.data.vipTicketUntil || 0);
    }

    hasVipRod() {
        if (this.data.vipRodUntil && Date.now() >= this.data.vipRodUntil && !this.data.hasVipRodPermanent) {
            this.data.isVipRod = false;
        }
        return !!(this.data.hasVipRodPermanent || Date.now() < (this.data.vipRodUntil || 0));
    }

    isVipRodActive() {
        return this.hasVipRod();
    }

    getBigFishChancePercent() {
        if (!this.hasVipRod()) return 0;
        let base = 36 + (this.data.rodLevel - 1) * 8;
        if (this.isVipTicketActive()) base += 15;
        return Math.min(80, base);
    }

    updateHeaderUI() {
        document.getElementById('player-level').innerText = this.data.level;
        document.getElementById('player-gold').innerText = (Math.round((this.data.gold || 0) * 10) / 10).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
        document.getElementById('player-diamonds').innerText = (this.data.diamonds || 0).toLocaleString('vi-VN');
        const vndEl = document.getElementById('player-vnd');
        if (vndEl) vndEl.innerText = (this.data.vnd || 0).toLocaleString('vi-VN');
        const withdrawVndEl = document.getElementById('withdraw-current-vnd');
        if (withdrawVndEl) withdrawVndEl.innerText = (this.data.vnd || 0).toLocaleString('vi-VN');

        // Removed withdraw-diamonds / withdraw-vnd card (handled in Market VND / Rewards)

        // Cập nhật số lượng ô đất đã mở theo từng cấp (36 ô/cấp)
        const t1Count = this.data.plots.slice(0, 36).filter(p => p.unlocked).length;
        const t2Count = this.data.plots.slice(36, 72).filter(p => p.unlocked).length;
        const t3Count = this.data.plots.slice(72, 108).filter(p => p.unlocked).length;
        const totalUnlocked = t1Count + t2Count + t3Count;

        const elTotal = document.getElementById('total-unlocked-plots');
        if (elTotal) elTotal.innerText = `${totalUnlocked}/108`;
        const elT1 = document.getElementById('tier1-count');
        const elT2 = document.getElementById('tier2-count');
        const elT3 = document.getElementById('tier3-count');
        if (elT1) elT1.innerText = `(${t1Count}/36)`;
        if (elT2) elT2.innerText = t1Count < 36 ? `🔒 (${t2Count}/36)` : `(${t2Count}/36)`;
        if (elT3) elT3.innerText = t2Count < 36 ? `🔒 (${t3Count}/36)` : `(${t3Count}/36)`;

        const buffLabel = document.getElementById('current-tier-buff-label');
        if (buffLabel) {
            if (this.currentLandTier === 1) buffLabel.innerText = 'Đất Cấp 1: Phù Sa (Cơ Bản)';
            if (this.currentLandTier === 2) buffLabel.innerText = 'Đất Cấp 2: Màu Mỡ (+25% Tốc, +30% x2)';
            if (this.currentLandTier === 3) buffLabel.innerText = 'Đất Cấp 3: Thần Tài (+50% Tốc, +60% x2 & 💎)';
        }

        this.renderAdGold2hUI();

        const reqExp = this.getRequiredExp();
        const currentExp = this.data.exp || 0;
        const isMaxLevel = (this.data.level || 1) >= 108 || !isFinite(reqExp);
        const pct = !isMaxLevel && reqExp > 0 ? Math.min(100, Math.floor((currentExp / reqExp) * 100)) : 100;
        const expBarEl = document.getElementById('player-exp-bar');
        if (expBarEl) expBarEl.style.width = `${pct}%`;
        const expTextEl = document.getElementById('player-exp-text');
        if (expTextEl) {
            expTextEl.innerText = isMaxLevel ? 'MAX (108)' : `${currentExp.toLocaleString()} / ${reqExp.toLocaleString()} EXP`;
        }
        const avatarBtn = document.getElementById('btn-player-avatar');
        if (avatarBtn) {
            avatarBtn.title = isMaxLevel
                ? 'Đã đạt Cấp Tối Đa (Lv.108)'
                : `Cấp ${this.data.level || 1} • Cần ${(reqExp - currentExp).toLocaleString()} EXP nữa để lên Lv.${(this.data.level || 1) + 1} (Bấm để xem tài khoản)`;
        }

        const rodNames = ['Cần Tre Cơ Bản (Lv.1)', 'Cần Trung Cấp (Lv.2)', 'Cần Cao Cấp (Lv.3)'];
        const rodEl = document.getElementById('rod-name');
        if (rodEl) {
            if (this.data.hasVipRodPermanent) rodEl.innerText = '👑 Cần Câu VIP (Vĩnh Viễn)';
            else if (Date.now() < (this.data.vipRodUntil || 0)) rodEl.innerText = '👑 Cần Câu VIP (Dùng Thử)';
            else rodEl.innerText = rodNames[this.data.rodLevel - 1] || 'Cần Tre';
        }

        const vipRodSub = document.getElementById('vip-rod-btn-sub');
        if (vipRodSub) {
            if (this.data.hasVipRodPermanent) vipRodSub.innerText = 'Đã Sở Hữu ✓';
            else if (Date.now() < (this.data.vipRodUntil || 0)) {
                const s = Math.ceil((this.data.vipRodUntil - Date.now()) / 1000);
                vipRodSub.innerText = `Thử ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
            } else {
                vipRodSub.innerText = 'Câu Cá To';
            }
        }

        const entryEl = document.getElementById('session-entry-time');
        if (entryEl) entryEl.innerText = this.sessionEntryTime;

        const rateEl = document.getElementById('catch-rate-label');
        if (rateEl) {
            rateEl.innerText = this.hasVipRod() ? `${this.getBigFishChancePercent()}%` : '0% (Cần VIP)';
        }

        const vipBadge = document.getElementById('vip-pass-badge');
        const castCost = document.getElementById('cast-cost-badge');
        if (vipBadge && castCost) {
            if (this.isVipTicketActive()) {
                const secLeft = Math.ceil((this.data.vipTicketUntil - Date.now()) / 1000);
                const m = Math.floor(secLeft / 60);
                const s = String(secLeft % 60).padStart(2, '0');
                vipBadge.classList.remove('hidden');
                vipBadge.innerText = `VÉ VIP ${m}:${s}`;
            } else {
                vipBadge.classList.add('hidden');
            }
            castCost.innerText = 'Miễn Phí';
        }
    }

    // ==========================================
    // QUẢNG CÁO NHẬN VÀNG (CỨ SAU 1H NHẬN 1 LẦN, KHÔNG CỘNG DỒN, TỐI ĐA 24 LẦN/NGÀY)
    // ==========================================
    ensureAdGold2h() {
        const today = this.getTodayDateKey();
        if (!this.data.adGold2h || typeof this.data.adGold2h !== 'object') {
            this.data.adGold2h = {
                date: today,
                claimsToday: 0,
                nextClaimAt: 0
            };
        } else if (this.data.adGold2h.date !== today) {
            this.data.adGold2h.date = today;
            this.data.adGold2h.claimsToday = 0;
            // Giữ nguyên nextClaimAt nếu vẫn đang trong thời gian 1h chờ từ lần nhận trước
        }
        return this.data.adGold2h;
    }

    getAdGoldCooldownRemaining() {
        const state = this.ensureAdGold2h();
        if (!state.nextClaimAt) return 0;
        return Math.max(0, Math.ceil((state.nextClaimAt - Date.now()) / 1000));
    }

    renderAdGold2hUI() {
        const state = this.ensureAdGold2h();
        const statusEl = document.getElementById('ad-gold-status');
        const countEl = document.getElementById('ad-gold-count');
        const btnClaim = document.getElementById('btn-ad-gold-claim');
        if (!countEl || !btnClaim) return;

        const maxDaily = 24;
        const claims = Math.min(maxDaily, Number(state.claimsToday || 0));
        if (countEl) countEl.innerText = `${claims}/${maxDaily} lượt`;

        const waitSec = this.getAdGoldCooldownRemaining();

        // Bỏ chữ "Chờ: XXpXX" trên ảnh số 2 (ẩn statusEl)
        if (statusEl) {
            statusEl.innerText = '';
            statusEl.classList.add('hidden');
        }

        if (claims >= maxDaily) {
            btnClaim.disabled = true;
            btnClaim.innerText = 'Đủ 24/24';
            btnClaim.className = 'text-[9.5px] bg-slate-700 text-slate-400 font-bold px-2 py-1 rounded-lg cursor-not-allowed flex-shrink-0';
        } else if (waitSec > 0) {
            btnClaim.disabled = true;
            btnClaim.innerText = `⏳ ${this.formatCountdownClock(waitSec)}`;
            btnClaim.className = 'text-[9.5px] bg-amber-950/70 border border-amber-500/50 text-amber-200 font-bold px-2 py-1 rounded-lg cursor-not-allowed flex-shrink-0';
        } else {
            btnClaim.disabled = false;
            btnClaim.innerText = '▶ +1💰';
            btnClaim.className = 'text-[9.5px] bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-110 text-slate-950 font-black px-2 py-1 rounded-lg active:scale-95 shadow transition cursor-pointer flex-shrink-0';
        }
    }

    showAdGoldRewardPopup(goldReward, claimsToday, maxDaily) {
        const modal = document.getElementById('modal-ad-gold-reward');
        const dispEl = document.getElementById('ad-gold-reward-display');
        const infoEl = document.getElementById('ad-gold-next-info');
        if (dispEl) dispEl.innerText = `+${goldReward.toLocaleString()} 💰 Vàng`;
        if (infoEl) infoEl.innerHTML = `⏳ Lần nhận kế tiếp sau 1 giờ • Đã nhận: <b class="text-yellow-300">${claimsToday}/${maxDaily}</b> lượt hôm nay`;
        if (modal) modal.classList.remove('hidden');
        if (window.sound) {
            window.sound.playCoin();
            window.sound.playFanfare();
        }
        window.adsgramManager.showToast(`🎉 BẠN ĐÃ NHẬN THÀNH CÔNG +${goldReward.toLocaleString()} 💰 VÀNG!`, 'success');
    }

    claimAdGold2h() {
        const state = this.ensureAdGold2h();
        const maxDaily = 24;
        if (state.claimsToday >= maxDaily) {
            window.adsgramManager.showToast(`Hôm nay bạn đã nhận đủ ${maxDaily}/${maxDaily} lần Vàng từ quảng cáo! Vui lòng quay lại vào ngày mai.`, 'warning');
            return;
        }

        const waitSec = this.getAdGoldCooldownRemaining();
        if (waitSec > 0) {
            window.adsgramManager.showToast(`Cần chờ thêm ${this.formatCountdownClock(waitSec)} nữa mới có thể xem quảng cáo nhận Vàng (cách nhau 1 giờ/lần)!`, 'warning');
            return;
        }

        const adManager = window.monetagManager || window.adsgramManager;
        adManager.showTwoAdGold().then(success => {
            if (success) {
                const goldReward = 1;
                this.data.gold = (this.data.gold || 0) + goldReward;
                state.claimsToday = (state.claimsToday || 0) + 1;
                // Nhận xong mới chạy lại thời gian thiết lập 1h sau nhận (không cộng dồn)
                state.nextClaimAt = Date.now() + (1 * 60 * 60 * 1000);

                this.save();
                this.updateHeaderUI();
                this.showAdGoldRewardPopup(goldReward, state.claimsToday, maxDaily);
            }
        });
    }

    getRequiredExp(level = null) {
        const lv = level !== null ? level : Math.max(1, this.data.level || 1);
        if (lv >= 108) return Infinity;
        return 100 + (lv - 1) * 50;
    }

    addExp(amount, source = 'cooking') {
        if (!amount || amount <= 0) return;
        // Tăng cấp dựa vào: Nấu ăn, Ăn Bánh hoặc Sử dụng Cá (Cá Rô: +30, Cá Chép: +60, Cá Hồi: +90 EXP)
        if (source !== 'cooking' && source !== 'cake' && source !== 'fish') return;
        if (this.data.level >= 108) {
            this.data.level = 108;
            this.data.exp = 0;
            return;
        }
        this.data.exp += amount;
        while (this.data.level < 108 && this.data.exp >= this.getRequiredExp()) {
            this.data.exp -= this.getRequiredExp();
            this.data.level++;
            window.sound.playFanfare();
            window.adsgramManager.showToast(`🎉 CHÚC MỪNG! Bạn đã lên Cấp ${this.data.level}! Đã mở quyền mở Ô Đất thứ ${this.data.level}!`, 'success');
        }
        if (this.data.level >= 108) {
            this.data.level = 108;
            this.data.exp = 0;
        }
        this.save();
        this.updateHeaderUI();
        this.renderBakeryUI();
    }

    // ==========================================
    // 15 HẠT GIỐNG KHÁC BIỆT (SVG RIÊNG TỪNG LOẠI)
    // ==========================================
    getSeedPacketSvg(seedId, sizeClass = 'w-8 h-8') {
        const seedArt = {
            rau_mam: `
                <ellipse cx="16" cy="21" rx="7.5" ry="6.5" fill="#bef264" stroke="#365314" stroke-width="1.6"/>
                <path d="M16 14 Q16 7 10 8 Q11 13 16 14 Z" fill="#22c55e" stroke="#14532d" stroke-width="1.2"/>
                <path d="M16 14 Q17 6 23 8 Q22 13 16 14 Z" fill="#4ade80" stroke="#14532d" stroke-width="1.2"/>
                <circle cx="13.5" cy="20" r="1.5" fill="#ecfccb"/>`,
            anh_dao: `
                <path d="M11 14 Q16 6 21 15" stroke="#15803d" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <circle cx="11" cy="20" r="5.5" fill="#991b1b" stroke="#450a0a" stroke-width="1.5"/>
                <circle cx="21" cy="21" r="5.2" fill="#e11d48" stroke="#450a0a" stroke-width="1.5"/>
                <circle cx="9.5" cy="18.2" r="1.4" fill="#fda4af"/>
                <circle cx="19.5" cy="19.2" r="1.3" fill="#fda4af"/>`,
            dau_tay: `
                <path d="M16 9 C22 9 25 15 22 22 C20 26 17.5 28 16 28 C14.5 28 12 26 10 22 C7 15 10 9 16 9 Z" fill="#fb7185" stroke="#881337" stroke-width="1.5"/>
                <path d="M11 10 L16 6 L21 10 L16 12 Z" fill="#16a34a" stroke="#14532d" stroke-width="1.1"/>
                <circle cx="13" cy="16" r="1.1" fill="#fef08a"/><circle cx="19" cy="16" r="1.1" fill="#fef08a"/>
                <circle cx="16" cy="20" r="1.1" fill="#fef08a"/><circle cx="14" cy="23.5" r="1" fill="#fef08a"/>
                <circle cx="18" cy="23.5" r="1" fill="#fef08a"/>`,
            nam_linh_chi: `
                <path d="M8 18 Q16 6 24 18 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
                <rect x="13" y="18" width="6" height="8.5" rx="2.5" fill="#fef3c7" stroke="#92400e" stroke-width="1.4"/>
                <circle cx="13" cy="13.5" r="1.8" fill="#fecaca"/>
                <circle cx="19" cy="14" r="1.5" fill="#fecaca"/>
                <circle cx="16" cy="10.5" r="1.2" fill="#ffffff"/>`,
            khoai_tay: `
                <ellipse cx="16" cy="17" rx="9" ry="7.2" transform="rotate(-15 16 17)" fill="#d97706" stroke="#78350f" stroke-width="1.6"/>
                <ellipse cx="14" cy="15" rx="4.5" ry="2.5" transform="rotate(-15 14 15)" fill="#fbbf24" opacity="0.65"/>
                <circle cx="12" cy="16" r="1.2" fill="#581c87"/><circle cx="19" cy="15" r="1.2" fill="#581c87"/>
                <path d="M19 13 Q22 9 24 11" stroke="#4ade80" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
            carrot: `
                <path d="M16 10 C20 10 21 15 16 28 C11 15 12 10 16 10 Z" fill="#f97316" stroke="#9a3412" stroke-width="1.5"/>
                <path d="M16 10 Q11 5 9 8 M16 10 Q16 4 17 5 M16 10 Q21 5 23 8" stroke="#16a34a" stroke-width="1.7" fill="none" stroke-linecap="round"/>
                <line x1="14" y1="15" x2="18" y2="15" stroke="#fdba74" stroke-width="1.2"/>
                <line x1="14.5" y1="19" x2="17.5" y2="19" stroke="#fdba74" stroke-width="1.2"/>`,
            tomato: `
                <circle cx="16" cy="18" r="7.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.6"/>
                <path d="M11 12 L16 15 L21 12 L17.5 10.5 L16 7 L14.5 10.5 Z" fill="#22c55e" stroke="#14532d" stroke-width="1.1"/>
                <circle cx="13" cy="16.5" r="1.5" fill="#fca5a5"/>`,
            rice: `
                <ellipse cx="16" cy="17" rx="4.2" ry="9" transform="rotate(20 16 17)" fill="#facc15" stroke="#854d0e" stroke-width="1.5"/>
                <path d="M19 8 L23 4" stroke="#a16207" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M12.5 22 L19.5 14" stroke="#fef08a" stroke-width="1.3" stroke-linecap="round"/>`,
            bap_ngo: `
                <ellipse cx="16" cy="16" rx="5.5" ry="8.5" fill="#fde047" stroke="#a16207" stroke-width="1.4"/>
                <path d="M9 14 Q10 26 16 27 Q13 20 9 14 Z" fill="#22c55e" stroke="#14532d" stroke-width="1.2"/>
                <path d="M23 14 Q22 26 16 27 Q19 20 23 14 Z" fill="#4ade80" stroke="#14532d" stroke-width="1.2"/>
                <circle cx="14.5" cy="13" r="1.1" fill="#ca8a04"/><circle cx="17.5" cy="13" r="1.1" fill="#ca8a04"/>
                <circle cx="16" cy="17" r="1.1" fill="#ca8a04"/>`,
            sunflower: `
                <path d="M16 6 C21 12 22 19 20 24 C18 27 14 27 12 24 C10 19 11 12 16 6 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
                <path d="M16 7.5 L16 25.5" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
                <path d="M13 13 L13 23 M19 13 L19 23" stroke="#cbd5e1" stroke-width="1.1" stroke-linecap="round"/>`,
            dua_mat: `
                <path d="M11 11 L13 5 L16 9 L19 5 L21 11 Z" fill="#16a34a" stroke="#14532d" stroke-width="1.2"/>
                <ellipse cx="16" cy="19" rx="6.8" ry="8" fill="#eab308" stroke="#854d0e" stroke-width="1.5"/>
                <path d="M11 16 L21 22 M11 22 L21 16" stroke="#a16207" stroke-width="1.2"/>`,
            nho_tim: `
                <path d="M16 6 Q19 4 21 7" stroke="#22c55e" stroke-width="1.6" fill="none" stroke-linecap="round"/>
                <circle cx="12.5" cy="15" r="4.2" fill="#9333ea" stroke="#4c1d95" stroke-width="1.3"/>
                <circle cx="19.5" cy="15" r="4.2" fill="#a855f7" stroke="#4c1d95" stroke-width="1.3"/>
                <circle cx="16" cy="21" r="4.5" fill="#7e22ce" stroke="#4c1d95" stroke-width="1.3"/>
                <circle cx="11.5" cy="13.8" r="1.1" fill="#e9d5ff"/>`,
            watermelon: `
                <path d="M16 7 C21 12 22 20 19.5 25 C18 27 14 27 12.5 25 C10 20 11 12 16 7 Z" fill="#16a34a" stroke="#052e16" stroke-width="1.5"/>
                <path d="M16 9 C18 15 18 21 16 25" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
                <circle cx="13.5" cy="18" r="1.1" fill="#0f172a"/><circle cx="18.5" cy="18" r="1.1" fill="#0f172a"/>`,
            bi_ngo: `
                <ellipse cx="16" cy="17" rx="8.5" ry="6.5" fill="#fffbeb" stroke="#c2410c" stroke-width="1.6"/>
                <ellipse cx="16" cy="17" rx="4.2" ry="6.2" fill="#fed7aa" stroke="#ea580c" stroke-width="1.2"/>
                <path d="M16 7 L17.5 11 L14.5 11 Z" fill="#16a34a" stroke="#14532d" stroke-width="1"/>`,
            lucky_tree: `
                <polygon points="16,5 19,12 27,13 21,18 22.5,26 16,22 9.5,26 11,18 5,13 13,12" fill="#f472b6" stroke="#9d174d" stroke-width="1.5"/>
                <circle cx="16" cy="16" r="3.6" fill="#fef08a" stroke="#b45309" stroke-width="1.2"/>
                <circle cx="24" cy="8" r="1.4" fill="#fde047"/>`
        };
        const art = seedArt[seedId] || seedArt.rau_mam;
        return `<svg viewBox="0 0 32 32" class="${sizeClass} drop-shadow-xs flex-shrink-0">${art}</svg>`;
    }

    // ==========================================
    // VƯỜN CÂY 4D SIÊU THỰC (CLASSIC GRID + 4D GRAPHICS)
    // ==========================================
    getCropSvg(cropId, progress) {
        if (progress < 40) {
            return `
                <svg viewBox="0 0 64 64" class="w-12 h-12 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                    <defs>
                        <linearGradient id="sproutGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#bef264"/>
                            <stop offset="100%" stop-color="#15803d"/>
                        </linearGradient>
                    </defs>
                    <ellipse cx="32" cy="54" rx="14" ry="4" fill="rgba(0,0,0,0.35)"/>
                    <path d="M32 54 Q30 40 32 30" stroke="#16a34a" stroke-width="4" fill="none" stroke-linecap="round"/>
                    <path d="M32 36 Q16 24 14 34 Q22 44 32 36 Z" fill="url(#sproutGrad)" stroke="#14532d" stroke-width="1"/>
                    <path d="M32 33 Q48 20 50 31 Q42 41 32 33 Z" fill="url(#sproutGrad)" stroke="#14532d" stroke-width="1"/>
                    <circle cx="24" cy="31" r="1.8" fill="#ffffff" opacity="0.7"/>
                </svg>`;
        }

        if (progress < 100) {
            return `
                <svg viewBox="0 0 64 64" class="w-13 h-13 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                    <defs>
                        <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#86efac"/>
                            <stop offset="100%" stop-color="#15803d"/>
                        </linearGradient>
                    </defs>
                    <ellipse cx="32" cy="55" rx="18" ry="5" fill="rgba(0,0,0,0.4)"/>
                    <path d="M32 55 L32 24" stroke="#166534" stroke-width="4.5" stroke-linecap="round"/>
                    <path d="M32 45 Q10 34 12 46 Q22 52 32 45 Z" fill="#16a34a"/>
                    <path d="M32 44 Q54 33 52 45 Q42 51 32 44 Z" fill="#16a34a"/>
                    <path d="M32 34 Q14 16 18 32 Q25 38 32 34 Z" fill="url(#leafGrad)"/>
                    <path d="M32 32 Q50 15 46 31 Q39 37 32 32 Z" fill="url(#leafGrad)"/>
                    <circle cx="32" cy="22" r="5" fill="#fde047" stroke="#ca8a04" stroke-width="1.2"/>
                </svg>`;
        }

        // Cây trưởng thành 4D chi tiết riêng cho tất cả 15 loại hạt giống (từ nhỏ đến to)
        switch (cropId) {
            case 'rau_mam':
                return `
                    <svg viewBox="0 0 64 64" class="w-12 h-12 drop-shadow-[0_4px_4px_rgba(0,0,0,0.45)]">
                        <ellipse cx="32" cy="54" rx="14" ry="4" fill="rgba(0,0,0,0.35)"/>
                        <path d="M26 53 Q24 42 22 36" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round"/>
                        <path d="M32 54 Q32 40 32 30" stroke="#15803d" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                        <path d="M38 53 Q40 42 42 36" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round"/>
                        <ellipse cx="18" cy="34" rx="6" ry="3.5" transform="rotate(-25 18 34)" fill="#86efac" stroke="#15803d" stroke-width="1"/>
                        <ellipse cx="32" cy="27" rx="7" ry="4" fill="#4ade80" stroke="#166534" stroke-width="1.2"/>
                        <ellipse cx="46" cy="34" rx="6" ry="3.5" transform="rotate(25 46 34)" fill="#bef264" stroke="#15803d" stroke-width="1"/>
                    </svg>`;
            case 'anh_dao':
                return `
                    <svg viewBox="0 0 64 64" class="w-13 h-13 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                        <ellipse cx="32" cy="56" rx="15" ry="4.5" fill="rgba(0,0,0,0.35)"/>
                        <path d="M32 18 Q24 28 22 38" stroke="#65a30d" stroke-width="2.8" fill="none" stroke-linecap="round"/>
                        <path d="M32 18 Q40 28 42 40" stroke="#65a30d" stroke-width="2.8" fill="none" stroke-linecap="round"/>
                        <path d="M32 18 Q42 12 48 20 Q40 24 32 18 Z" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                        <circle cx="22" cy="42" r="9" fill="#e11d48" stroke="#881337" stroke-width="1.4"/>
                        <circle cx="42" cy="44" r="9" fill="#be123c" stroke="#881337" stroke-width="1.4"/>
                        <circle cx="19" cy="39" r="2.5" fill="#fecdd3" opacity="0.85"/>
                        <circle cx="39" cy="41" r="2.5" fill="#fecdd3" opacity="0.85"/>
                    </svg>`;
            case 'dau_tay':
                return `
                    <svg viewBox="0 0 64 64" class="w-13 h-13 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                        <ellipse cx="32" cy="56" rx="16" ry="4.5" fill="rgba(0,0,0,0.4)"/>
                        <path d="M32 54 L32 34" stroke="#15803d" stroke-width="3.5"/>
                        <path d="M22 25 Q32 22 42 25 Q46 38 32 52 Q18 38 22 25 Z" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
                        <path d="M22 24 L28 20 L32 25 L36 20 L42 24 L32 28 Z" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                        <circle cx="27" cy="33" r="1.3" fill="#fef08a"/><circle cx="36" cy="32" r="1.3" fill="#fef08a"/>
                        <circle cx="31" cy="39" r="1.3" fill="#fef08a"/><circle cx="36" cy="43" r="1.3" fill="#fef08a"/>
                        <circle cx="28" cy="44" r="1.3" fill="#fef08a"/>
                    </svg>`;
            case 'nam_linh_chi':
                return `
                    <svg viewBox="0 0 64 64" class="w-13 h-13 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                        <ellipse cx="32" cy="56" rx="17" ry="4.5" fill="rgba(0,0,0,0.4)"/>
                        <rect x="26" y="34" width="12" height="20" rx="4" fill="#fef3c7" stroke="#92400e" stroke-width="1.5"/>
                        <path d="M13 36 Q15 16 32 16 Q49 16 51 36 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
                        <circle cx="24" cy="25" r="3.2" fill="#fef2f2"/>
                        <circle cx="38" cy="24" r="2.6" fill="#fef2f2"/>
                        <circle cx="32" cy="31" r="2.8" fill="#fef2f2"/>
                        <circle cx="43" cy="32" r="2" fill="#fef2f2"/>
                    </svg>`;
            case 'khoai_tay':
                return `
                    <svg viewBox="0 0 64 64" class="w-13 h-13 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                        <ellipse cx="32" cy="56" rx="18" ry="5" fill="rgba(0,0,0,0.4)"/>
                        <path d="M32 30 Q25 14 20 20 M32 30 Q35 12 42 18" stroke="#22c55e" stroke-width="3" fill="none" stroke-linecap="round"/>
                        <ellipse cx="26" cy="42" rx="13" ry="10" transform="rotate(-12 26 42)" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
                        <ellipse cx="41" cy="45" rx="11" ry="8.5" transform="rotate(14 41 45)" fill="#f59e0b" stroke="#78350f" stroke-width="1.5"/>
                        <circle cx="23" cy="39" r="1.4" fill="#78350f"/><circle cx="30" cy="44" r="1.4" fill="#78350f"/>
                        <circle cx="43" cy="43" r="1.3" fill="#78350f"/>
                    </svg>`;
            case 'carrot':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="56" rx="16" ry="4.5" fill="rgba(0,0,0,0.45)"/>
                        <path d="M32 28 Q22 10 18 18 Q26 24 32 28 Z" fill="#22c55e"/>
                        <path d="M32 28 Q32 6 35 16 Q35 22 32 28 Z" fill="#4ade80"/>
                        <path d="M32 28 Q44 10 46 19 Q38 25 32 28 Z" fill="#16a34a"/>
                        <path d="M22 28 Q32 23 42 28 L34 55 Q32 58 30 55 Z" fill="#f97316" stroke="#9a3412" stroke-width="1.4"/>
                        <path d="M26 32 L32 32 M28 39 L34 39" stroke="#fed7aa" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>`;
            case 'tomato':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="56" rx="18" ry="5" fill="rgba(0,0,0,0.4)"/>
                        <path d="M32 55 L32 20" stroke="#15803d" stroke-width="4" fill="none"/>
                        <path d="M32 36 Q18 28 16 36 M32 32 Q46 24 48 33" stroke="#16a34a" stroke-width="3" fill="none"/>
                        <circle cx="22" cy="40" r="9.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.2"/>
                        <circle cx="42" cy="38" r="9.5" fill="#dc2626" stroke="#991b1b" stroke-width="1.2"/>
                        <circle cx="32" cy="24" r="10.5" fill="#ef4444" stroke="#991b1b" stroke-width="1.2"/>
                        <circle cx="28" cy="20" r="2.6" fill="#ffffff" opacity="0.8"/>
                        <circle cx="19" cy="36" r="2" fill="#ffffff" opacity="0.75"/>
                        <path d="M30 14 L32 18 L35 14 L32 16 Z" fill="#22c55e"/>
                    </svg>`;
            case 'rice':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="56" rx="18" ry="5" fill="rgba(0,0,0,0.4)"/>
                        <path d="M24 55 Q20 34 14 20" stroke="#65a30d" stroke-width="3" fill="none"/>
                        <path d="M32 56 Q32 30 34 14" stroke="#65a30d" stroke-width="3.5" fill="none"/>
                        <path d="M40 55 Q45 35 50 20" stroke="#4d7c0f" stroke-width="3" fill="none"/>
                        <ellipse cx="14" cy="21" rx="4.5" ry="9" transform="rotate(-25 14 21)" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
                        <ellipse cx="34" cy="15" rx="5" ry="10" transform="rotate(8 34 15)" fill="#fde047" stroke="#ca8a04" stroke-width="1"/>
                        <ellipse cx="49" cy="21" rx="4.5" ry="9" transform="rotate(28 49 21)" fill="#eab308" stroke="#a16207" stroke-width="1"/>
                        <circle cx="33" cy="12" r="2" fill="#ffffff" opacity="0.75"/>
                    </svg>`;
            case 'bap_ngo':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="56" rx="16" ry="4.5" fill="rgba(0,0,0,0.4)"/>
                        <ellipse cx="32" cy="30" rx="8.5" ry="17" fill="#facc15" stroke="#a16207" stroke-width="1.4"/>
                        <path d="M26 22 H38 M25 28 H39 M25 34 H39 M27 40 H37" stroke="#eab308" stroke-width="1.2"/>
                        <path d="M32 16 V44" stroke="#ca8a04" stroke-width="1" opacity="0.6"/>
                        <path d="M23 32 Q18 46 32 54 Q29 41 23 32 Z" fill="#22c55e" stroke="#14532d" stroke-width="1.2"/>
                        <path d="M41 32 Q46 46 32 54 Q35 41 41 32 Z" fill="#16a34a" stroke="#14532d" stroke-width="1.2"/>
                    </svg>`;
            case 'sunflower':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="56" rx="16" ry="4.5" fill="rgba(0,0,0,0.4)"/>
                        <path d="M32 56 L32 26" stroke="#15803d" stroke-width="5" stroke-linecap="round"/>
                        <path d="M32 44 Q16 36 18 46 Q25 50 32 44 Z" fill="#22c55e"/>
                        <path d="M32 42 Q48 34 46 44 Q39 48 32 42 Z" fill="#16a34a"/>
                        <g transform="translate(32,23)">
                            ${[0,30,60,90,120,150,180,210,240,270,300,330].map(deg =>
                                `<ellipse rx="4.5" ry="12" transform="rotate(${deg}) translate(0,-10)" fill="${deg % 60 === 0 ? '#facc15' : '#f59e0b'}" stroke="#ca8a04" stroke-width="0.6"/>`
                            ).join('')}
                            <circle r="9.5" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
                            <circle cx="-3" cy="-3" r="2.2" fill="#fef08a" opacity="0.45"/>
                        </g>
                    </svg>`;
            case 'dua_mat':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="56" rx="16" ry="4.5" fill="rgba(0,0,0,0.4)"/>
                        <path d="M32 24 L22 10 L30 18 L32 6 L34 18 L42 10 Z" fill="#16a34a" stroke="#14532d" stroke-width="1.2"/>
                        <ellipse cx="32" cy="39" rx="12" ry="15" fill="#f59e0b" stroke="#92400e" stroke-width="1.5"/>
                        <path d="M23 32 L38 46 M26 27 L41 40 M38 28 L23 43 M41 34 L27 49" stroke="#b45309" stroke-width="1.3"/>
                        <ellipse cx="27" cy="33" rx="2.5" ry="4" fill="#fde047" opacity="0.5"/>
                    </svg>`;
            case 'nho_tim':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="56" rx="16" ry="4.5" fill="rgba(0,0,0,0.4)"/>
                        <path d="M32 10 V20" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
                        <path d="M32 16 Q44 10 46 18 Q39 22 32 16 Z" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                        <circle cx="24" cy="26" r="6" fill="#9333ea" stroke="#581c87" stroke-width="1.2"/>
                        <circle cx="33" cy="25" r="6" fill="#a855f7" stroke="#581c87" stroke-width="1.2"/>
                        <circle cx="41" cy="27" r="5.8" fill="#7e22ce" stroke="#581c87" stroke-width="1.2"/>
                        <circle cx="27" cy="35" r="6" fill="#a855f7" stroke="#581c87" stroke-width="1.2"/>
                        <circle cx="36" cy="35" r="6" fill="#9333ea" stroke="#581c87" stroke-width="1.2"/>
                        <circle cx="32" cy="44" r="6" fill="#7e22ce" stroke="#581c87" stroke-width="1.2"/>
                        <circle cx="30" cy="42" r="1.8" fill="#e9d5ff" opacity="0.8"/>
                    </svg>`;
            case 'watermelon':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="55" rx="20" ry="6" fill="rgba(0,0,0,0.45)"/>
                        <ellipse cx="32" cy="39" rx="18" ry="15" fill="#16a34a" stroke="#052e16" stroke-width="1.5"/>
                        <path d="M22 27 Q18 39 22 51 M32 24 Q30 39 32 54 M42 27 Q46 39 42 51" stroke="#064e3b" stroke-width="2.5" fill="none"/>
                        <ellipse cx="25" cy="32" rx="4" ry="2.2" transform="rotate(-20 25 32)" fill="#ffffff" opacity="0.65"/>
                        <path d="M32 24 Q34 15 40 17" stroke="#15803d" stroke-width="2.5" fill="none"/>
                    </svg>`;
            case 'bi_ngo':
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)]">
                        <ellipse cx="32" cy="56" rx="20" ry="5.5" fill="rgba(0,0,0,0.45)"/>
                        <path d="M32 24 Q33 13 38 14" stroke="#15803d" stroke-width="4" fill="none" stroke-linecap="round"/>
                        <ellipse cx="22" cy="39" rx="11" ry="14" fill="#ea580c" stroke="#7c2d12" stroke-width="1.4"/>
                        <ellipse cx="42" cy="39" rx="11" ry="14" fill="#ea580c" stroke="#7c2d12" stroke-width="1.4"/>
                        <ellipse cx="32" cy="39" rx="10.5" ry="15" fill="#f97316" stroke="#9a3412" stroke-width="1.4"/>
                        <ellipse cx="28" cy="33" rx="3" ry="5" fill="#fed7aa" opacity="0.55"/>
                    </svg>`;
            case 'lucky_tree':
            default:
                return `
                    <svg viewBox="0 0 64 64" class="w-14 h-14 drop-shadow-[0_6px_8px_rgba(236,72,153,0.65)]">
                        <ellipse cx="32" cy="56" rx="16" ry="5" fill="rgba(0,0,0,0.4)"/>
                        <path d="M32 56 Q29 40 32 30" stroke="#78350f" stroke-width="5.5" stroke-linecap="round"/>
                        <circle cx="24" cy="28" r="11" fill="#ec4899" stroke="#9d174d" stroke-width="1.2"/>
                        <circle cx="40" cy="28" r="11" fill="#db2777" stroke="#9d174d" stroke-width="1.2"/>
                        <circle cx="32" cy="20" r="13" fill="#f472b6" stroke="#9d174d" stroke-width="1.2"/>
                        <polygon points="32,12 36,18 32,24 28,18" fill="#38bdf8" stroke="#ffffff" stroke-width="1"/>
                        <circle cx="22" cy="24" r="2.5" fill="#fef08a"/>
                        <circle cx="42" cy="25" r="2.5" fill="#fef08a"/>
                    </svg>`;
        }
    }

    // ==========================================
    // HÌNH MINH HỌA NGHỆ THUẬT CHO 15 LOẠI BÁNH NƯỚNG (BẾP BÁNH)
    // ==========================================
    getCakeSvg(recipeId, sizeClass = 'w-10 h-10') {
        switch (recipeId) {
            case 'cake_rau_mam':
                // Bánh Mầm Thanh Mát: Matcha cupcake with green cream swirl & fresh sprout
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="crm_cup" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stop-color="#b45309"/>
                                <stop offset="50%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#b45309"/>
                            </linearGradient>
                            <linearGradient id="crm_cream" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#86efac"/>
                                <stop offset="100%" stop-color="#15803d"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.2)"/>
                        <path d="M18 36 L22 54 C22 56 42 56 42 54 L46 36 Z" fill="url(#crm_cup)" stroke="#78350f" stroke-width="1.5"/>
                        <path d="M26 36 L28 54 M32 36 L32 55 M38 36 L36 54" stroke="#78350f" stroke-width="1" opacity="0.6"/>
                        <ellipse cx="32" cy="36" rx="15" ry="6" fill="#166534"/>
                        <path d="M20 35 Q24 25 32 25 Q40 25 44 35 Q38 38 32 37 Q26 38 20 35 Z" fill="url(#crm_cream)"/>
                        <path d="M25 28 Q29 20 32 20 Q36 20 39 28 Q35 30 32 30 Q29 30 25 28 Z" fill="#bbf7d0"/>
                        <circle cx="32" cy="18" r="3" fill="#86efac"/>
                        <path d="M32 18 Q31 10 32 7" stroke="#15803d" stroke-width="2" fill="none" stroke-linecap="round"/>
                        <path d="M32 9 Q26 7 28 4 Q33 5 32 9 Z" fill="#4ade80" stroke="#166534" stroke-width="0.8"/>
                        <path d="M32 8 Q38 6 36 3 Q31 5 32 8 Z" fill="#86efac" stroke="#166534" stroke-width="0.8"/>
                    </svg>`;

            case 'cake_anh_dao':
                // Bánh Tart Anh Đào: Fluted golden pastry tart filled with glossy cherries
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cad_crust" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fcd34d"/>
                                <stop offset="100%" stop-color="#b45309"/>
                            </linearGradient>
                            <linearGradient id="cad_cherry" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#f87171"/>
                                <stop offset="50%" stop-color="#dc2626"/>
                                <stop offset="100%" stop-color="#7f1d1d"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.25)"/>
                        <path d="M12 38 L18 50 C22 54 42 54 46 50 L52 38 Q32 44 12 38 Z" fill="url(#cad_crust)" stroke="#78350f" stroke-width="1.5"/>
                        <ellipse cx="32" cy="38" rx="18" ry="7" fill="#991b1b"/>
                        <ellipse cx="32" cy="37" rx="16" ry="5" fill="#dc2626"/>
                        <ellipse cx="32" cy="36" rx="8" ry="3.5" fill="#fffbeb"/>
                        <circle cx="27" cy="30" r="5.5" fill="url(#cad_cherry)" stroke="#7f1d1d" stroke-width="0.8"/>
                        <circle cx="25.5" cy="28.5" r="1.5" fill="#ffffff" opacity="0.8"/>
                        <circle cx="36" cy="28" r="5.5" fill="url(#cad_cherry)" stroke="#7f1d1d" stroke-width="0.8"/>
                        <circle cx="34.5" cy="26.5" r="1.5" fill="#ffffff" opacity="0.8"/>
                        <path d="M27 25 Q28 14 33 10" stroke="#15803d" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                        <path d="M36 23 Q34 14 33 10" stroke="#15803d" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                        <path d="M33 10 Q38 8 40 11 Q36 13 33 10 Z" fill="#22c55e"/>
                    </svg>`;

            case 'cake_dau_tay':
                // Bánh Mousse Dâu Tây: 3-layer pink strawberry cake slice with fresh strawberry
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cdt_straw" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#fb7185"/>
                                <stop offset="60%" stop-color="#e11d48"/>
                                <stop offset="100%" stop-color="#881337"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M12 42 L32 52 L52 42 L52 47 L32 57 L12 47 Z" fill="#fde68a" stroke="#d97706" stroke-width="1"/>
                        <path d="M12 36 L32 46 L52 36 L52 42 L32 52 L12 42 Z" fill="#f472b6" stroke="#db2777" stroke-width="0.8"/>
                        <path d="M12 31 L32 41 L52 31 L52 36 L32 46 L12 36 Z" fill="#fdf2f8" stroke="#fbcfe8" stroke-width="0.8"/>
                        <polygon points="12,31 32,41 52,31 32,22" fill="#fb7185" stroke="#e11d48" stroke-width="1"/>
                        <ellipse cx="32" cy="30" rx="9" ry="4" fill="#ffffff" stroke="#fce7f3" stroke-width="1"/>
                        <path d="M32 20 Q26 23 28 32 Q32 37 32 37 Q32 37 36 32 Q38 23 32 20 Z" fill="url(#cdt_straw)" stroke="#9f1239" stroke-width="1"/>
                        <circle cx="30" cy="27" r="0.8" fill="#fef08a"/>
                        <circle cx="34" cy="27" r="0.8" fill="#fef08a"/>
                        <circle cx="32" cy="32" r="0.8" fill="#fef08a"/>
                        <path d="M32 20 Q28 17 26 18 Q29 21 32 20 Z" fill="#22c55e"/>
                        <path d="M32 20 Q36 17 38 18 Q35 21 32 20 Z" fill="#16a34a"/>
                        <circle cx="32" cy="19" r="1.2" fill="#15803d"/>
                    </svg>`;

            case 'cake_nam_linh_chi':
                // Bánh Nấm Nướng Phô Mai: Savory baked gratin pot bun with mushrooms & melted cheese
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cnl_bun" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fcd34d"/>
                                <stop offset="60%" stop-color="#b45309"/>
                                <stop offset="100%" stop-color="#78350f"/>
                            </linearGradient>
                            <linearGradient id="cnl_cheese" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#fef08a"/>
                                <stop offset="100%" stop-color="#eab308"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M14 36 C14 52 50 52 50 36 C50 32 14 32 14 36 Z" fill="url(#cnl_bun)" stroke="#78350f" stroke-width="1.5"/>
                        <path d="M16 35 Q20 39 25 36 Q30 42 35 37 Q40 40 44 36 Q48 35 48 34 C46 26 18 26 16 35 Z" fill="url(#cnl_cheese)" stroke="#ca8a04" stroke-width="1"/>
                        <ellipse cx="26" cy="30" rx="6" ry="3.5" fill="#92400e" stroke="#451a03" stroke-width="0.8"/>
                        <path d="M26 31 L26 34" stroke="#fde68a" stroke-width="2" stroke-linecap="round"/>
                        <ellipse cx="26" cy="29" rx="4" ry="1.8" fill="#b45309"/>
                        <ellipse cx="37" cy="28" rx="7" ry="4" fill="#78350f" stroke="#451a03" stroke-width="0.8"/>
                        <path d="M37 29 L38 33" stroke="#fde68a" stroke-width="2.2" stroke-linecap="round"/>
                        <ellipse cx="37" cy="27" rx="5" ry="2" fill="#9a3412"/>
                        <circle cx="21" cy="33" r="1.2" fill="#15803d"/>
                        <circle cx="32" cy="34" r="1.2" fill="#16a34a"/>
                        <circle cx="42" cy="31" r="1.2" fill="#15803d"/>
                    </svg>`;

            case 'cake_khoai_tay':
                // Bánh Khoai Tây Phô Mai: Crispy golden potato gratin cake with cheddar drizzle
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="ckt_potato" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fed7aa"/>
                                <stop offset="50%" stop-color="#ea580c"/>
                                <stop offset="100%" stop-color="#9a3412"/>
                            </linearGradient>
                            <linearGradient id="ckt_cheddar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fef08a"/>
                                <stop offset="100%" stop-color="#f59e0b"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="55" rx="19" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M15 36 C15 50 49 50 49 36 L49 30 C49 22 15 22 15 30 Z" fill="url(#ckt_potato)" stroke="#7c2d12" stroke-width="1.5"/>
                        <ellipse cx="32" cy="28" rx="17" ry="7" fill="#fb923c"/>
                        <ellipse cx="26" cy="27" rx="4" ry="2" fill="#9a3412" opacity="0.6"/>
                        <ellipse cx="38" cy="29" rx="5" ry="2.2" fill="#9a3412" opacity="0.6"/>
                        <path d="M16 29 Q22 36 24 43 Q26 33 30 31 Q34 40 37 45 Q40 33 48 30 Q45 25 32 25 Q19 25 16 29 Z" fill="url(#ckt_cheddar)" stroke="#d97706" stroke-width="1"/>
                        <circle cx="24" cy="44" r="1.5" fill="#f59e0b"/>
                        <circle cx="37" cy="46" r="1.8" fill="#f59e0b"/>
                        <rect x="24" y="24" width="3" height="1.5" rx="0.5" fill="#16a34a" transform="rotate(15 24 24)"/>
                        <rect x="32" y="23" width="3" height="1.5" rx="0.5" fill="#15803d" transform="rotate(-20 32 23)"/>
                        <rect x="37" y="26" width="3" height="1.5" rx="0.5" fill="#16a34a" transform="rotate(30 37 26)"/>
                    </svg>`;

            case 'cake_carrot':
                // Bánh Cà Rốt Hạnh Nhân Quế: Carrot cake with cream cheese frosting & mini marzipan carrot
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="ccr_base" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#c2410c"/>
                                <stop offset="100%" stop-color="#7c2d12"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="55" rx="19" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M16 34 L16 48 C16 53 48 53 48 48 L48 34 Z" fill="url(#ccr_base)" stroke="#451a03" stroke-width="1.5"/>
                        <ellipse cx="32" cy="34" rx="16" ry="6" fill="#ea580c"/>
                        <path d="M15 33 C15 38 20 40 23 37 C26 40 31 41 35 37 C39 41 45 38 49 33 C49 27 15 27 15 33 Z" fill="#fffbeb" stroke="#fef3c7" stroke-width="1"/>
                        <ellipse cx="32" cy="28" rx="16" ry="6" fill="#f8fafc"/>
                        <path d="M22 29 Q31 27 38 24 Q37 21 33 22 Q27 24 22 29 Z" fill="#ea580c" stroke="#9a3412" stroke-width="0.8"/>
                        <path d="M28 27 L27 25 M32 25 L31 23 M35 24 L34 22" stroke="#9a3412" stroke-width="0.8"/>
                        <path d="M37 23 Q42 21 44 19 M37 23 Q43 24 45 25 M37 23 Q41 26 43 28" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
                        <circle cx="20" cy="27" r="1.2" fill="#d97706"/>
                        <circle cx="25" cy="31" r="1" fill="#b45309"/>
                        <circle cx="42" cy="30" r="1.2" fill="#d97706"/>
                    </svg>`;

            case 'cake_tomato':
                // Bánh Pizza Cà Chua Thảo Mộc: Mini artisan pizza / tomato herb focaccia
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="ctm_crust" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fde047"/>
                                <stop offset="70%" stop-color="#d97706"/>
                                <stop offset="100%" stop-color="#92400e"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="54" rx="21" ry="6" fill="rgba(0,0,0,0.25)"/>
                        <path d="M11 38 C11 53 53 53 53 38 C53 26 11 26 11 38 Z" fill="url(#ctm_crust)" stroke="#78350f" stroke-width="1.8"/>
                        <ellipse cx="32" cy="37" rx="17" ry="8" fill="#dc2626"/>
                        <path d="M19 36 Q25 41 31 36 Q38 41 45 36 Q42 32 32 31 Q22 32 19 36 Z" fill="#fef08a" opacity="0.9"/>
                        <circle cx="24" cy="36" r="4.5" fill="#b91c1c" stroke="#f87171" stroke-width="0.8"/>
                        <circle cx="24" cy="36" r="2.5" fill="#ef4444"/>
                        <circle cx="39" cy="35" r="4.5" fill="#b91c1c" stroke="#f87171" stroke-width="0.8"/>
                        <circle cx="39" cy="35" r="2.5" fill="#ef4444"/>
                        <circle cx="31" cy="39" r="4" fill="#b91c1c" stroke="#f87171" stroke-width="0.8"/>
                        <path d="M32 31 Q36 27 34 25 Q30 26 32 31 Z" fill="#15803d"/>
                        <path d="M26 39 Q23 42 25 44 Q28 42 26 39 Z" fill="#16a34a"/>
                        <path d="M38 40 Q41 43 43 41 Q41 39 38 40 Z" fill="#22c55e"/>
                    </svg>`;

            case 'cake_rice':
                // Bánh Bông Lan Gạo Nếp Sữa: Pure white fluffy steamed rice cake with golden honey & sesame
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cr_sponge" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#ffffff"/>
                                <stop offset="60%" stop-color="#f1f5f9"/>
                                <stop offset="100%" stop-color="#e2e8f0"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="55" rx="19" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M14 36 C14 51 50 51 50 36 L50 28 C50 20 14 20 14 28 Z" fill="url(#cr_sponge)" stroke="#cbd5e1" stroke-width="1.5"/>
                        <ellipse cx="32" cy="27" rx="17" ry="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
                        <circle cx="23" cy="26" r="1.5" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.5"/>
                        <circle cx="30" cy="24" r="1.8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.5"/>
                        <circle cx="38" cy="26" r="1.6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.5"/>
                        <circle cx="33" cy="28" r="1.5" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.5"/>
                        <path d="M18 27 Q25 32 32 27 Q40 33 46 28" stroke="#f59e0b" stroke-width="2" fill="none" stroke-linecap="round"/>
                        <path d="M28 29 Q29 37 30 38" stroke="#f59e0b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                        <ellipse cx="26" cy="25" rx="1" ry="0.6" fill="#d97706" transform="rotate(30 26 25)"/>
                        <ellipse cx="36" cy="24" rx="1" ry="0.6" fill="#d97706" transform="rotate(-40 36 24)"/>
                        <ellipse cx="22" cy="28" rx="1" ry="0.6" fill="#d97706" transform="rotate(10 22 28)"/>
                        <ellipse cx="41" cy="28" rx="1" ry="0.6" fill="#d97706" transform="rotate(50 41 28)"/>
                        <ellipse cx="32" cy="29" rx="1" ry="0.6" fill="#d97706"/>
                    </svg>`;

            case 'cake_bap_ngo':
                // Bánh Ngô Nướng Bơ Mật: Golden sweet cornbread muffin with melting butter square
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cbn_corn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fef08a"/>
                                <stop offset="40%" stop-color="#facc15"/>
                                <stop offset="100%" stop-color="#ca8a04"/>
                            </linearGradient>
                            <linearGradient id="cbn_muffin" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stop-color="#ca8a04"/>
                                <stop offset="50%" stop-color="#eab308"/>
                                <stop offset="100%" stop-color="#ca8a04"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="55" rx="18" ry="4.5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M19 36 L23 52 C23 55 41 55 41 52 L45 36 Z" fill="url(#cbn_muffin)" stroke="#a16207" stroke-width="1.5"/>
                        <path d="M14 36 C13 26 51 26 50 36 C50 40 14 40 14 36 Z" fill="url(#cbn_corn)" stroke="#a16207" stroke-width="1.5"/>
                        <circle cx="21" cy="33" r="1.8" fill="#fde047" stroke="#ca8a04" stroke-width="0.6"/>
                        <circle cx="27" cy="31" r="2" fill="#fde047" stroke="#ca8a04" stroke-width="0.6"/>
                        <circle cx="38" cy="31" r="2" fill="#fde047" stroke="#ca8a04" stroke-width="0.6"/>
                        <circle cx="43" cy="34" r="1.8" fill="#fde047" stroke="#ca8a04" stroke-width="0.6"/>
                        <polygon points="28,24 35,21 38,25 31,28" fill="#fef08a" stroke="#eab308" stroke-width="1"/>
                        <polygon points="31,28 38,25 38,27 31,30" fill="#fde047" stroke="#eab308" stroke-width="0.8"/>
                        <path d="M26 27 Q31 31 35 29 Q37 34 38 37 Q34 32 29 30 Z" fill="#fde047" opacity="0.8"/>
                    </svg>`;

            case 'cake_sunflower':
                // Bánh Quy Hướng Dương Giòn: Flower-shaped sunflower butter cookie
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="csf_petal" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#fef08a"/>
                                <stop offset="50%" stop-color="#facc15"/>
                                <stop offset="100%" stop-color="#eab308"/>
                            </linearGradient>
                            <radialGradient id="csf_center" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#92400e"/>
                                <stop offset="70%" stop-color="#78350f"/>
                                <stop offset="100%" stop-color="#451a03"/>
                            </radialGradient>
                        </defs>
                        <ellipse cx="32" cy="54" rx="19" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <g fill="url(#csf_petal)" stroke="#b45309" stroke-width="1">
                            <circle cx="32" cy="18" r="7"/>
                            <circle cx="43" cy="23" r="7"/>
                            <circle cx="46" cy="35" r="7"/>
                            <circle cx="41" cy="45" r="7"/>
                            <circle cx="32" cy="48" r="7"/>
                            <circle cx="23" cy="45" r="7"/>
                            <circle cx="18" cy="35" r="7"/>
                            <circle cx="21" cy="23" r="7"/>
                        </g>
                        <circle cx="32" cy="33" r="14" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/>
                        <circle cx="32" cy="33" r="9" fill="url(#csf_center)" stroke="#451a03" stroke-width="1"/>
                        <ellipse cx="32" cy="28" rx="1.5" ry="3" fill="#fde047" stroke="#a16207" stroke-width="0.5"/>
                        <ellipse cx="36" cy="31" rx="3" ry="1.5" fill="#fde047" stroke="#a16207" stroke-width="0.5"/>
                        <ellipse cx="32" cy="37" rx="1.5" ry="3" fill="#fde047" stroke="#a16207" stroke-width="0.5"/>
                        <ellipse cx="28" cy="33" rx="3" ry="1.5" fill="#fde047" stroke="#a16207" stroke-width="0.5"/>
                        <circle cx="32" cy="33" r="1.5" fill="#fef08a"/>
                    </svg>`;

            case 'cake_dua_mat':
                // Bánh Dứa Nướng Hoàng Gia: Caramelized pineapple upside-down cake ring with cherry
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cdm_cake" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fef08a"/>
                                <stop offset="60%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#b45309"/>
                            </linearGradient>
                            <radialGradient id="cdm_pineapple" cx="50%" cy="50%" r="50%">
                                <stop offset="40%" stop-color="#facc15"/>
                                <stop offset="100%" stop-color="#d97706"/>
                            </radialGradient>
                        </defs>
                        <ellipse cx="32" cy="55" rx="19" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M14 36 C14 51 50 51 50 36 L50 28 C50 20 14 20 14 28 Z" fill="url(#cdm_cake)" stroke="#92400e" stroke-width="1.5"/>
                        <ellipse cx="32" cy="28" rx="17" ry="8" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/>
                        <ellipse cx="32" cy="28" rx="13" ry="6" fill="url(#cdm_pineapple)" stroke="#b45309" stroke-width="1"/>
                        <path d="M22 28 Q24 25 27 28 M37 28 Q40 25 42 28 M29 23 Q32 25 35 23 M29 32 Q32 30 35 32" stroke="#92400e" stroke-width="0.8" fill="none"/>
                        <ellipse cx="32" cy="28" rx="5" ry="2.5" fill="#78350f"/>
                        <circle cx="32" cy="27" r="4" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.8"/>
                        <circle cx="31" cy="25.5" r="1.2" fill="#ffffff" opacity="0.8"/>
                        <path d="M19 33 Q21 41 23 43 Q25 36 29 34 Q32 44 35 46 Q38 35 44 34" stroke="#b45309" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                    </svg>`;

            case 'cake_nho_tim':
                // Bánh Tart Nho Tím Men Rượu: Regal purple wine grape tart with glossy grapes & cream
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cnt_crust" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fde047"/>
                                <stop offset="100%" stop-color="#a16207"/>
                            </linearGradient>
                            <radialGradient id="cnt_grape" cx="35%" cy="35%" r="65%">
                                <stop offset="0%" stop-color="#c084fc"/>
                                <stop offset="40%" stop-color="#9333ea"/>
                                <stop offset="100%" stop-color="#4c1d95"/>
                            </radialGradient>
                        </defs>
                        <ellipse cx="32" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M12 38 L18 50 C22 54 42 54 46 50 L52 38 Q32 44 12 38 Z" fill="url(#cnt_crust)" stroke="#78350f" stroke-width="1.5"/>
                        <ellipse cx="32" cy="38" rx="18" ry="7" fill="#581c87"/>
                        <ellipse cx="32" cy="37" rx="16" ry="5" fill="#7e22ce"/>
                        <circle cx="24" cy="35" r="4.5" fill="url(#cnt_grape)" stroke="#3b0764" stroke-width="0.8"/>
                        <circle cx="23" cy="33.5" r="1.2" fill="#ffffff" opacity="0.7"/>
                        <circle cx="32" cy="33" r="5" fill="url(#cnt_grape)" stroke="#3b0764" stroke-width="0.8"/>
                        <circle cx="31" cy="31" r="1.3" fill="#ffffff" opacity="0.8"/>
                        <circle cx="40" cy="35" r="4.5" fill="url(#cnt_grape)" stroke="#3b0764" stroke-width="0.8"/>
                        <circle cx="39" cy="33.5" r="1.2" fill="#ffffff" opacity="0.7"/>
                        <circle cx="28" cy="27" r="4.5" fill="url(#cnt_grape)" stroke="#3b0764" stroke-width="0.8"/>
                        <circle cx="27" cy="25.5" r="1.2" fill="#ffffff" opacity="0.8"/>
                        <circle cx="36" cy="27" r="4.5" fill="url(#cnt_grape)" stroke="#3b0764" stroke-width="0.8"/>
                        <circle cx="35" cy="25.5" r="1.2" fill="#ffffff" opacity="0.8"/>
                        <path d="M32 24 Q32 18 36 15" stroke="#15803d" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                        <path d="M35 17 Q40 16 38 13 Q34 14 35 17 Z" fill="#22c55e"/>
                        <circle cx="19" cy="38" r="3" fill="#fffbeb" stroke="#f3e8ff" stroke-width="0.8"/>
                        <circle cx="45" cy="38" r="3" fill="#fffbeb" stroke="#f3e8ff" stroke-width="0.8"/>
                    </svg>`;

            case 'cake_watermelon':
                // Bánh Thạch Dưa Hấu Mát Lạnh: Translucent multi-layered watermelon jelly cake
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cwm_red" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fb7185"/>
                                <stop offset="70%" stop-color="#f43f5e"/>
                                <stop offset="100%" stop-color="#be123c"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="55" rx="19" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M14 43 L32 53 L50 43 L50 48 C50 52 14 52 14 48 Z" fill="#15803d" stroke="#14532d" stroke-width="1.2"/>
                        <path d="M14 39 L32 49 L50 39 L50 43 L32 53 L14 43 Z" fill="#bbf7d0" stroke="#86efac" stroke-width="0.8"/>
                        <path d="M14 28 L32 38 L50 28 L50 39 L32 49 L14 39 Z" fill="url(#cwm_red)" stroke="#9f1239" stroke-width="1.2"/>
                        <polygon points="14,28 32,38 50,28 32,18" fill="#fda4af" stroke="#f43f5e" stroke-width="1"/>
                        <polygon points="18,28 32,35 46,28 32,21" fill="#fb7185" opacity="0.6"/>
                        <ellipse cx="25" cy="32" rx="1.2" ry="2" fill="#1e1b4b" transform="rotate(-15 25 32)"/>
                        <ellipse cx="34" cy="33" rx="1.2" ry="2" fill="#1e1b4b" transform="rotate(20 34 33)"/>
                        <ellipse cx="38" cy="27" rx="1.2" ry="2" fill="#1e1b4b" transform="rotate(-25 38 27)"/>
                        <ellipse cx="28" cy="25" rx="1.2" ry="2" fill="#1e1b4b" transform="rotate(15 28 25)"/>
                        <ellipse cx="43" cy="33" rx="1" ry="1.8" fill="#1e1b4b" transform="rotate(10 43 33)"/>
                        <path d="M32 20 Q28 15 30 13 Q34 16 32 20 Z" fill="#22c55e"/>
                        <path d="M32 20 Q36 16 35 13 Q31 15 32 20 Z" fill="#16a34a"/>
                    </svg>`;

            case 'cake_bi_ngo':
                // Bánh Pie Bí Ngô Mùa Lễ Hội: Spiced autumn pumpkin pie with fluted crust & cream star
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="cbp_crust" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fde047"/>
                                <stop offset="60%" stop-color="#d97706"/>
                                <stop offset="100%" stop-color="#92400e"/>
                            </linearGradient>
                            <linearGradient id="cbp_pumpkin" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#fb923c"/>
                                <stop offset="50%" stop-color="#ea580c"/>
                                <stop offset="100%" stop-color="#9a3412"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="55" rx="20" ry="5" fill="rgba(0,0,0,0.2)"/>
                        <path d="M12 37 L17 49 C21 53 43 53 47 49 L52 37 Q32 43 12 37 Z" fill="url(#cbp_crust)" stroke="#78350f" stroke-width="1.5"/>
                        <ellipse cx="32" cy="36" rx="19" ry="8" fill="#d97706" stroke="#92400e" stroke-width="1.2"/>
                        <ellipse cx="32" cy="36" rx="16" ry="6.5" fill="url(#cbp_pumpkin)"/>
                        <path d="M22 36 Q27 39 33 36 Q38 34 42 36" stroke="#78350f" stroke-width="1" fill="none" opacity="0.6"/>
                        <path d="M32 23 Q29 27 26 31 Q32 30 32 33 Q32 30 38 31 Q35 27 32 23 Z" fill="#ffffff" stroke="#fef3c7" stroke-width="0.8"/>
                        <circle cx="32" cy="27" r="4" fill="#ffffff"/>
                        <circle cx="32" cy="25" r="2" fill="#fffbeb"/>
                        <rect x="36" y="22" width="2" height="7" rx="0.8" fill="#78350f" transform="rotate(35 36 22)"/>
                    </svg>`;

            case 'cake_lucky':
                // Bánh Thần Tài Đại Phú Quý: Royal 2-tier palace cake crowned with blooming gold lotus & gold coins
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass} drop-shadow-md">
                        <defs>
                            <linearGradient id="clk_gold" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#fef08a"/>
                                <stop offset="40%" stop-color="#facc15"/>
                                <stop offset="80%" stop-color="#eab308"/>
                                <stop offset="100%" stop-color="#a16207"/>
                            </linearGradient>
                            <linearGradient id="clk_red" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#f43f5e"/>
                                <stop offset="50%" stop-color="#e11d48"/>
                                <stop offset="100%" stop-color="#881337"/>
                            </linearGradient>
                        </defs>
                        <ellipse cx="32" cy="56" rx="21" ry="5" fill="rgba(0,0,0,0.3)"/>
                        <path d="M13 40 L13 50 C13 55 51 55 51 50 L51 40 Z" fill="url(#clk_red)" stroke="#881337" stroke-width="1.2"/>
                        <ellipse cx="32" cy="40" rx="19" ry="6.5" fill="#e11d48"/>
                        <path d="M13 47 C20 52 44 52 51 47" stroke="url(#clk_gold)" stroke-width="2.5" fill="none"/>
                        <path d="M19 28 L19 38 C19 42 45 42 45 38 L45 28 Z" fill="url(#clk_gold)" stroke="#a16207" stroke-width="1.2"/>
                        <ellipse cx="32" cy="28" rx="13" ry="4.5" fill="#fef08a"/>
                        <path d="M32 26 Q24 22 25 16 Q29 20 32 26 Z" fill="#fbbf24" stroke="#d97706" stroke-width="0.8"/>
                        <path d="M32 26 Q40 22 39 16 Q35 20 32 26 Z" fill="#fbbf24" stroke="#d97706" stroke-width="0.8"/>
                        <path d="M32 26 Q28 17 32 12 Q36 17 32 26 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
                        <circle cx="21" cy="47" r="3" fill="url(#clk_gold)" stroke="#78350f" stroke-width="0.8"/>
                        <rect x="20" y="46" width="2" height="2" fill="#78350f"/>
                        <circle cx="43" cy="47" r="3" fill="url(#clk_gold)" stroke="#78350f" stroke-width="0.8"/>
                        <rect x="42" y="46" width="2" height="2" fill="#78350f"/>
                        <path d="M32 6 L33 9 L36 10 L33 11 L32 14 L31 11 L28 10 L31 9 Z" fill="#ffffff"/>
                        <path d="M44 18 L44.5 20 L46.5 20.5 L44.5 21 L44 23 L43.5 21 L41.5 20.5 L43.5 20 Z" fill="#fef08a"/>
                        <path d="M20 19 L20.5 21 L22.5 21.5 L20.5 22 L20 24 L19.5 22 L17.5 21.5 L19.5 21 Z" fill="#fef08a"/>
                    </svg>`;

            default:
                return `
                    <svg viewBox="0 0 64 64" class="${sizeClass}">
                        <circle cx="32" cy="32" r="20" fill="#f59e0b"/>
                    </svg>`;
        }
    }

    getNextUnlockableGlobalIndex() {
        return this.data.plots.findIndex(p => !p.unlocked);
    }

    getPlotExpansionGrant(globalIdx) {
        const plotNumber = globalIdx + 1;
        const granted = [];
        // Cứ mỗi 3 mảnh đất sẽ được thêm 1 cây gỗ (ô 3, 6, 9, 12...)
        if (plotNumber % 3 === 0) {
            granted.push('tree');
        }
        // Khi mở ô đất thứ 6 và cứ mỗi 6 ô đất sẽ lại được thêm 1 mỏ đá (ô 6, 12, 18, 24...)
        if (plotNumber % 6 === 0) {
            granted.push('stone');
        }
        // Cứ 10 lv đất mới có 1 mỏ sắt và vàng (ô 10, 20, 30, 40...)
        if (plotNumber % 10 === 0) {
            granted.push('iron');
            granted.push('gold_rock');
        }
        return granted;
    }

    syncInitialResourceNodesForSave() {
        const nodes = [
            { uid: 1, type: 'tree', harvestedAt: 0 },
            { uid: 2, type: 'tree', harvestedAt: 0 },
            { uid: 3, type: 'tree', harvestedAt: 0 },
            { uid: 4, type: 'stone', harvestedAt: 0 }
        ];
        let nextUid = 5;
        for (let i = 1; i < this.data.plots.length; i++) {
            if (this.data.plots[i].unlocked) {
                const granted = this.getPlotExpansionGrant(i);
                granted.forEach(type => {
                    nodes.push({ uid: nextUid++, type, harvestedAt: 0 });
                });
            }
        }
        this.data.resourceNodes = nodes;
        this.data.nextNodeUid = nextUid;
    }

    getPlotUnlockRequirements(globalIdx) {
        if (globalIdx == null || globalIdx < 0 || globalIdx >= 108) return null;
        const tier = Math.floor(globalIdx / 36) + 1;
        const tierSlot = (globalIdx % 36) + 1;
        const plotNumber = globalIdx + 1;
        const requiredLevel = plotNumber; // Ô thứ N cần Cấp Nhân Vật tối thiểu đạt Lv.N

        // Ô đất đầu tiên (globalIdx = 0, Ô thứ 1): Xem 2 quảng cáo để mở
        if (globalIdx === 0) {
            return {
                globalIdx: 0,
                plotNumber: 1,
                tier: 1,
                tierSlot: 1,
                isTierBreakthrough: false,
                requiredLevel: 1,
                requiredAds: 2,
                adsWatched: Math.min(2, Math.max(0, this.data.plot0AdsWatched || 0)),
                gold: 0,
                resources: [],
                crops: [],
                grantNodes: [],
                buildTimeLabel: 'Xem 2 quảng cáo'
            };
        }

        const isTierBreakthrough = globalIdx === 36 || globalIdx === 72;
        const grantNodes = this.getPlotExpansionGrant(globalIdx);

        // Chi phí Vàng khi mở mỗi 1 ô đất (Yêu cầu người dùng):
        // - Ô 2 đến 10: 100 Vàng
        // - Ô 11 đến 20: 300 Vàng
        // - Ô 21 đến 30: 500 Vàng
        // - Ô 31 đến 40: 700 Vàng
        // - Ô 41 đến 50: 1000 Vàng
        // - Ô 51 đến 70: 1500 Vàng
        // - Ô 71 đến 90: 1800 Vàng
        // - Ô 91 đến hết (108): 2500 Vàng
        let gold = 0;
        if (plotNumber >= 2 && plotNumber <= 10) {
            gold = 100;
        } else if (plotNumber >= 11 && plotNumber <= 20) {
            gold = 300;
        } else if (plotNumber >= 21 && plotNumber <= 30) {
            gold = 500;
        } else if (plotNumber >= 31 && plotNumber <= 40) {
            gold = 700;
        } else if (plotNumber >= 41 && plotNumber <= 50) {
            gold = 1000;
        } else if (plotNumber >= 51 && plotNumber <= 70) {
            gold = 1500;
        } else if (plotNumber >= 71 && plotNumber <= 90) {
            gold = 1800;
        } else if (plotNumber >= 91) {
            gold = 2500;
        }

        // Chi phí Cục Sắt (⚙️) & Cục Vàng (✨) khi mở mỗi ô đất theo quy luật:
        // - Ô 1 đến 9: 0 cục sắt, 0 cục vàng
        // - Ô 10 đến 15: 1 cục sắt + 1 cục vàng
        // - Ô 16 đến 20: 2 cục sắt + 2 cục vàng
        // - Ô 21 đến 25: 3 cục sắt + 3 cục vàng
        // - Ô 26 đến 30: 4 cục sắt + 4 cục vàng
        // - Ô 31 đến 35: 5 cục sắt + 5 cục vàng
        // - Ô 36 đến 40: 6 cục sắt + 6 cục vàng
        // - Ô 41 đến 45: 7 cục sắt + 7 cục vàng
        // - Ô 46 đến 50: 8 cục sắt + 8 cục vàng
        // - Ô 51 đến 55: 9 cục sắt + 9 cục vàng
        // - Ô 56 đến 60: 10 cục sắt + 10 cục vàng
        // - Cứ theo quy luật mỗi nhóm 5 ô tăng thêm +1 cục sắt & +1 cục vàng cho đến hết
        let oreQty = 0;
        if (plotNumber >= 10 && plotNumber <= 15) {
            oreQty = 1;
        } else if (plotNumber >= 16) {
            oreQty = Math.floor((plotNumber - 16) / 5) + 2;
        }
        const ironQty = oreQty;
        const goldOreQty = oreQty;

        const resources = [];
        const crops = [];

        if (tier === 1) {
            resources.push({ id: 'wood', qty: 2 + Math.floor(globalIdx * 0.65) });
            if (globalIdx >= 2) resources.push({ id: 'stone', qty: 1 + Math.floor((globalIdx - 1) * 0.5) });

            if (globalIdx >= 3) crops.push({ id: 'rau_mam', qty: Math.min(10, globalIdx - 1) });
            if (globalIdx >= 6) crops.push({ id: 'anh_dao', qty: Math.min(8, Math.ceil((globalIdx - 5) * 0.4)) });
            if (globalIdx >= 10) crops.push({ id: 'dau_tay', qty: Math.min(6, Math.ceil((globalIdx - 9) * 0.35)) });
            if (globalIdx >= 15) crops.push({ id: 'nam_linh_chi', qty: Math.min(5, Math.ceil((globalIdx - 14) * 0.3)) });
            if (globalIdx >= 21) crops.push({ id: 'khoai_tay', qty: Math.min(4, Math.ceil((globalIdx - 20) * 0.28)) });
            if (globalIdx >= 28) crops.push({ id: 'carrot', qty: Math.min(3, Math.ceil((globalIdx - 27) * 0.25)) });
        } else if (tier === 2) {
            const k = globalIdx - 36;
            resources.push({ id: 'wood', qty: 24 + k * 2 });
            resources.push({ id: 'stone', qty: 18 + Math.floor(k * 1.5) });

            crops.push({ id: 'carrot', qty: 3 + Math.floor(k * 0.15) });
            crops.push({ id: 'tomato', qty: 2 + Math.floor(k * 0.12) });
            crops.push({ id: 'rice', qty: 1 + Math.floor(k * 0.1) });
            if (k >= 12) crops.push({ id: 'bap_ngo', qty: 1 + Math.floor((k - 12) * 0.1) });
            if (k >= 24) crops.push({ id: 'sunflower', qty: 1 + Math.floor((k - 24) * 0.12) });
        } else {
            const k = globalIdx - 72;
            resources.push({ id: 'wood', qty: 75 + k * 3 });
            resources.push({ id: 'stone', qty: 55 + Math.floor(k * 2.5) });

            crops.push({ id: 'dua_mat', qty: 2 + Math.floor(k * 0.1) });
            crops.push({ id: 'nho_tim', qty: 2 + Math.floor(k * 0.08) });
            crops.push({ id: 'watermelon', qty: 1 + Math.floor(k * 0.08) });
            if (k >= 12) crops.push({ id: 'bi_ngo', qty: 1 + Math.floor((k - 12) * 0.08) });
            if (k >= 24) crops.push({ id: 'lucky_tree', qty: 1 + Math.floor((k - 24) * 0.08) });
        }

        if (ironQty > 0) {
            resources.push({ id: 'iron', qty: ironQty });
        }
        if (goldOreQty > 0) {
            resources.push({ id: 'gold_ore', qty: goldOreQty });
        }

        return {
            globalIdx,
            plotNumber,
            requiredLevel,
            tier,
            tierSlot,
            isTierBreakthrough,
            gold,
            resources,
            crops,
            grantNodes,
            buildTimeLabel: 'Mở ngay'
        };
    }

    // Tạo hình Mỏ Gỗ, Mỏ Đá, Mỏ Sắt, Mỏ Vàng đúng theo trình tự Ảnh 1, 2, 3, 4
    getResourceNodeSvg(nodeType, uid, isReady = true) {
        if (!isReady) {
            if (nodeType === 'tree') {
                return `
                    <svg viewBox="0 0 18 18" shape-rendering="crispEdges" class="w-9 h-9 opacity-85">
                        <ellipse cx="9" cy="14" rx="5.5" ry="2" fill="rgba(0,0,0,0.22)"/>
                        <rect x="6" y="10" width="6" height="4" fill="#6b4226"/>
                        <rect x="7" y="9" width="4" height="2" fill="#d9b07c"/>
                        <rect x="11" y="7" width="2" height="2" fill="#8ea148"/>
                    </svg>`;
            }
            return `
                <svg viewBox="0 0 18 16" shape-rendering="crispEdges" class="w-9 h-8 opacity-80">
                    <ellipse cx="9" cy="13" rx="6" ry="2" fill="rgba(0,0,0,0.22)"/>
                    <rect x="4" y="10" width="4" height="3" fill="#64748b"/>
                    <rect x="5" y="10" width="2" height="1" fill="#cbd5e1"/>
                    <rect x="10" y="9" width="4" height="4" fill="#475569"/>
                    <rect x="11" y="9" width="2" height="2" fill="#94a3b8"/>
                </svg>`;
        }

        // ẢNH 1: Mỏ Gỗ (Cây tán ô-liu tròn với 2 chỏm lá hai bên & thân ở giữa)
        if (nodeType === 'tree') {
            return `
                <svg viewBox="0 0 18 18" shape-rendering="crispEdges" class="w-10 h-10 drop-shadow-sm">
                    <rect x="5" y="15" width="8" height="1" fill="rgba(0,0,0,0.22)"/>
                    <!-- Viền tán cây xanh rêu đậm -->
                    <path d="M5 3h8v1h2v2h1v4h-1v1h1v2h-2v1h-2v1H6v-1H4v-1H2v-2h1v-1H2V6h1V4h2z" fill="#3f5221"/>
                    <!-- Khối lá xanh ô-liu trung gian -->
                    <path d="M5 4h8v1h1v4h-1v2H5V9H4V5h1z" fill="#6f8236"/>
                    <!-- Vòm lá sáng phía trên -->
                    <rect x="5" y="4" width="8" height="6" fill="#9bab4d"/>
                    <rect x="4" y="5" width="10" height="4" fill="#a8b85a"/>
                    <rect x="6" y="4" width="6" height="1" fill="#c2d072"/>
                    <rect x="5" y="9" width="8" height="1" fill="#c2d072"/>
                    <rect x="7" y="5" width="4" height="4" fill="#93a446"/>
                    <!-- Hai chỏm lá hai bên -->
                    <rect x="3" y="10" width="3" height="2" fill="#566b28"/>
                    <rect x="4" y="10" width="1" height="1" fill="#8ea148"/>
                    <rect x="12" y="10" width="3" height="2" fill="#566b28"/>
                    <rect x="13" y="10" width="1" height="1" fill="#8ea148"/>
                    <!-- Thân cây ở giữa -->
                    <rect x="7" y="10" width="4" height="5" fill="#5b6830"/>
                    <rect x="8" y="11" width="2" height="2" fill="#798744"/>
                </svg>`;
        }

        // Nền tảng Mỏ Đá (Ảnh 2) dùng chung cho Đá, Sắt (Ảnh 3), Vàng (Ảnh 4)
        const baseRock = `
            <rect x="3" y="13" width="12" height="1" fill="rgba(0,0,0,0.24)"/>
            <!-- Viền đá xanh-tím đậm -->
            <path d="M5 3h6v1h2v2h1v2h1v3h-1v2H3v-2H2V9h1V7h1V5h1z" fill="#262c44"/>
            <!-- Khối thân đá tối bên dưới -->
            <path d="M4 9h10v3H4z" fill="#5b6987"/>
            <!-- Mặt nghiêng bên trái -->
            <path d="M3 9h2V7h1v5H4v-1H3z" fill="#8d9db8"/>
            <!-- Mặt đá phẳng sáng trên đỉnh (Ảnh 2) -->
            <path d="M6 4h5v1h1v4H5V5h1z" fill="#cdd6e8"/>
            <rect x="6" y="4" width="4" height="1" fill="#e2e8f0"/>
            <rect x="7" y="8" width="4" height="1" fill="#b4c0d4"/>
        `;

        // ẢNH 2: Mỏ Đá
        if (nodeType === 'stone') {
            return `
                <svg viewBox="0 0 18 16" shape-rendering="crispEdges" class="w-10 h-9 drop-shadow-sm">
                    ${baseRock}
                </svg>`;
        }

        // ẢNH 3: Mỏ Sắt (Đá xanh-xám gắn các mạch quặng sắt cam-đỏ đồng)
        if (nodeType === 'iron') {
            return `
                <svg viewBox="0 0 18 16" shape-rendering="crispEdges" class="w-10 h-9 drop-shadow-sm">
                    ${baseRock}
                    <!-- Quặng sắt góc trên phải -->
                    <rect x="11" y="3" width="2" height="2" fill="#dc764b"/>
                    <rect x="10" y="4" width="3" height="2" fill="#c44d29"/>
                    <rect x="11" y="3" width="1" height="1" fill="#f29a6b"/>
                    <!-- Quặng sắt giữa mặt đá -->
                    <rect x="6" y="6" width="3" height="2" fill="#c44d29"/>
                    <rect x="7" y="6" width="2" height="1" fill="#e87a4d"/>
                    <rect x="6" y="8" width="2" height="1" fill="#8b2d12"/>
                    <!-- Quặng sắt góc dưới trái -->
                    <rect x="3" y="9" width="2" height="3" fill="#c44d29"/>
                    <rect x="3" y="9" width="1" height="2" fill="#e87a4d"/>
                    <rect x="4" y="11" width="1" height="1" fill="#8b2d12"/>
                    <!-- Quặng sắt cạnh đáy -->
                    <rect x="8" y="11" width="3" height="2" fill="#c44d29"/>
                    <rect x="9" y="11" width="2" height="1" fill="#f29a6b"/>
                </svg>`;
        }

        // ẢNH 4: Mỏ Vàng (Đá xanh-xám gắn các mạch quặng vàng rực)
        return `
            <svg viewBox="0 0 18 16" shape-rendering="crispEdges" class="w-10 h-9 drop-shadow-sm">
                ${baseRock}
                <!-- Quặng vàng góc trên phải -->
                <rect x="11" y="3" width="2" height="2" fill="#facc15"/>
                <rect x="10" y="4" width="3" height="2" fill="#eab308"/>
                <rect x="12" y="3" width="1" height="1" fill="#fef9c3"/>
                <!-- Quặng vàng giữa mặt đá -->
                <rect x="6" y="6" width="3" height="2" fill="#f59e0b"/>
                <rect x="7" y="6" width="2" height="1" fill="#fef08a"/>
                <rect x="6" y="8" width="2" height="1" fill="#b45309"/>
                <!-- Quặng vàng góc dưới trái -->
                <rect x="3" y="9" width="2" height="3" fill="#eab308"/>
                <rect x="3" y="9" width="1" height="2" fill="#fef08a"/>
                <!-- Quặng vàng cạnh đáy -->
                <rect x="8" y="11" width="3" height="2" fill="#f59e0b"/>
                <rect x="9" y="11" width="2" height="1" fill="#fef9c3"/>
            </svg>`;
    }

    getResourceItemSvg(itemId, sizeClass = 'w-5 h-5') {
        const nodeMap = { wood: 'tree', stone: 'stone', iron: 'iron', gold_ore: 'gold_rock' };
        const nType = nodeMap[itemId];
        if (!nType) return RESOURCE_ITEMS[itemId]?.icon || '📦';
        return this.getResourceNodeSvg(nType, 1, true).replace(/class="[^"]+"/, `class="${sizeClass} inline-block align-middle"`);
    }

    getPhuNongAvatarSvg(sizeClass = 'w-5 h-6') {
        return `
            <svg viewBox="37 14 28 41" class="${sizeClass} inline-block align-middle flex-shrink-0 drop-shadow-xs" aria-label="Phú Nông">
                <rect x="42" y="38" width="16" height="14" rx="4" fill="#dc2626" stroke="#7f1d1d" stroke-width="1"/>
                <rect x="44" y="42" width="12" height="10" rx="2" fill="#1e3a8a"/>
                <circle cx="58" cy="26" r="6" fill="#ea580c" stroke="#7c2d12" stroke-width="1"/>
                <rect x="41" y="21" width="17" height="16" rx="6" fill="#fde68a" stroke="#92400e" stroke-width="1.2"/>
                <path d="M40 27 Q41 16 50 16 Q59 16 59 27 Q54 23 45 25 Z" fill="#ea580c" stroke="#7c2d12" stroke-width="1"/>
                <circle cx="46" cy="30" r="1.3" fill="#1e293b"/>
                <circle cx="53" cy="30" r="1.3" fill="#1e293b"/>
                <circle cx="44" cy="33" r="1.2" fill="#fb7185" opacity="0.8"/>
                <circle cx="55" cy="33" r="1.2" fill="#fb7185" opacity="0.8"/>
            </svg>
        `;
    }

    // Tạo hình 4 loại Cuốc theo trình tự Ảnh 5, 6, 7, 8 (Ảnh 5=Cuốc Gỗ, 6=Cuốc Đá, 7=Cuốc Sắt, 8=Cuốc Vàng)
    getToolSvg(toolId, sizeClass = 'w-7 h-7') {
        // ẢNH 5: Cuốc Gỗ (hình rìu lưỡi xám cán gỗ chéo đúng theo Ảnh 5)
        if (toolId === 'pick_wood') {
            return `
                <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="${sizeClass} drop-shadow-xs">
                    <!-- Viền đen cán & lưỡi -->
                    <path d="M8 2h3v1h2v1h1v4h-1v2h-2v1H9v-1H8v1H7v1H6v1H5v1H3v-2h1v-1h1v-1h1V9h1V7H6V5h1V3h1z" fill="#1b1c2e"/>
                    <!-- Cán gỗ cam-nâu chéo -->
                    <rect x="4" y="11" width="1" height="2" fill="#ea580c"/>
                    <rect x="5" y="10" width="1" height="2" fill="#9a3412"/>
                    <rect x="6" y="9" width="1" height="2" fill="#ea580c"/>
                    <rect x="7" y="8" width="1" height="2" fill="#c2410c"/>
                    <!-- Lưỡi xám xanh theo Ảnh 5 -->
                    <path d="M7 4h4v1h2v3h-1v2H9V9H8V6H7z" fill="#64748b"/>
                    <rect x="8" y="4" width="2" height="4" fill="#94a3b8"/>
                    <rect x="9" y="4" width="1" height="3" fill="#cbd5e1"/>
                    <rect x="11" y="7" width="1" height="2" fill="#cbd5e1"/>
                    <!-- Đầu chốt gỗ đỏ trên đỉnh giống Ảnh 5 -->
                    <rect x="10" y="3" width="1" height="1" fill="#ea580c"/>
                </svg>`;
        }

        // Bảng màu 3 loại Cuốc cong theo trình tự Ảnh 6, 7, 8
        const palettes = {
            pick_stone: { dark: '#9a6b4c', mid: '#c49a6c', light: '#f5deb3', gleam: '#fef3c7' }, // ẢNH 6: Cuốc Đá (be/nâu cát nhạt)
            pick_iron:  { dark: '#64748b', mid: '#94a3b8', light: '#cbd5e1', gleam: '#f8fafc' }, // ẢNH 7: Cuốc Sắt (xám bạc ánh xanh)
            pick_gold:  { dark: '#d97706', mid: '#facc15', light: '#fef08a', gleam: '#ffffff' }  // ẢNH 8: Cuốc Vàng (vàng rực lấp lánh)
        };
        const p = palettes[toolId] || palettes.pick_stone;

        return `
            <svg viewBox="0 0 16 16" shape-rendering="crispEdges" class="${sizeClass} drop-shadow-xs">
                <!-- Viền đen cuốc + cán -->
                <path d="M4 2h5v1h2v1h1v2h1v6h-2v-1h-1V9H9v1H8v1H7v1H6v1H5v1H3v-2h1v-1h1v-1h1V9h1V8h1V6H6V5H4z" fill="#1b1c2e"/>
                <!-- Cán gỗ cam-nâu chéo -->
                <rect x="4" y="11" width="1" height="2" fill="#ea580c"/>
                <rect x="5" y="10" width="1" height="2" fill="#9a3412"/>
                <rect x="6" y="9" width="1" height="2" fill="#ea580c"/>
                <rect x="7" y="8" width="1" height="2" fill="#c2410c"/>
                <rect x="8" y="7" width="1" height="2" fill="#ea580c"/>
                <rect x="10" y="4" width="1" height="1" fill="#ea580c"/>
                <!-- Đầu cuốc cong từ trái lên đỉnh xuống phải -->
                <path d="M4 3h5v1h2v2h1v5h-1v-2H9V6H6V4H4z" fill="${p.mid}"/>
                <!-- Viền sáng mặt ngoài -->
                <rect x="5" y="3" width="3" height="1" fill="${p.gleam}"/>
                <rect x="8" y="4" width="2" height="1" fill="${p.light}"/>
                <rect x="10" y="5" width="1" height="2" fill="${p.light}"/>
                <rect x="11" y="7" width="1" height="3" fill="${p.gleam}"/>
                <!-- Bóng mặt trong -->
                <rect x="9" y="6" width="1" height="2" fill="${p.dark}"/>
                <rect x="10" y="8" width="1" height="2" fill="${p.dark}"/>
            </svg>`;
    }

    renderIslandResourceNodes() {
        if (!Array.isArray(this.data.resourceNodes)) {
            this.syncInitialResourceNodesForSave();
        }
        if (!this.data.tools || typeof this.data.tools !== 'object' || this.data.tools.pick_wood === undefined) {
            this.data.tools = { pick_wood: 5, pick_stone: 3, pick_iron: 2, pick_gold: 1 };
        }
        const inv = this.data.inventory || {};
        const tools = this.data.tools;

        const pairMap = [
            ['res-count-wood', inv.wood || 0],
            ['res-count-stone', inv.stone || 0],
            ['res-count-iron', inv.iron || 0],
            ['res-count-gold-ore', inv.gold_ore || 0],
            ['tool-count-pick_wood', tools.pick_wood || 0],
            ['tool-count-pick_stone', tools.pick_stone || 0],
            ['tool-count-pick_iron', tools.pick_iron || 0],
            ['tool-count-pick_gold', tools.pick_gold || 0]
        ];
        pairMap.forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        });

        ['pick_wood', 'pick_stone', 'pick_iron', 'pick_gold'].forEach(tid => {
            const iconEl = document.getElementById(`tool-icon-${tid}`);
            if (iconEl) iconEl.innerHTML = this.getToolSvg(tid, 'w-6 h-6');
        });
        [
            ['res-icon-wood', 'wood'],
            ['res-icon-stone', 'stone'],
            ['res-icon-iron', 'iron'],
            ['res-icon-gold-ore', 'gold_ore']
        ].forEach(([elId, resId]) => {
            const el = document.getElementById(elId);
            if (el) el.innerHTML = this.getResourceItemSvg(resId, 'w-4 h-4');
        });

        const grid = document.getElementById('island-resource-nodes-grid');
        if (!grid) return;

        const prevScrollTop = grid.scrollTop;
        const now = Date.now();
        const mineZones = [
            { type: 'tree', title: 'Mỏ Gỗ', panelCls: 'bg-emerald-950/40 border-emerald-400/60', titleCls: 'text-emerald-200' },
            { type: 'stone', title: 'Mỏ Đá', panelCls: 'bg-slate-900/45 border-slate-300/60', titleCls: 'text-slate-100' },
            { type: 'iron', title: 'Mỏ Sắt', panelCls: 'bg-sky-950/45 border-sky-300/60', titleCls: 'text-sky-200' },
            { type: 'gold_rock', title: 'Mỏ Vàng', panelCls: 'bg-amber-950/45 border-amber-300/70', titleCls: 'text-amber-200' }
        ];

        grid.innerHTML = mineZones.map(zone => {
            const meta = RESOURCE_NODES_META[zone.type];
            const toolMeta = TOOL_TYPES[meta.requiredTool] || TOOL_TYPES.pick_wood;
            const ownedTools = tools[meta.requiredTool] || 0;
            const zoneNodes = (this.data.resourceNodes || []).filter(n => n.type === zone.type);

            let readyCount = 0;
            const cardsHtml = zoneNodes.map((node, nodeIdx) => {
                const hasTool = ownedTools > 0;
                const elapsedSec = node.harvestedAt ? Math.floor((now - node.harvestedAt) / 1000) : meta.cooldownSec;
                const remSec = Math.max(0, meta.cooldownSec - elapsedSec);
                const isReady = remSec <= 0;
                if (isReady) readyCount++;
                return `
                    <button type="button" onclick="game.harvestResourceNode(${node.uid})"
                        class="resource-node-card border-2 text-[9px] ${isReady ? `${meta.readyBg} node-ready` : 'bg-black/35 border-slate-500/80 text-slate-200'}">
                        <div class="w-full flex justify-between items-center px-0.5 leading-none font-black">
                            <span class="inline-flex items-center gap-0.5">${this.getResourceItemSvg(meta.dropItemId, 'w-3.5 h-3.5')}+${meta.dropQty}</span>
                            <span class="px-1 rounded ${isReady ? (hasTool ? 'bg-amber-300 text-slate-950' : 'bg-rose-500 text-white') : 'bg-black/50 text-amber-200'}">${isReady ? meta.actionLabel : this.formatCountdownClock(remSec)}</span>
                        </div>
                        ${this.getResourceNodeSvg(node.type, node.uid, isReady)}
                    </button>
                `;
            }).join('');

            const harvestZoneBtn = readyCount > 0
                ? `<button type="button" onclick="game.harvestAllReadyResourceNodes('${zone.type}')" class="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg border border-amber-800 text-[9px] shadow active:scale-95">⛏️ Thu (${readyCount})</button>`
                : '';

            return `
                <div class="resource-mine-section rounded-xl border-2 ${zone.panelCls} p-1.5 space-y-1.5" data-mine-type="${zone.type}">
                    <div class="flex items-center justify-between gap-1 px-0.5">
                        <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
                            ${this.getResourceItemSvg(meta.dropItemId, 'w-4 h-4')}
                            <span class="text-[11px] font-black ${zone.titleCls} drop-shadow">${zone.title}</span>
                            <span class="px-1.5 py-0.5 rounded-full bg-black/40 text-white text-[9px] font-black">${zoneNodes.length} mỏ</span>
                        </div>
                        <div class="flex items-center gap-1 flex-shrink-0">
                            ${harvestZoneBtn}
                        </div>
                    </div>
                    ${zoneNodes.length > 0
                        ? `<div class="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-64 overflow-y-auto pr-0.5">${cardsHtml}</div>`
                        : `<div class="text-center py-2 px-2 rounded-lg bg-black/25 border border-white/15 text-[9.5px] font-bold text-white/75">Chưa có ${zone.title.toLowerCase()} (0 mỏ)</div>`
                    }
                </div>
            `;
        }).join('');
        grid.scrollTop = prevScrollTop;
    }

    harvestResourceNode(uid) {
        const node = (this.data.resourceNodes || []).find(n => n.uid === uid);
        if (!node) return;
        const meta = RESOURCE_NODES_META[node.type] || RESOURCE_NODES_META.tree;
        const dropMeta = RESOURCE_ITEMS[meta.dropItemId];
        const toolMeta = TOOL_TYPES[meta.requiredTool] || TOOL_TYPES.pick_wood;

        const elapsedSec = node.harvestedAt ? Math.floor((Date.now() - node.harvestedAt) / 1000) : meta.cooldownSec;
        const remSec = meta.cooldownSec - elapsedSec;
        if (remSec > 0) {
            window.adsgramManager.showToast(`${meta.name} đang hồi phục (còn ${this.formatCountdownClock(remSec)})...`, 'info');
            return;
        }

        if (!this.data.tools || typeof this.data.tools !== 'object' || this.data.tools.pick_wood === undefined) {
            this.data.tools = { pick_wood: 5, pick_stone: 3, pick_iron: 2, pick_gold: 1 };
        }
        if ((this.data.tools[toolMeta.id] || 0) <= 0) {
            window.adsgramManager.showToast(`Cần 1 ${toolMeta.name} để ${meta.actionLabel.toLowerCase()} ${meta.name}! Hãy rèn tại Thợ Rèn!`, 'warning');
            this.openBlacksmithModal(toolMeta.id);
            return;
        }

        this.data.tools[toolMeta.id] -= 1;
        node.harvestedAt = Date.now();
        this.data.inventory[meta.dropItemId] = (this.data.inventory[meta.dropItemId] || 0) + meta.dropQty;
        window.sound.playHarvest();
        window.adsgramManager.showToast(`${dropMeta.icon} Dùng 1 ${toolMeta.name}: +${meta.dropQty} ${dropMeta.name}!`, 'success');
        this.save();
        this.renderAll();
    }

    harvestAllReadyResourceNodes(filterType = null) {
        const targetType = typeof filterType === 'string' && RESOURCE_NODES_META[filterType] ? filterType : null;
        if (!this.data.tools || typeof this.data.tools !== 'object' || this.data.tools.pick_wood === undefined) {
            this.data.tools = { pick_wood: 5, pick_stone: 3, pick_iron: 2, pick_gold: 1 };
        }
        const now = Date.now();
        const gained = {};
        let count = 0;
        let blockedNoTool = 0;
        let firstMissingToolId = null;
        let totalExp = 0;

        (this.data.resourceNodes || []).forEach(node => {
            if (targetType && node.type !== targetType) return;
            const meta = RESOURCE_NODES_META[node.type] || RESOURCE_NODES_META.tree;
            const elapsedSec = node.harvestedAt ? Math.floor((now - node.harvestedAt) / 1000) : meta.cooldownSec;
            if (elapsedSec >= meta.cooldownSec) {
                if ((this.data.tools[meta.requiredTool] || 0) > 0) {
                    this.data.tools[meta.requiredTool] -= 1;
                    node.harvestedAt = now;
                    this.data.inventory[meta.dropItemId] = (this.data.inventory[meta.dropItemId] || 0) + meta.dropQty;
                    gained[meta.dropItemId] = (gained[meta.dropItemId] || 0) + meta.dropQty;
                    totalExp += meta.exp;
                    count++;
                } else {
                    blockedNoTool++;
                    if (!firstMissingToolId) firstMissingToolId = meta.requiredTool;
                }
            }
        });

        if (count === 0 && blockedNoTool > 0) {
            const tMeta = TOOL_TYPES[firstMissingToolId] || TOOL_TYPES.pick_wood;
            window.adsgramManager.showToast(`Hết ${tMeta.name} rồi! Hãy chế tạo thêm ở Thợ Rèn!`, 'warning');
            this.openBlacksmithModal(tMeta.id);
            return;
        }
        if (count === 0) {
            window.adsgramManager.showToast('Chưa có mỏ tài nguyên nào sẵn sàng trên đảo!', 'info');
            return;
        }

        window.sound.playFanfare();
        const summary = Object.entries(gained).map(([id, qty]) => `+${qty} ${RESOURCE_ITEMS[id].icon}`).join(' ');
        const extraNote = blockedNoTool > 0 ? ` (${blockedNoTool} mỏ thiếu cuốc)` : '';
        window.adsgramManager.showToast(`⛏️ Thu hoạch ${count} mỏ: ${summary}${extraNote}!`, 'success');
        this.save();
        this.renderAll();
    }

    resetAllResourcesWithDiamonds() {
        const now = Date.now();
        const smithMap = this.ensureSmithStock();
        const hasCooldownNodes = (this.data.resourceNodes || []).some(node => {
            const meta = RESOURCE_NODES_META[node.type] || RESOURCE_NODES_META.tree;
            const elapsedSec = node.harvestedAt ? Math.floor((now - node.harvestedAt) / 1000) : meta.cooldownSec;
            return elapsedSec < meta.cooldownSec;
        });
        const needSmithRestock = Object.values(TOOL_TYPES).some(t => (smithMap[t.id] || 0) < t.dailyStock);

        if (!hasCooldownNodes && !needSmithRestock) {
            window.adsgramManager.showToast('Toàn bộ mỏ tài nguyên và kho cuốc đều đang sẵn sàng, chưa cần đặt lại!', 'info');
            return false;
        }
        if ((this.data.diamonds || 0) < RESOURCE_RESET_DIAMONDS) {
            window.adsgramManager.showToast(`Cần ${RESOURCE_RESET_DIAMONDS.toLocaleString()}💎 Kim Cương để đặt lại toàn bộ Tài Nguyên!`, 'warning');
            return false;
        }

        this.data.diamonds -= RESOURCE_RESET_DIAMONDS;
        (this.data.resourceNodes || []).forEach(node => {
            node.harvestedAt = 0;
        });
        this.data.smithStock = this.createFreshSmithStock();

        window.sound && window.sound.playFanfare();
        window.adsgramManager.showToast(`💎 Đã đặt lại toàn bộ Mỏ Tài Nguyên & Kho Cuốc (-${RESOURCE_RESET_DIAMONDS.toLocaleString()}💎)!`, 'success');
        this.save();
        this.renderAll();
        return true;
    }

    // ==========================================
    // XƯỞNG THỢ RÈN (CHẾ TẠO 4 LOẠI CUỐC KIỂU ẢNH 1 & 2)
    // ==========================================
    ensureSmithStock() {
        const today = this.getTodayDateKey();
        if (!this.data.smithStock || this.data.smithStock.date !== today || this.data.smithStock.limitVersion !== 2 || this.data.smithStock.items?.pick_wood === undefined) {
            const fresh = this.createFreshSmithStock();
            if (this.data.smithStock && this.data.smithStock.date === today && this.data.smithStock.items) {
                Object.keys(TOOL_TYPES).forEach(k => {
                    const max = TOOL_TYPES[k].dailyStock;
                    const oldVal = this.data.smithStock.items[k];
                    fresh.items[k] = typeof oldVal === 'number' ? Math.max(0, Math.min(max, oldVal)) : max;
                });
            }
            this.data.smithStock = fresh;
        }
        Object.keys(TOOL_TYPES).forEach(k => {
            const max = TOOL_TYPES[k].dailyStock;
            if (typeof this.data.smithStock.items[k] !== 'number' || this.data.smithStock.items[k] > max) {
                this.data.smithStock.items[k] = Math.max(0, Math.min(max, Number(this.data.smithStock.items[k] ?? max)));
            }
        });
        return this.data.smithStock.items;
    }

    openBlacksmithModal(toolId = null) {
        window.sound.playClick();
        this.ensureSmithStock();
        if (toolId && TOOL_TYPES[toolId]) this.selectedToolId = toolId;
        this.switchSmithTab('tools');
        document.getElementById('modal-blacksmith').classList.remove('hidden');
    }

    switchSmithTab(tab) {
        this.blacksmithTab = tab === 'guide' ? 'guide' : 'tools';
        document.querySelectorAll('.smith-tab-btn').forEach(btn => {
            const active = btn.getAttribute('data-smith-tab') === this.blacksmithTab;
            btn.classList.toggle('bg-[#efd3a3]', active);
            btn.classList.toggle('text-[#4a260a]', active);
            btn.classList.toggle('bg-[#b3743b]', !active);
            btn.classList.toggle('text-amber-100', !active);
        });
        document.getElementById('smith-panel-tools').classList.toggle('hidden', this.blacksmithTab !== 'tools');
        document.getElementById('smith-panel-guide').classList.toggle('hidden', this.blacksmithTab !== 'guide');
        this.renderBlacksmithModal();
    }

    renderBlacksmithModal() {
        const stockMap = this.ensureSmithStock();
        if (!this.data.tools || typeof this.data.tools !== 'object' || this.data.tools.pick_wood === undefined) {
            this.data.tools = { pick_wood: 5, pick_stone: 3, pick_iron: 2, pick_gold: 1 };
        }
        const toolsList = Object.values(TOOL_TYPES);
        const sel = TOOL_TYPES[this.selectedToolId] || toolsList[0];

        const gridEl = document.getElementById('blacksmith-tools-grid');
        if (gridEl) {
            gridEl.innerHTML = toolsList.map(t => {
                const owned = this.data.tools[t.id] || 0;
                const isSel = t.id === sel.id;
                const cornerBrackets = isSel ? `
                    <span class="pointer-events-none absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-t-[3px] border-l-[3px] border-[#fef3c7] rounded-tl-xs"></span>
                    <span class="pointer-events-none absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-t-[3px] border-r-[3px] border-[#fef3c7] rounded-tr-xs"></span>
                    <span class="pointer-events-none absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-b-[3px] border-l-[3px] border-[#fef3c7] rounded-bl-xs"></span>
                    <span class="pointer-events-none absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-b-[3px] border-r-[3px] border-[#fef3c7] rounded-br-xs"></span>
                ` : '';
                return `
                    <button type="button" onclick="game.selectedToolId='${t.id}'; window.sound.playClick(); game.renderBlacksmithModal();"
                        class="relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition bg-[#8f5633] border-2 ${isSel ? 'border-[#1b1c2e] shadow-md scale-[1.04]' : 'border-[#4a260a] hover:brightness-105'}">
                        ${cornerBrackets}
                        <span class="absolute -top-1.5 right-0.5 bg-white text-[#1b1c2e] border border-[#4a260a] text-[8.5px] font-black px-1 rounded leading-tight z-10">${owned}</span>
                        <div class="mt-0.5">${this.getToolSvg(t.id, 'w-8 h-8')}</div>
                        <span class="text-[7.5px] font-black text-[#fef3c7] truncate w-full text-center leading-none mt-0.5">${t.name}</span>
                    </button>
                `;
            }).join('');
        }

        const stock = stockMap[sel.id] || 0;
        const owned = this.data.tools[sel.id] || 0;
        document.getElementById('smith-tool-stock').innerText = `${stock}/${sel.dailyStock} trong kho`;
        document.getElementById('smith-tool-name').innerText = sel.name;
        document.getElementById('smith-tool-icon').innerHTML = `
            <div class="w-14 h-14 rounded-xl bg-[#8f5633] border-2 border-[#1b1c2e] flex items-center justify-center shadow-inner">
                ${this.getToolSvg(sel.id, 'w-11 h-11')}
            </div>`;
        document.getElementById('smith-tool-desc').innerText = sel.desc;
        document.getElementById('smith-tool-owned').innerText = owned;

        const costsEl = document.getElementById('smith-tool-costs');
        if (costsEl) {
            const hasGold = (this.data.gold || 0) >= sel.goldCost;
            const rows = [
                `<div class="flex justify-between items-center bg-[#f7e7c8] px-2 py-1 rounded border border-[#8c5426]">
                    <span>${GOLD_ICON} Vàng</span>
                    <span class="${hasGold ? 'text-emerald-700' : 'text-rose-600'}">${sel.goldCost}</span>
                </div>`
            ];
            (sel.materials || []).forEach(m => {
                const rm = RESOURCE_ITEMS[m.id];
                const have = (this.data.inventory && this.data.inventory[m.id]) || 0;
                const ok = have >= m.qty;
                rows.push(`
                    <div class="flex justify-between items-center bg-[#f7e7c8] px-2 py-1 rounded border border-[#8c5426]">
                        <span class="flex items-center gap-1">${this.getResourceItemSvg(m.id, 'w-4 h-4')}<span>${rm.name}</span></span>
                        <span class="${ok ? 'text-emerald-700' : 'text-rose-600'}">${have}/${m.qty}</span>
                    </div>
                `);
            });
            costsEl.innerHTML = rows.join('');
        }

        const canCraft = (n) => {
            if (stock < n || (this.data.gold || 0) < sel.goldCost * n) return false;
            return (sel.materials || []).every(m => ((this.data.inventory && this.data.inventory[m.id]) || 0) >= m.qty * n);
        };
        const btn1 = document.getElementById('btn-craft-tool-1');
        const btn10 = document.getElementById('btn-craft-tool-10');
        if (btn1) btn1.classList.toggle('opacity-50', !canCraft(1));
        if (btn10) btn10.classList.toggle('opacity-50', !canCraft(10));
    }

    craftTool(qty = 1) {
        const stockMap = this.ensureSmithStock();
        const tool = TOOL_TYPES[this.selectedToolId] || TOOL_TYPES.pick_wood;
        const stock = stockMap[tool.id] || 0;

        if (stock < qty) {
            window.adsgramManager.showToast(`Thợ Rèn chỉ còn ${stock} ${tool.name} hôm nay!`, 'warning');
            return;
        }
        const totalGold = tool.goldCost * qty;
        if ((this.data.gold || 0) < totalGold) {
            window.adsgramManager.showToast(`Cần ${totalGold.toLocaleString()}💰 Vàng để rèn ${qty} ${tool.name}!`, 'warning');
            return;
        }
        for (const m of (tool.materials || [])) {
            const have = (this.data.inventory && this.data.inventory[m.id]) || 0;
            const need = m.qty * qty;
            if (have < need) {
                const rm = RESOURCE_ITEMS[m.id];
                window.adsgramManager.showToast(`Thiếu ${need - have} ${rm.icon} ${rm.name} để rèn ${qty} ${tool.name}!`, 'warning');
                return;
            }
        }

        this.data.gold -= totalGold;
        (tool.materials || []).forEach(m => {
            this.data.inventory[m.id] -= m.qty * qty;
            if (this.data.inventory[m.id] <= 0) delete this.data.inventory[m.id];
        });
        stockMap[tool.id] = stock - qty;
        if (!this.data.tools) this.data.tools = {};
        this.data.tools[tool.id] = (this.data.tools[tool.id] || 0) + qty;

        window.sound.playCoin();
        window.adsgramManager.showToast(`⚒️ Rèn thành công +${qty} ${tool.icon} ${tool.name}!`, 'success');
        this.save();
        this.renderAll();
    }

    setLandTier(tier) {
        const t1Count = this.data.plots.slice(0, 36).filter(p => p.unlocked).length;
        const t2Count = this.data.plots.slice(36, 72).filter(p => p.unlocked).length;

        if (tier === 2 && t1Count < 36) {
            window.adsgramManager.showToast(`Cần mở hết 36/36 ô Đất Cấp 1 (còn ${36 - t1Count} ô) để lên Đất Cấp 2!`, 'warning');
            return;
        }
        if (tier === 3 && t2Count < 36) {
            window.adsgramManager.showToast(`Cần mở hết 36/36 ô Đất Cấp 2 (còn ${36 - t2Count} ô) để lên Đất Cấp 3!`, 'warning');
            return;
        }

        this.currentLandTier = tier;
        window.sound.playClick();
        this.renderPlots();
    }

    renderPlots() {
        const grid = document.getElementById('farm-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const board = document.getElementById('farm-parcel-board');
        if (board) {
            board.className = `farm-parcel-board rounded-2xl p-1.5 ${
                this.currentLandTier === 2 ? 'tier-2-board' : (this.currentLandTier === 3 ? 'tier-3-board' : '')
            }`;
        }

        const t1Count = this.data.plots.slice(0, 36).filter(p => p.unlocked).length;
        const t2Count = this.data.plots.slice(36, 72).filter(p => p.unlocked).length;
        const t3Count = this.data.plots.slice(72, 108).filter(p => p.unlocked).length;
        const totalUnlocked = t1Count + t2Count + t3Count;

        const elTotal = document.getElementById('total-unlocked-plots');
        if (elTotal) elTotal.innerText = `${totalUnlocked}/108`;
        const elT1 = document.getElementById('tier1-count');
        const elT2 = document.getElementById('tier2-count');
        const elT3 = document.getElementById('tier3-count');
        if (elT1) elT1.innerText = `(${t1Count}/36)`;
        if (elT2) elT2.innerText = t1Count < 36 ? `🔒 (${t2Count}/36)` : `(${t2Count}/36)`;
        if (elT3) elT3.innerText = t2Count < 36 ? `🔒 (${t3Count}/36)` : `(${t3Count}/36)`;

        const buffLabel = document.getElementById('current-tier-buff-label');
        if (buffLabel) {
            if (this.currentLandTier === 1) buffLabel.innerText = 'Cấp 1 • Đất Phù Sa (1x Tốc độ)';
            else if (this.currentLandTier === 2) buffLabel.innerText = 'Cấp 2 • Đất Màu Mỡ (+25% Nhanh & +30% X2)';
            else buffLabel.innerText = 'Cấp 3 • Đất Thần (+50% Nhanh, +60% X2 & +💎)';
        }

        document.querySelectorAll('.land-tier-tab').forEach(tab => {
            const t = parseInt(tab.getAttribute('data-tier'), 10);
            const isSelected = t === this.currentLandTier;
            const isLocked = (t === 2 && t1Count < 36) || (t === 3 && t2Count < 36);
            tab.classList.toggle('bg-emerald-600', isSelected);
            tab.classList.toggle('border-emerald-600', isSelected);
            tab.classList.toggle('text-white', isSelected);
            tab.classList.toggle('bg-white', !isSelected);
            tab.classList.toggle('border-slate-300', !isSelected);
            tab.classList.toggle('text-slate-600', !isSelected);
            tab.classList.toggle('opacity-60', isLocked);
        });

        const curSeed = SEED_TYPES[this.data.selectedSeed] || SEED_TYPES.rau_mam;
        const curSeedLabel = document.getElementById('current-selected-seed-label');
        if (curSeedLabel) curSeedLabel.innerText = `Gieo: ${curSeed.name}`;

        const nextIdx = this.getNextUnlockableGlobalIndex();
        const startIdx = (this.currentLandTier - 1) * 36;
        const endIdx = startIdx + 36;
        const tierPlots = this.data.plots.slice(startIdx, endIdx);
        const tierSpeedMult = this.currentLandTier === 3 ? 0.5 : (this.currentLandTier === 2 ? 0.75 : 1);

        // Render ĐỦ 36 ô đất (cả đã mở & đang khóa 🔒) trong 1 mảnh đất lớn 6x6
        tierPlots.forEach((plot) => {
            const card = document.createElement('div');
            const tierClass = this.currentLandTier === 2 ? 'tier-2' : (this.currentLandTier === 3 ? 'tier-3' : '');

            if (!plot.unlocked) {
                const isNext = plot.id === nextIdx;
                const plotNum = plot.id + 1;
                const reqLv = plotNum;
                const badgeText = plot.id === 0
                    ? `🎬 ${this.data.plot0AdsWatched || 0}/2 Ads`
                    : `Lv.${reqLv}`;
                card.className = `plot-card locked ${isNext ? 'locked-next animate-pulse' : ''}`;
                card.innerHTML = `
                    <div class="w-full flex justify-between items-center text-[8px] font-black leading-none px-0.5 min-h-[10px] ${isNext ? 'text-amber-300' : 'text-slate-300/80'}">
                        <span>Ô ${plotNum}</span>
                        <span>${isNext ? '✨' : ''}</span>
                    </div>
                    <div class="text-base leading-none my-auto drop-shadow">${isNext ? '🔓' : '🔒'}</div>
                    <div class="text-[7.5px] font-black leading-none pb-0.5 px-1 rounded ${
                        isNext ? 'bg-amber-400 text-slate-900 shadow-sm' : 'bg-black/40 text-amber-200/90'
                    }">
                        ${badgeText}
                    </div>
                `;
                card.onclick = () => this.openUnlockPlotModal(plot.id);
            } else if (!plot.crop) {
                card.className = `plot-card ${tierClass}`;
                card.innerHTML = `
                    <div class="w-full flex justify-end items-center text-[8px] font-bold text-amber-200/80 leading-none px-0.5 min-h-[10px]">
                        <span>${this.currentLandTier === 3 ? '💎' : (this.currentLandTier === 2 ? '✨' : '')}</span>
                    </div>
                    <div class="text-base my-auto opacity-65 drop-shadow">🌱</div>
                    <div class="text-[7.5px] font-extrabold text-amber-100/90 leading-none pb-0.5">Gieo</div>
                `;
                card.onclick = () => this.plantSeed(plot.id);
            } else {
                const seedInfo = SEED_TYPES[plot.crop] || SEED_TYPES.rau_mam;
                const now = Date.now();
                const totalTime = seedInfo.growTime * 1000 * tierSpeedMult; // Tưới nước chỉ kích hoạt cây bắt đầu phát triển, không giảm thời gian
                const isLongCrop = seedInfo.growTime >= 3600; // Cây từ 1h trở lên
                const isWaitingForWater = isLongCrop && !plot.watered; // Gieo hạt xong phải tưới nước thì cây mới lớn

                let progress = 0;
                let remSec = Math.ceil(totalTime / 1000);
                let isReady = false;

                if (isWaitingForWater) {
                    progress = 0;
                    remSec = Math.ceil(totalTime / 1000);
                    isReady = false;
                } else {
                    const elapsed = Math.max(0, now - (plot.plantedAt || now));
                    progress = Math.min(100, Math.floor((elapsed / totalTime) * 100));
                    remSec = Math.max(0, Math.ceil((totalTime - elapsed) / 1000));
                    isReady = progress >= 100;
                }

                card.className = `plot-card ${tierClass} ${plot.watered ? 'watered' : ''} ${isReady ? 'ready' : ''} ${isWaitingForWater ? 'border-2 border-sky-400 bg-sky-50/50' : ''}`;
                card.innerHTML = `
                    <div class="w-full flex justify-between items-center text-[8px] leading-none px-0.5 z-10 min-h-[10px]">
                        <span class="font-bold text-sky-200">${plot.watered && !isReady ? '💧' : ''}</span>
                        <span class="px-1 rounded ${
                            isReady
                                ? 'bg-yellow-400 text-slate-950 font-black'
                                : (isWaitingForWater
                                    ? 'bg-sky-600 text-white font-black animate-pulse'
                                    : 'bg-black/50 text-emerald-200 font-bold')
                        }">
                            ${isReady ? '⭐' : (isWaitingForWater ? '💧 Cần tưới' : this.formatCountdownClock(remSec))}
                        </span>
                    </div>
                    <div class="my-auto z-10 ${isReady ? 'animate-bounce' : ''}">
                        ${this.getCropSvg(seedInfo.id, progress)}
                    </div>
                    <div class="w-full bg-black/55 h-1 rounded-full overflow-hidden z-10">
                        <div class="bg-gradient-to-r from-yellow-300 via-emerald-400 to-green-500 h-full" style="width: ${progress}%"></div>
                    </div>
                `;

                if (isReady) {
                    card.onclick = () => this.harvestPlot(plot.id);
                } else if (isWaitingForWater) {
                    card.onclick = () => {
                        window.adsgramManager.showToast(`Cây ${seedInfo.name} (${seedInfo.growTimeLabel} >= 1h) gieo xong cần tưới nước mới bắt đầu lớn! Đang mở tưới nước...`, "warning");
                        this.waterAllPlotsWith2Ads();
                    };
                } else {
                    card.onclick = () => {
                        window.adsgramManager.showToast(`Cây ${seedInfo.name} đang lớn (còn ${this.formatCountdownClock(remSec)} nữa sẽ chín)!`, "info");
                    };
                }
            }

            grid.appendChild(card);
        });
    }

    openUnlockPlotModal(globalIdx) {
        if (globalIdx == null || globalIdx < 0 || globalIdx >= 108) return;
        const plot = this.data.plots[globalIdx];
        if (!plot || plot.unlocked) return;

        this.pendingUnlockIndex = globalIdx;
        const nextIdx = this.getNextUnlockableGlobalIndex();
        const isOutOfOrder = globalIdx > nextIdx;
        const req = this.getPlotUnlockRequirements(globalIdx);

        const titleEl = document.getElementById('unlock-modal-title');
        const bannerEl = document.getElementById('unlock-modal-banner');
        const listEl = document.getElementById('unlock-requirements-list');
        const grantsEl = document.getElementById('unlock-grants-list');
        const timeEl = document.getElementById('unlock-build-time');
        const confirmBtn = document.getElementById('btn-confirm-unlock-plot');
        if (!titleEl || !bannerEl || !listEl) return;

        const avatarEl = document.getElementById('unlock-modal-avatar');
        if (avatarEl) {
            avatarEl.innerHTML = this.getPhuNongAvatarSvg('w-5 h-6');
        }

        const renderReqRow = (iconHtml, label, haveNum, needNum, showPair = true) => {
            const ok = haveNum >= needNum;
            const pillText = showPair ? `${haveNum.toLocaleString()}/${needNum.toLocaleString()}` : `${needNum.toLocaleString()}`;
            return `
                <div class="bg-[#efd3a3] rounded-lg border border-[#8a4f1d] px-2.5 py-1.5 flex justify-between items-center text-[11px]">
                    <div class="flex items-center gap-2 font-black text-[#4a260a]">
                        <span class="text-base leading-none">${iconHtml}</span>
                        <span>${label}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-md border font-black text-[10.5px] ${
                        ok ? 'bg-emerald-600 text-white border-emerald-900' : 'bg-rose-600 text-white border-rose-900'
                    }">${pillText}</span>
                </div>
            `;
        };

        if (globalIdx === 0) {
            titleEl.innerText = 'Phú Nông • Mở Ô Đất Đầu Tiên (Xem 2 QC)';
            if (timeEl) timeEl.innerHTML = '<span>🎬</span><span>Xem 2 video</span>';
            bannerEl.classList.remove('hidden');
            bannerEl.innerHTML = '🌟 Chào mừng bạn đến với Nông Trại! Hãy xem <b>2 video quảng cáo</b> để khai khẩn <b>Ô Đất Đầu Tiên (#1)</b> hoàn toàn miễn phí và bắt đầu gieo hạt!';

            const adsWatched = Math.min(2, Math.max(0, this.data.plot0AdsWatched || 0));
            const hasAds = adsWatched >= 2;
            let rowsHtml = renderReqRow('🎬', 'Xem Video Quảng Cáo', adsWatched, 2, true);
            rowsHtml += renderReqRow('⭐', 'Cấp Nhân Vật (Lv.1 khởi đầu)', this.data.level || 1, 1, true);
            listEl.innerHTML = rowsHtml;

            if (grantsEl) {
                grantsEl.innerHTML = `
                    <div class="px-2 py-1 rounded-lg bg-[#efd3a3] border border-[#784319] flex items-center gap-1">
                        <span>🌱</span><span>+1 Ô Đất Trồng Cây (Ô 1)</span>
                    </div>
                    <div class="px-2 py-1 rounded-lg bg-[#efd3a3] border border-[#784319] flex items-center gap-1">
                        <span>🎁</span><span>Khai mở Nông Trại</span>
                    </div>
                `;
            }

            if (confirmBtn) {
                if (hasAds) {
                    confirmBtn.innerText = '⛏️ Hoàn Tất Mở Ô Đất Đầu Tiên';
                    confirmBtn.className = 'w-full py-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 border-2 border-[#5c3010] text-white font-black text-xs shadow active:scale-95 transition';
                } else {
                    confirmBtn.innerText = `🎬 Xem Quảng Cáo (${adsWatched}/2) Để Mở Đất`;
                    confirmBtn.className = 'w-full py-2.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 border-2 border-[#5c3010] text-white font-black text-xs shadow active:scale-95 transition';
                }
            }

            window.sound.playClick();
            document.getElementById('modal-unlock-plot').classList.remove('hidden');
            return;
        }

        titleEl.innerText = req.isTierBreakthrough
            ? `Phú Nông • Đột Phá Đất Cấp ${req.tier} (Ô ${req.plotNumber})`
            : `Phú Nông • Mở Ô Đất ${req.plotNumber} (Cấp ${req.tier})`;

        if (timeEl) timeEl.innerHTML = `<span>⏱️</span><span>${req.buildTimeLabel}</span>`;

        bannerEl.classList.remove('hidden');
        const hasLevel = (this.data.level || 1) >= req.requiredLevel;
        if (isOutOfOrder) {
            bannerEl.innerHTML = `<span class="text-rose-800 font-black">⚠️ Cần mở tuần tự tới Ô Đất ${nextIdx + 1} (Cấp ${Math.floor(nextIdx / 36) + 1}) trước khi mở ô đất này!</span>`;
        } else if (!hasLevel) {
            bannerEl.innerHTML = `<span class="text-rose-800 font-black">⚠️ Cần đạt Cấp Nhân Vật Lv.${req.requiredLevel} để mở ô đất thứ ${req.plotNumber}! Hãy nấu ăn ở Xưởng Bánh hoặc ăn cá để tăng cấp!</span>`;
        } else if (req.isTierBreakthrough) {
            bannerEl.innerHTML = `🌟 Chào Nông Dân Cấp ${this.data.level || 1}! Phú Nông sẽ giúp bạn đột phá lên <b>Đất Cấp ${req.tier}</b> màu mỡ hơn và mở thêm nhiều mỏ tài nguyên quý trên đảo!`;
        } else {
            bannerEl.innerHTML = `Chào Nông Dân Cấp ${this.data.level || 1}! Phú Nông sẽ giúp bạn khai khẩn <b>Ô Đất ${req.plotNumber}</b> để có thêm ô trồng cây và tài nguyên thiên nhiên trên đảo!`;
        }

        const hasGold = this.data.gold >= req.gold;
        let allMet = !isOutOfOrder && hasLevel && hasGold;

        // Dòng 1: Cấp Nhân Vật (Lv.HiệnTại / Lv.Cần)
        let rowsHtml = renderReqRow('⭐', `Cấp Nhân Vật (Cần Lv.${req.requiredLevel})`, this.data.level || 1, req.requiredLevel, true);

        // Dòng 2: Vàng
        rowsHtml += renderReqRow(GOLD_ICON, 'Vàng (Coins)', this.data.gold, req.gold, false);

        // Tài nguyên đảo & nông sản
        req.resources.forEach(r => {
            const meta = RESOURCE_ITEMS[r.id];
            const have = this.data.inventory[r.id] || 0;
            if (have < r.qty) allMet = false;
            rowsHtml += renderReqRow(this.getResourceItemSvg(r.id, 'w-5 h-5'), meta.name, have, r.qty, true);
        });

        req.crops.forEach(c => {
            const meta = SEED_TYPES[c.id];
            const have = this.data.inventory[c.id] || 0;
            if (have < c.qty) allMet = false;
            rowsHtml += renderReqRow(meta.icon, meta.name, have, c.qty, true);
        });

        listEl.innerHTML = rowsHtml;

        if (grantsEl) {
            const nodeCounts = {};
            req.grantNodes.forEach(t => { nodeCounts[t] = (nodeCounts[t] || 0) + 1; });
            const grantPills = [
                `<div class="px-2 py-1 rounded-lg bg-[#efd3a3] border border-[#784319] flex items-center gap-1">
                    <span>🟫</span><span>+1 Ô Trồng Cây (Ô ${req.plotNumber})</span>
                </div>`
            ];
            Object.entries(nodeCounts).forEach(([type, count]) => {
                const nm = RESOURCE_NODES_META[type];
                const nodeSvg = this.getResourceNodeSvg(type, 1, true).replace(/class="[^"]+"/, 'class="w-5 h-5 inline-block"');
                grantPills.push(`
                    <div class="px-2 py-1 rounded-lg bg-[#efd3a3] border border-[#784319] flex items-center gap-1">
                        <span>${nodeSvg}</span><span>+${count} ${nm.name}</span>
                    </div>
                `);
            });
            grantsEl.innerHTML = grantPills.join('');
        }

        if (confirmBtn) {
            if (allMet) {
                confirmBtn.innerText = `⛏️ Mở Rộng Ô Đất ${req.plotNumber}`;
                confirmBtn.className = 'w-full py-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 border-2 border-[#5c3010] text-white font-black text-xs shadow active:scale-95 transition';
            } else {
                if (isOutOfOrder) {
                    confirmBtn.innerText = `🔒 Cần Mở Ô ${nextIdx + 1} Trước`;
                } else if (!hasLevel) {
                    confirmBtn.innerText = `🔒 Chưa Đạt Cấp Lv.${req.requiredLevel} (Hiện Lv.${this.data.level || 1})`;
                } else {
                    confirmBtn.innerText = 'Mở Rộng Đất (Chưa đủ tài nguyên)';
                }
                confirmBtn.className = 'w-full py-2.5 rounded-xl bg-[#b88b58] border-2 border-[#784319] text-[#5c3010]/80 font-black text-xs shadow-inner active:scale-95 transition';
            }
        }

        window.sound.playClick();
        document.getElementById('modal-unlock-plot').classList.remove('hidden');
    }

    async watchAdForPlot0() {
        if (this.data.plots[0].unlocked) {
            window.adsgramManager.showToast('Ô đất đầu tiên đã được mở khóa rồi!', 'info');
            return;
        }
        if (typeof this.data.plot0AdsWatched !== 'number') this.data.plot0AdsWatched = 0;

        window.adsgramManager.showToast(`🎬 Đang phát video quảng cáo (${this.data.plot0AdsWatched + 1}/2) để mở ô đất đầu tiên...`, 'info');
        const success = await window.adsgramManager.showRewardAd('unlock_plot_0', true);
        if (success) {
            this.data.plot0AdsWatched = (this.data.plot0AdsWatched || 0) + 1;
            if (this.data.plot0AdsWatched >= 2) {
                this.data.plots[0].unlocked = true;
                window.sound.playFanfare();
                window.adsgramManager.showToast('🎉 XUẤT SẮC! Đã xem đủ 2 quảng cáo và mở khóa thành công Ô Đất Đầu Tiên!', 'success');
                document.getElementById('modal-unlock-plot').classList.add('hidden');
                this.pendingUnlockIndex = null;
            } else {
                window.adsgramManager.showToast('📺 Đã xem 1/2 quảng cáo! Hãy xem thêm 1 quảng cáo nữa để mở ô đất đầu tiên!', 'info');
                this.openUnlockPlotModal(0);
            }
            this.save();
            this.renderPlots();
            this.updateHeaderUI();
        }
    }

    async confirmUnlockPlot() {
        const idx = this.pendingUnlockIndex;
        if (idx == null || idx < 0 || idx >= 108) return;
        const nextIdx = this.getNextUnlockableGlobalIndex();
        if (idx > nextIdx) {
            window.adsgramManager.showToast(`Cần mở lần lượt từ Ô Đất ${nextIdx + 1} trước!`, 'warning');
            return;
        }

        // Ô đất đầu tiên (idx === 0)
        if (idx === 0) {
            if (this.data.plots[0].unlocked) {
                document.getElementById('modal-unlock-plot').classList.add('hidden');
                return;
            }
            if ((this.data.plot0AdsWatched || 0) < 2) {
                await this.watchAdForPlot0();
                return;
            }
            this.data.plots[0].unlocked = true;
            window.sound.playFanfare();
            window.adsgramManager.showToast('🎉 Mở khóa thành công Ô Đất Đầu Tiên! Bạn có thể gieo hạt ngay bây giờ!', 'success');
            document.getElementById('modal-unlock-plot').classList.add('hidden');
            this.pendingUnlockIndex = null;
            this.save();
            this.renderPlots();
            this.updateHeaderUI();
            return;
        }

        const req = this.getPlotUnlockRequirements(idx);
        if (!req) return;

        if ((this.data.level || 1) < req.requiredLevel) {
            window.adsgramManager.showToast(`⚠️ Bạn cần đạt Cấp độ Lv.${req.requiredLevel} để mở ô đất thứ ${req.plotNumber}! Hiện bạn đang ở Lv.${this.data.level || 1}. Hãy nướng bánh hoặc ăn cá để tăng EXP!`, 'warning');
            return;
        }

        const missing = [];
        if (this.data.gold < req.gold) missing.push(`${(req.gold - this.data.gold).toLocaleString()} Vàng`);
        req.resources.forEach(r => {
            const have = this.data.inventory[r.id] || 0;
            if (have < r.qty) missing.push(`${r.qty - have} ${RESOURCE_ITEMS[r.id].name}`);
        });
        req.crops.forEach(c => {
            const have = this.data.inventory[c.id] || 0;
            if (have < c.qty) missing.push(`${c.qty - have} ${SEED_TYPES[c.id].name}`);
        });

        if (missing.length > 0) {
            window.adsgramManager.showToast(`Còn thiếu: ${missing.slice(0, 3).join(', ')}! Hãy chặt Cây / đào Đá trên đảo hoặc thu hoạch cây!`, 'warning');
            return;
        }

        // Trừ Vàng, Tài nguyên Đảo & Nông sản trong kho
        this.data.gold -= req.gold;
        req.resources.forEach(r => {
            this.data.inventory[r.id] -= r.qty;
            if (this.data.inventory[r.id] <= 0) delete this.data.inventory[r.id];
        });
        req.crops.forEach(c => {
            this.data.inventory[c.id] -= c.qty;
            if (this.data.inventory[c.id] <= 0) delete this.data.inventory[c.id];
        });

        // Mở ô đất + Sinh thêm Mỏ Tài Nguyên mới lên Đảo (tối đa 20 ô mỗi loại)!
        this.data.plots[idx].unlocked = true;
        if (!Array.isArray(this.data.resourceNodes)) this.syncInitialResourceNodesForSave();
        const currentCounts = { tree: 0, stone: 0, iron: 0, gold_rock: 0 };
        this.data.resourceNodes.forEach(n => {
            if (currentCounts[n.type] !== undefined) currentCounts[n.type]++;
        });

        let nextUid = this.data.nextNodeUid || (this.data.resourceNodes.length + 1);
        const grantedNames = [];
        req.grantNodes.forEach(type => {
            this.data.resourceNodes.push({ uid: nextUid++, type, harvestedAt: 0 });
            if (currentCounts[type] !== undefined) currentCounts[type]++;
            const nm = RESOURCE_NODES_META[type];
            const dm = RESOURCE_ITEMS[nm.dropItemId];
            grantedNames.push(`${dm.icon} ${nm.name}`);
        });
        this.data.nextNodeUid = nextUid;

        this.currentLandTier = req.tier;
        this.pendingUnlockIndex = null;

        document.getElementById('modal-unlock-plot').classList.add('hidden');

        if (req.isTierBreakthrough) {
            window.sound.playFanfare();
            window.adsgramManager.showToast(`🎉 ĐỘT PHÁ ĐẤT CẤP ${req.tier}! Nhận thêm: ${grantedNames.join(', ')}!`, 'success');
        } else {
            window.sound.playFanfare();
            window.adsgramManager.showToast(`🔓 Mở Ô Đất ${req.plotNumber} thành công! Đã thêm ${grantedNames.join(', ')} lên đảo!`, 'success');
        }

        this.save();
        this.renderAll();
    }

    consumeSeedForPlant(seed) {
        const bagQty = (this.data.seedBag && this.data.seedBag[seed.id]) || 0;
        if (bagQty > 0) {
            this.data.seedBag[seed.id] -= 1;
            return { ok: true, source: 'bag', goldSpent: 0 };
        }
        const stockMap = this.ensureNpcStock();
        const stockKey = `seed_${seed.id}`;
        const stock = stockMap[stockKey] || 0;
        const tierMeta = SEED_TIER_META[seed.tier] || SEED_TIER_META.normal;
        const maxStock = seed.maxStock !== undefined ? seed.maxStock : tierMeta.maxStock;
        if (stock <= 0) {
            return { ok: false, reason: 'stock', tierMeta, maxStock };
        }
        if (this.data.gold < seed.seedCost) {
            return { ok: false, reason: 'gold', tierMeta, maxStock };
        }
        this.data.gold = Math.round((this.data.gold - seed.seedCost) * 10) / 10;
        stockMap[stockKey] = stock - 1;
        return { ok: true, source: 'gold', goldSpent: seed.seedCost };
    }

    plantAllEmptyPlots() {
        const seed = SEED_TYPES[this.data.selectedSeed] || SEED_TYPES.rau_mam;
        const startIdx = (this.currentLandTier - 1) * 36;
        const tierPlots = this.data.plots.slice(startIdx, startIdx + 36).filter(p => p.unlocked && !p.crop);

        if (tierPlots.length === 0) {
            window.adsgramManager.showToast("Không còn ô đất trống nào ở cấp này!", "info");
            return;
        }

        const isLongCrop = seed.growTime >= 3600;
        const now = Date.now();
        let plantedFromBag = 0;
        let plantedFromGold = 0;
        let goldSpent = 0;
        let lastFailure = null;
        for (const plot of tierPlots) {
            const res = this.consumeSeedForPlant(seed);
            if (!res.ok) {
                lastFailure = res;
                break;
            }
            if (res.source === 'bag') {
                plantedFromBag++;
            } else {
                goldSpent += res.goldSpent;
                plantedFromGold++;
            }
            plot.crop = seed.id;
            if (isLongCrop) {
                plot.watered = false;
                plot.plantedAt = 0; // Cây >= 1h gieo xong phải tưới nước thì cây mới lớn
            } else {
                plot.watered = true; // Cây dưới 1h không cần tưới vẫn sẽ lớn
                plot.plantedAt = now;
            }
        }

        const totalPlanted = plantedFromBag + plantedFromGold;
        if (totalPlanted === 0) {
            if (lastFailure && lastFailure.reason === 'stock') {
                const limitMax = lastFailure.maxStock || lastFailure.tierMeta.maxStock;
                window.adsgramManager.showToast(`Đã mua hết giới hạn ${limitMax} hạt ${seed.name}! Vào Phú Nông bấm Đặt lại Hạt Giống (${SEED_RESET_DIAMONDS.toLocaleString()}💎) để mua tiếp!`, "warning");
            } else {
                window.adsgramManager.showToast(`Hết hạt trong túi và không đủ ${seed.seedCost.toLocaleString('vi-VN')}💰 Vàng để mua hạt ${seed.name}!`, "warning");
            }
            return;
        }

        window.sound.playClick();
        goldSpent = Math.round(goldSpent * 10) / 10;
        const detail = goldSpent > 0 ? `(-${goldSpent.toLocaleString('vi-VN')}💰 Vàng)` : '(Dùng từ Túi Hạt Giống)';
        const waterNote = isLongCrop ? ' • 💧 Bấm "Tưới Nước" để cây bắt đầu lớn!' : ' • 🌱 Cây tự lớn không cần tưới.';
        window.adsgramManager.showToast(`🌱 Đã gieo ${totalPlanted} ô ${seed.name} ${detail}!${waterNote}`, "success");
        this.save();
        this.renderAll();
    }

    harvestAllReadyPlots() {
        const startIdx = (this.currentLandTier - 1) * 36;
        const tierPlots = this.data.plots.slice(startIdx, startIdx + 36).filter(p => p.unlocked && p.crop);
        const tierSpeedMult = this.currentLandTier === 3 ? 0.5 : (this.currentLandTier === 2 ? 0.75 : 1);
        const now = Date.now();

        let harvestedCount = 0;
        let totalYield = 0;
        let waitingWaterCount = 0;

        tierPlots.forEach(plot => {
            const seed = SEED_TYPES[plot.crop] || SEED_TYPES.rau_mam;
            const isLongCrop = seed.growTime >= 3600;
            if (isLongCrop && !plot.watered) {
                waitingWaterCount++;
                return;
            }

            const totalTime = seed.growTime * 1000 * tierSpeedMult; // Tưới nước chỉ kích hoạt cây bắt đầu lớn, không giảm thời gian
            if (plot.plantedAt > 0 && now - plot.plantedAt >= totalTime) {
                const tier = plot.tier || Math.floor(plot.id / 36) + 1;
                const x2Chance = tier === 3 ? 0.6 : (tier === 2 ? 0.3 : 0);
                const qty = Math.random() < x2Chance ? 2 : 1;

                // Thu hoạch nông sản CHỈ nhận nông sản vào kho, ngoài ra không nhận thêm gì khác
                this.data.inventory[seed.id] = (this.data.inventory[seed.id] || 0) + qty;

                plot.crop = null;
                plot.plantedAt = 0;
                plot.watered = false;
                harvestedCount++;
                totalYield += qty;
            }
        });

        if (harvestedCount === 0) {
            if (waitingWaterCount > 0) {
                window.adsgramManager.showToast(`Có ${waitingWaterCount} ô cây (≥ 1h) cần tưới nước trước thì cây mới bắt đầu lớn! Hãy bấm nút 'Tưới Nước'.`, "warning");
            } else {
                window.adsgramManager.showToast("Chưa có cây nào chín ở cấp đất này!", "info");
            }
            return;
        }

        this.incrementQuest('harvest', harvestedCount);
        window.sound.playHarvest();
        const extraNote = waitingWaterCount > 0 ? ` (Còn ${waitingWaterCount} ô ≥ 1h cần tưới nước để lớn)` : '';
        window.adsgramManager.showToast(
            `🌾 Thu hoạch ${harvestedCount} ô nhận ${totalYield} nông sản!${extraNote}`,
            "success"
        );
        this.save();
        this.renderAll();
    }

    plantSeed(plotId) {
        const plot = this.data.plots.find(p => p.id === plotId);
        if (!plot || !plot.unlocked || plot.crop) return;

        const seed = SEED_TYPES[this.data.selectedSeed] || SEED_TYPES.rau_mam;
        const res = this.consumeSeedForPlant(seed);
        if (!res.ok) {
            if (res.reason === 'stock') {
                const limitMax = res.maxStock || res.tierMeta.maxStock;
                window.adsgramManager.showToast(`Đã mua hết giới hạn ${limitMax} hạt ${seed.name}! Vào Phú Nông bấm Đặt lại Hạt Giống (${SEED_RESET_DIAMONDS.toLocaleString()}💎)!`, 'warning');
            } else {
                window.adsgramManager.showToast(`Hết hạt trong túi & không đủ Vàng mua ${seed.name}! Có thể đổi VND -> Vàng ở Chợ!`, 'warning');
            }
            return;
        }

        const isLongCrop = seed.growTime >= 3600;
        plot.crop = seed.id;
        if (isLongCrop) {
            plot.watered = false;
            plot.plantedAt = 0; // Cây >= 1h gieo xong phải tưới nước thì cây mới lớn
            window.adsgramManager.showToast(`🌱 Đã gieo ${seed.name} (≥ 1h)! Bấm 'Tưới Nước' để cây bắt đầu lớn!`, "info");
        } else {
            plot.watered = true; // Cây dưới 1h không cần tưới vẫn sẽ lớn
            plot.plantedAt = Date.now();
            window.adsgramManager.showToast(`🌱 Đã gieo ${seed.name} (< 1h)! Cây tự lớn không cần tưới.`, "success");
        }

        window.sound.playClick();
        this.save();
        this.renderAll();
    }

    waterPlot(plotId) {
        this.waterAllPlotsWith2Ads();
    }

    async waterAllPlotsWith2Ads() {
        const unwateredLongPlots = this.data.plots.filter(p => {
            if (!p.unlocked || !p.crop) return false;
            const seed = SEED_TYPES[p.crop];
            return seed && seed.growTime >= 3600 && !p.watered;
        });

        if (unwateredLongPlots.length === 0) {
            const hasShortPlots = this.data.plots.some(p => p.unlocked && p.crop && (SEED_TYPES[p.crop]?.growTime < 3600));
            if (hasShortPlots) {
                window.adsgramManager.showToast("Cây trồng dưới 1h tự động lớn không cần tưới! Chỉ cây trồng từ 1h trở lên mới có thể tưới nước.", "info");
            } else {
                const anyPlanted = this.data.plots.some(p => p.unlocked && p.crop);
                if (!anyPlanted) {
                    window.adsgramManager.showToast("Chưa có cây trồng nào trên đất để tưới nước!", "info");
                } else {
                    window.adsgramManager.showToast("Toàn bộ cây trồng từ 1h trở lên đã được tưới nước và đang phát triển!", "info");
                }
            }
            return;
        }

        const success = await window.adsgramManager.showTwoWaterAds();
        if (success) {
            const now = Date.now();
            unwateredLongPlots.forEach(p => {
                p.watered = true;
                p.plantedAt = now; // Bắt đầu tính giờ phát triển từ lúc tưới nước xong
            });
            window.sound.playWaterSplash();
            window.adsgramManager.showToast(`💧 Đã xem đủ 2 quảng cáo! Tưới nước thành công cho ${unwateredLongPlots.length} ô cây trồng (≥ 1h), cây bắt đầu lớn!`, "success");
            this.save();
            this.renderAll();
        }
    }

    openSeedSelectModal() {
        const modal = document.getElementById('modal-select-seed');
        if (!modal) return;
        this.renderSeedSelectList('all');
        modal.classList.remove('hidden');
    }

    renderSeedSelectList(filter = 'all') {
        const list = document.getElementById('seed-select-list');
        if (!list) return;

        document.querySelectorAll('.seed-select-tab').forEach(tab => {
            const isMatch = tab.getAttribute('data-filter') === filter;
            tab.classList.toggle('active', isMatch);
            tab.classList.toggle('bg-emerald-700', isMatch);
            tab.classList.toggle('text-white', isMatch);
            tab.classList.toggle('bg-white', !isMatch);
            tab.classList.toggle('text-slate-700', !isMatch);
        });

        const stockMap = this.ensureNpcStock();
        const ordered = this.getOrderedSeedTypes();
        const filtered = ordered.filter(s => filter === 'all' || s.tier === filter);

        list.innerHTML = filtered.map(s => {
            const tierMeta = SEED_TIER_META[s.tier] || SEED_TIER_META.normal;
            const maxS = s.maxStock !== undefined ? s.maxStock : tierMeta.maxStock;
            const isSelected = this.data.selectedSeed === s.id;
            const bagCount = (this.data.seedBag && this.data.seedBag[s.id]) || 0;
            const stock = stockMap[`seed_${s.id}`] ?? maxS;
            const isLongCrop = s.growTime >= 3600;

            return `
                <div class="seed-select-card p-2 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-300' : 'border-[#78350f]/20 bg-white hover:border-emerald-500 hover:bg-emerald-50/40'
                }" onclick="window.game.selectSeed('${s.id}')">
                    <div class="flex items-center gap-2 min-w-0">
                        <div class="flex-shrink-0">
                            ${this.getSeedPacketSvg(s.id, 'w-10 h-10')}
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-1">
                                <span class="font-black text-slate-900 text-xs">${this.escapeHtml(s.name)}</span>
                                <span class="text-[9.5px] px-1 py-0.2 rounded font-bold ${
                                    s.tier === 'premium' ? 'bg-purple-100 text-purple-700' : (s.tier === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                                }">${tierMeta.label}</span>
                                ${isLongCrop ? '<span class="text-[9px] bg-sky-100 text-sky-800 font-extrabold px-1 rounded border border-sky-300">💧 Cần tưới mới lớn</span>' : '<span class="text-[9px] bg-emerald-50 text-emerald-800 font-extrabold px-1 rounded border border-emerald-300">🌱 Tự lớn</span>'}
                            </div>
                            <div class="text-[10px] text-slate-600 font-bold">
                                ⏱️ Sinh trưởng: <b class="text-amber-800">${s.growTimeLabel}</b> • Giá: <b class="text-amber-700">${s.seedCost.toLocaleString('vi-VN')}💰 Vàng</b>
                            </div>
                            <div class="text-[9.5px] text-slate-500">
                                🎒 Trong túi: <b class="${bagCount > 0 ? 'text-emerald-700' : 'text-slate-400'}">${bagCount}</b> • Phú Nông còn: <b class="${stock > 0 ? 'text-slate-700' : 'text-rose-600'}">${stock}/${maxS}</b>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1 flex-shrink-0">
                        ${isSelected ? '<span class="px-2 py-1 bg-amber-500 text-slate-950 font-black text-[9.5px] rounded-lg shadow-xs">✓ Đang Chọn</span>' : '<button type="button" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9.5px] rounded-lg active:scale-95 shadow-xs">Chọn Hạt</button>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    selectSeed(seedId) {
        if (!SEED_TYPES[seedId]) return;
        this.data.selectedSeed = seedId;
        const seed = SEED_TYPES[seedId];
        const modal = document.getElementById('modal-select-seed');
        if (modal) modal.classList.add('hidden');
        const seedLabel = document.getElementById('current-selected-seed-label');
        if (seedLabel) seedLabel.innerText = `Gieo: ${seed.name}`;
        window.sound.playClick();
        window.adsgramManager.showToast(`🌱 Đã chọn ${seed.icon} ${seed.name}! Bấm vào ô đất trống để trồng ngay.`, 'success');
        this.save();
        this.renderPlots();
    }

    harvestPlot(plotId) {
        const plot = this.data.plots.find(p => p.id === plotId);
        if (!plot || !plot.crop) return;

        const seed = SEED_TYPES[plot.crop] || SEED_TYPES.rau_mam;
        const isLongCrop = seed.growTime >= 3600;
        // Cây từ 1h trở lên bắt buộc phải tưới nước mới bắt đầu lớn
        if (isLongCrop && !plot.watered) {
            window.adsgramManager.showToast(`💧 Cây ${seed.name} (≥ 1h) cần tưới nước trước thì cây mới bắt đầu lớn! Hãy bấm nút 'Tưới Nước' (xem đủ 2 quảng cáo).`, 'warning');
            return;
        }

        const tierSpeedMult = this.currentLandTier === 3 ? 0.5 : (this.currentLandTier === 2 ? 0.75 : 1);
        const totalTime = seed.growTime * 1000 * tierSpeedMult;
        const now = Date.now();
        if (plot.plantedAt <= 0 || now - plot.plantedAt < totalTime) {
            window.adsgramManager.showToast(`Cây ${seed.name} đang lớn, chưa chín để thu hoạch!`, 'info');
            return;
        }

        const tier = plot.tier || Math.floor(plot.id / 36) + 1;
        const x2Chance = tier === 3 ? 0.6 : (tier === 2 ? 0.3 : 0);
        const qty = Math.random() < x2Chance ? 2 : 1;

        // Thu hoạch nông sản CHỈ thu được nông sản, ngoài ra không nhận thêm gì khác
        this.data.inventory[seed.id] = (this.data.inventory[seed.id] || 0) + qty;
        this.incrementQuest('harvest', 1);
        this.spawnFloatingText(`+${qty} ${seed.icon}`);

        plot.crop = null;
        plot.plantedAt = 0;
        plot.watered = false;

        window.sound.playHarvest();
        this.save();
        this.renderAll();
    }

    speedUpAllPlotsWithAd() {
        const hasGrowingCrops = this.data.plots.some(p => p.unlocked && p.crop);
        if (!hasGrowingCrops) {
            window.adsgramManager.showToast("Hãy gieo hạt lên luống đất trước khi tưới thần tốc!", "warning");
            return;
        }

        window.adsgramManager.showRewardAd('speedup_farm').then(success => {
            if (success) {
                this.data.plots.forEach(p => {
                    if (p.unlocked && p.crop) {
                        p.plantedAt = Date.now() - 99999999;
                    }
                });
                window.sound.playFanfare();
                window.adsgramManager.showToast("Tưới Thần Tốc thành công! Toàn bộ cây đã chín rộ!", "success");
                this.save();
                this.renderPlots();
            }
        });
    }

    // ==========================================
    // NPC PHÚ NÔNG (MUA & BÁN TRỰC TIẾP BẰNG VÀNG)
    // ==========================================
    ensureNpcStock() {
        const fresh = this.createFreshNpcStock();
        const ordered = this.getOrderedSeedTypes();

        if (!this.data.npcStock || !this.data.npcStock.items || typeof this.data.npcStock.items !== 'object' || this.data.npcStock.seedLimitVersion !== 5) {
            this.data.npcStock = fresh;
            return this.data.npcStock.items;
        }

        const items = this.data.npcStock.items;
        this.data.npcStock.date = this.getTodayDateKey();
        this.data.npcStock.seedLimitVersion = 5;

        const cleanItems = {};
        ordered.forEach(s => {
            const tierMeta = SEED_TIER_META[s.tier] || SEED_TIER_META.normal;
            const maxS = s.maxStock !== undefined ? s.maxStock : tierMeta.maxStock;
            const sKey = `seed_${s.id}`;
            if (items[sKey] === undefined) {
                cleanItems[sKey] = maxS;
            } else {
                cleanItems[sKey] = Math.max(0, Math.min(maxS, Number(items[sKey]) || 0));
            }
        });
        this.data.npcStock.items = cleanItems;
        return cleanItems;
    }

    getNpcBuyCatalog() {
        return this.getOrderedSeedTypes().map(s => {
            const tierMeta = SEED_TIER_META[s.tier] || SEED_TIER_META.normal;
            const maxS = s.maxStock !== undefined ? s.maxStock : tierMeta.maxStock;
            return {
                order: s.order,
                key: `seed_${s.id}`,
                kind: 'seed',
                tier: tierMeta.id,
                tierMeta,
                maxStock: maxS,
                targetId: s.id,
                shortName: s.name,
                name: `Hạt ${s.name}`,
                typeLabel: `${tierMeta.icon} ${tierMeta.label} • Tối đa ${maxS} hạt`,
                resultIcon: s.icon,
                growTime: s.growTime,
                growTimeLabel: s.growTimeLabel,
                priceGold: s.seedCost,
                sellGold: s.sellGold,
                diamonds: s.diamonds || 0
            };
        });
    }

    getFilteredNpcBuyCatalog(catalog = this.getNpcBuyCatalog()) {
        if (this.npcSeedTierFilter && this.npcSeedTierFilter !== 'all') {
            return catalog.filter(i => i.tier === this.npcSeedTierFilter);
        }
        return catalog;
    }

    getNpcSellCatalog() {
        const ordered = this.getOrderedSeedTypes();
        const list = ordered.map(s => ({
            order: s.order,
            id: s.id,
            name: s.name,
            icon: s.icon,
            growTimeLabel: s.growTimeLabel,
            seedCost: s.seedCost,
            sellGold: s.sellGold,
            desc: s.desc
        }));
        // Cá KHÔNG THỂ BÁN (chỉ dùng tăng EXP và giao nộp Long Nữ nhận Vàng)
        return list;
    }

    setNpcSeedTierFilter(tier) {
        this.npcSeedTierFilter = ['normal', 'medium', 'premium'].includes(tier) ? tier : 'all';
        this.npcBuyKind = 'seed';
        const filtered = this.getFilteredNpcBuyCatalog();
        if (filtered.length > 0 && !filtered.some(i => i.key === this.npcSelectedBuyKey)) {
            this.npcSelectedBuyKey = filtered[0].key;
        }
        window.sound && window.sound.playClick();
        this.renderNpcShop();
    }

    resetAllSeedsWithDiamonds() {
        const stockMap = this.ensureNpcStock();
        const ordered = this.getOrderedSeedTypes();
        const hasAnyDepleted = ordered.some(s => {
            const tierMeta = SEED_TIER_META[s.tier] || SEED_TIER_META.normal;
            const maxS = s.maxStock !== undefined ? s.maxStock : tierMeta.maxStock;
            return (stockMap[`seed_${s.id}`] || 0) < maxS;
        });

        if (!hasAnyDepleted) {
            window.adsgramManager.showToast('Cả 15 loại hạt giống đều đang đầy kho, chưa cần đặt lại!', 'info');
            return false;
        }
        if ((this.data.diamonds || 0) < SEED_RESET_DIAMONDS) {
            window.adsgramManager.showToast(`Cần ${SEED_RESET_DIAMONDS.toLocaleString()}💎 Kim Cương để đặt lại toàn bộ Hạt Giống!`, 'warning');
            return false;
        }

        this.data.diamonds -= SEED_RESET_DIAMONDS;
        ordered.forEach(s => {
            const tierMeta = SEED_TIER_META[s.tier] || SEED_TIER_META.normal;
            const maxS = s.maxStock !== undefined ? s.maxStock : tierMeta.maxStock;
            stockMap[`seed_${s.id}`] = maxS;
        });

        window.sound && window.sound.playFanfare();
        window.adsgramManager.showToast(`💎 Đã đặt lại kho 15 Hạt Giống về đầy (-${SEED_RESET_DIAMONDS.toLocaleString()}💎)!`, 'success');
        this.save();
        this.renderAll();
        return true;
    }

    openNpcShop(tab = 'buy') {
        window.sound.playClick();
        this.ensureNpcStock();
        this.switchNpcTab(tab);
        document.getElementById('modal-npc-shop').classList.remove('hidden');
    }

    switchNpcTab(tab) {
        this.npcShopTab = tab === 'sell' ? 'sell' : (tab === 'guide' ? 'guide' : 'buy');

        document.querySelectorAll('.npc-shop-tab').forEach(btn => {
            const active = btn.getAttribute('data-npc-tab') === this.npcShopTab;
            btn.classList.toggle('bg-[#efd3a3]', active);
            btn.classList.toggle('text-[#4a260a]', active);
            btn.classList.toggle('bg-[#b3743b]', !active);
            btn.classList.toggle('text-amber-100', !active);
        });

        document.getElementById('npc-panel-buy').classList.toggle('hidden', this.npcShopTab !== 'buy');
        document.getElementById('npc-panel-sell').classList.toggle('hidden', this.npcShopTab !== 'sell');
        document.getElementById('npc-panel-guide').classList.toggle('hidden', this.npcShopTab !== 'guide');

        this.renderNpcShop();
    }

    renderNpcBuyCard(item, st, selectedKey) {
        const isSel = item.key === selectedKey;
        const isMaxed = st <= 0;
        const stockText = `${st}/${item.maxStock}`;
        const stockBadgeCls = isMaxed
            ? 'bg-rose-600 text-white border-rose-900'
            : 'bg-white/95 text-[#3b1c06] border-[#784319]';
        return `
            <button class="relative rounded-xl flex flex-col items-center justify-between p-1.5 pt-3.5 transition min-h-[86px] ${isSel ? 'bg-[#f7e7c8] border-[3px] border-[#3b1c06] shadow-md scale-[1.02]' : 'bg-[#d6a972] hover:bg-[#e5be8b] border-2 border-[#8c5426]'} ${isMaxed ? 'opacity-80' : ''}" onclick="game.npcSelectedBuyKey='${item.key}'; window.sound.playClick(); game.renderNpcShop();">
                <span class="absolute -top-1.5 left-1 bg-[#4a260a] text-amber-100 text-[8px] font-black px-1 rounded leading-tight">${item.growTimeLabel}</span>
                <span class="absolute -top-1.5 right-1 ${stockBadgeCls} border text-[8px] font-black px-1 rounded leading-tight">${stockText}</span>
                <div class="relative my-0.5 flex items-center justify-center">
                    ${this.getSeedPacketSvg(item.targetId, 'w-9 h-9')}
                    <span class="absolute -bottom-1 -right-2 text-[11px] bg-white/90 rounded-full px-0.5 border border-[#784319] leading-none shadow-xs">${item.resultIcon}</span>
                </div>
                <span class="text-[9.5px] font-black text-[#3b1c06] leading-tight w-full text-center line-clamp-1">${item.shortName}</span>
                <span class="text-[8.5px] font-extrabold ${isMaxed ? 'text-rose-700' : 'text-amber-950'} flex items-center justify-center gap-0.5">
                    ${isMaxed ? `🔒 Hết kho` : `${item.priceGold.toLocaleString('vi-VN')}${GOLD_ICON}`}
                </span>
            </button>
        `;
    }

    renderNpcShop() {
        const stockMap = this.ensureNpcStock();
        const fullBuyCatalog = this.getNpcBuyCatalog();
        const buyCatalog = this.getFilteredNpcBuyCatalog(fullBuyCatalog);
        const selectedBuy = buyCatalog.find(i => i.key === this.npcSelectedBuyKey) || buyCatalog[0];

        document.querySelectorAll('.npc-seed-tier-btn').forEach(btn => {
            const tierVal = btn.getAttribute('data-npc-seed-tier');
            const isActive = (this.npcSeedTierFilter || 'all') === tierVal;
            btn.classList.toggle('ring-2', isActive);
            btn.classList.toggle('ring-[#3b1c06]', isActive);
            btn.classList.toggle('scale-[1.03]', isActive);
        });

        if (selectedBuy) {
            this.npcSelectedBuyKey = selectedBuy.key;
            const stock = stockMap[selectedBuy.key] || 0;
            const owned = (this.data.seedBag && this.data.seedBag[selectedBuy.targetId]) || 0;
            const isSeedMaxed = stock <= 0;

            const tierBadgeEl = document.getElementById('npc-buy-tier-badge');
            if (tierBadgeEl) {
                tierBadgeEl.className = `inline-block ${selectedBuy.tierMeta.badgeClass} border text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs`;
                tierBadgeEl.innerText = `${selectedBuy.tierMeta.icon} ${selectedBuy.tierMeta.label} • Max ${selectedBuy.maxStock}`;
            }

            document.getElementById('npc-buy-stock').innerText = `${stock}/${selectedBuy.maxStock} còn lại`;
            document.getElementById('npc-buy-name').innerText = selectedBuy.name;
            document.getElementById('npc-buy-type').innerText = selectedBuy.typeLabel;
            document.getElementById('npc-buy-price').innerHTML = `${selectedBuy.priceGold.toLocaleString('vi-VN')} ${GOLD_ICON}`;
            document.getElementById('npc-buy-owned').innerText = `Hạt đang có trong túi: ${owned}`;

            const noticeEl = document.getElementById('npc-buy-limit-notice');
            if (noticeEl) {
                noticeEl.classList.toggle('hidden', !isSeedMaxed);
                if (isSeedMaxed) {
                    noticeEl.innerText = `🔒 Đã mua đủ giới hạn ${selectedBuy.maxStock} hạt! Hãy bấm Đặt Lại Hạt Giống (${SEED_RESET_DIAMONDS.toLocaleString()}💎) để mua tiếp.`;
                }
            }

            ['btn-npc-buy-1', 'btn-npc-buy-5', 'btn-npc-buy-10'].forEach(btnId => {
                const b = document.getElementById(btnId);
                if (!b) return;
                b.disabled = stock <= 0;
                b.classList.toggle('opacity-45', stock <= 0);
                b.classList.toggle('cursor-not-allowed', stock <= 0);
            });

            const flowEl = document.getElementById('npc-buy-flow');
            const timeEl = document.getElementById('npc-buy-time');
            flowEl.innerHTML = `
                <span class="bg-[#dca86a] p-1 rounded-lg border border-[#784319] inline-flex items-center justify-center">${this.getSeedPacketSvg(selectedBuy.targetId, 'w-7 h-7')}</span>
                <span class="text-xs font-black text-[#5c3010]">▶</span>
                <span class="bg-[#8b5a2b] text-white px-2 py-1 rounded-lg border border-[#5c3010] text-sm">🟫</span>
                <span class="text-xs font-black text-[#5c3010]">▶</span>
                <span class="bg-[#dca86a] p-1 rounded-lg border border-[#784319] inline-flex items-center justify-center text-xl">${selectedBuy.resultIcon}</span>
            `;
            timeEl.innerText = `⏱️ ${selectedBuy.growTimeLabel}`;

            const gridBuy = document.getElementById('npc-buy-grid');
            const tierOrder = this.npcSeedTierFilter && this.npcSeedTierFilter !== 'all'
                ? [this.npcSeedTierFilter]
                : ['normal', 'medium', 'premium'];
            gridBuy.innerHTML = tierOrder.map(tKey => {
                const meta = SEED_TIER_META[tKey];
                const groupItems = buyCatalog.filter(i => i.tier === tKey);
                if (groupItems.length === 0) return '';
                const stockSummary = tKey === 'medium' ? 'Tối đa 30 - 50 hạt' : `Tối đa ${meta.maxStock} hạt`;
                const header = `
                    <div class="col-span-3 flex items-center justify-between px-2 py-1 rounded-lg border ${meta.badgeClass} text-[10px] font-black mt-0.5">
                        <span>${meta.icon} ${meta.label}</span>
                        <span>${stockSummary}</span>
                    </div>
                `;
                return header + groupItems.map(item => this.renderNpcBuyCard(item, stockMap[item.key] || 0, selectedBuy.key)).join('');
            }).join('');
        }

        // Render Tab Bán cho Phú Nông (Chỉ thu về Vàng)
        const sellCatalog = this.getNpcSellCatalog();
        if (!sellCatalog.some(i => i.id === this.npcSelectedSellId)) {
            this.npcSelectedSellId = sellCatalog[0] ? sellCatalog[0].id : 'rau_mam';
        }
        const selectedSell = sellCatalog.find(i => i.id === this.npcSelectedSellId) || sellCatalog[0];
        if (selectedSell) {
            const qtyOwned = this.data.inventory[selectedSell.id] || 0;
            document.getElementById('npc-sell-icon').innerText = selectedSell.icon;
            document.getElementById('npc-sell-name').innerText = selectedSell.order <= 15
                ? `${selectedSell.name} (${selectedSell.growTimeLabel})`
                : selectedSell.name;
            document.getElementById('npc-sell-desc').innerText = selectedSell.desc;
            document.getElementById('npc-sell-price').innerHTML = `+${selectedSell.sellGold.toLocaleString('vi-VN')} ${GOLD_ICON}`;
            document.getElementById('npc-sell-owned').innerText = `${qtyOwned} món`;

            const gridSell = document.getElementById('npc-sell-grid');
            gridSell.innerHTML = sellCatalog.map(item => {
                const owned = this.data.inventory[item.id] || 0;
                const isSel = item.id === selectedSell.id;
                const topLeft = item.order <= 15 ? item.growTimeLabel : 'Trang trại';
                return `
                    <button class="relative rounded-xl flex flex-col items-center justify-between p-1.5 pt-3.5 transition min-h-[78px] ${isSel ? 'bg-[#f7e7c8] border-[3px] border-[#3b1c06] shadow-md scale-[1.02]' : 'bg-[#d6a972] hover:bg-[#e5be8b] border-2 border-[#8c5426]'} ${owned <= 0 ? 'opacity-70' : ''}" onclick="game.npcSelectedSellId='${item.id}'; window.sound.playClick(); game.renderNpcShop();">
                        <span class="absolute -top-1.5 left-1 bg-[#4a260a] text-amber-100 text-[8px] font-black px-1 rounded leading-tight">${topLeft}</span>
                        <span class="absolute -top-1.5 right-1 ${owned > 0 ? 'bg-emerald-500 text-white' : 'bg-white/90 text-slate-600'} border border-[#784319] text-[8px] font-black px-1 rounded leading-tight">${owned}</span>
                        <span class="text-2xl leading-none my-0.5">${item.icon}</span>
                        <span class="text-[9.5px] font-black text-[#3b1c06] leading-tight w-full text-center line-clamp-1">${item.name}</span>
                        <span class="text-[8.5px] font-extrabold text-amber-950 flex items-center justify-center gap-0.5">+${item.sellGold.toLocaleString('vi-VN')}${GOLD_ICON}</span>
                    </button>
                `;
            }).join('');
        }
    }

    buyFromNpc(qty = 1) {
        const stockMap = this.ensureNpcStock();
        const item = this.getNpcBuyCatalog().find(i => i.key === this.npcSelectedBuyKey);
        if (!item) return;

        const available = stockMap[item.key] || 0;
        if (available <= 0) {
            window.adsgramManager.showToast(`Đã mua tối đa ${item.maxStock} ${item.name}! Hãy bấm Đặt Lại Hạt Giống (${SEED_RESET_DIAMONDS.toLocaleString()}💎) để mua tiếp!`, 'warning');
            return;
        }

        const buyQty = Math.min(qty, available);
        const totalCost = Math.round(item.priceGold * buyQty * 10) / 10;
        if (this.data.gold < totalCost) {
            window.adsgramManager.showToast(`Cần ${totalCost.toLocaleString('vi-VN')}💰 Vàng để mua ${buyQty} ${item.name}!`, 'warning');
            return;
        }

        this.data.gold = Math.round((this.data.gold - totalCost) * 10) / 10;
        stockMap[item.key] = available - buyQty;

        if (!this.data.seedBag) this.data.seedBag = {};
        this.data.seedBag[item.targetId] = (this.data.seedBag[item.targetId] || 0) + buyQty;
        this.data.selectedSeed = item.targetId;

        window.sound.playCoin();
        window.adsgramManager.showToast(`🛍️ Đã mua ${buyQty} ${item.name} từ Phú Nông (-${totalCost.toLocaleString('vi-VN')}💰)!`, 'success');
        this.save();
        this.renderAll();
    }

    sellToNpc(qtyOrAll = 1) {
        const catalog = this.getNpcSellCatalog();
        const item = catalog.find(i => i.id === this.npcSelectedSellId);
        if (!item) return;

        if (item.id.startsWith('fish_') || item.id === 'chest') {
            window.adsgramManager.showToast('Cá không thể bán! Chỉ có thể sử dụng để tăng EXP hoặc trả nhiệm vụ cho Long Nữ.', 'warning');
            return;
        }

        const owned = this.data.inventory[item.id] || 0;
        if (owned <= 0) {
            window.adsgramManager.showToast(`Bạn không có ${item.name} nào trong kho để bán!`, 'warning');
            return;
        }

        const sellQty = qtyOrAll === 'all' ? owned : Math.min(owned, Number(qtyOrAll));
        const earnedGold = Math.round(item.sellGold * sellQty * 10) / 10;

        this.data.inventory[item.id] -= sellQty;
        if (this.data.inventory[item.id] <= 0) delete this.data.inventory[item.id];
        this.data.gold = Math.round((this.data.gold + earnedGold) * 10) / 10;

        window.sound.playCoin();
        window.adsgramManager.showToast(`💰 Đã bán trực tiếp ${sellQty} ${item.name} cho Phú Nông nhận +${earnedGold.toLocaleString('vi-VN')}💰 Vàng!`, 'success');
        this.save();
        this.renderAll();
    }

    // ==========================================
    // CẦU CÂU SUNFLOWER LAND (SUNFLOWER FISHING SYSTEM)
    // ==========================================
    getTodayDateKey() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getDailyFishingStats() {
        const today = this.getTodayDateKey();
        if (!this.data.dailyFishing || this.data.dailyFishing.date !== today) {
            this.data.dailyFishing = {
                date: today,
                count: 0
            };
        }
        const maxDaily = 20;
        const count = this.data.dailyFishing.count || 0;
        const remaining = Math.max(0, maxDaily - count);
        return {
            date: today,
            count: count,
            maxDaily: maxDaily,
            remaining: remaining
        };
    }

    getDailyBaitCrops() {
        const todayStr = this.getTodayDateKey();
        let hash = 0;
        for (let i = 0; i < todayStr.length; i++) {
            hash = (hash * 31 + todayStr.charCodeAt(i)) >>> 0;
        }
        const normalList = ['rau_mam', 'anh_dao', 'dau_tay', 'nam_linh_chi', 'khoai_tay'];
        const mediumList = ['carrot', 'tomato', 'rice', 'bap_ngo', 'sunflower'];
        const highList = ['dua_mat', 'nho_tim', 'watermelon', 'bi_ngo', 'lucky_tree'];

        return {
            normal: normalList[hash % normalList.length],
            medium: mediumList[Math.floor(hash / 7) % mediumList.length],
            high: highList[Math.floor(hash / 17) % highList.length]
        };
    }

    getFishingRodCount() {
        if (typeof this.data.fishingRods === 'number') return Math.max(0, this.data.fishingRods);
        if (this.data.tools && typeof this.data.tools.fishing_rod === 'number') return Math.max(0, this.data.tools.fishing_rod);
        if (this.data.inventory && typeof this.data.inventory.fishing_rod === 'number') return Math.max(0, this.data.inventory.fishing_rod);
        return 0;
    }

    consumeFishingRod(qty = 1) {
        if (this.getFishingRodCount() < qty) return false;
        if (typeof this.data.fishingRods === 'number') {
            this.data.fishingRods = Math.max(0, this.data.fishingRods - qty);
            if (this.data.tools) this.data.tools.fishing_rod = this.data.fishingRods;
            return true;
        }
        if (this.data.tools && typeof this.data.tools.fishing_rod === 'number') {
            this.data.tools.fishing_rod = Math.max(0, this.data.tools.fishing_rod - qty);
            this.data.fishingRods = this.data.tools.fishing_rod;
            return true;
        }
        if (this.data.inventory && typeof this.data.inventory.fishing_rod === 'number') {
            this.data.inventory.fishing_rod = Math.max(0, this.data.inventory.fishing_rod - qty);
            if (this.data.inventory.fishing_rod <= 0) delete this.data.inventory.fishing_rod;
            return true;
        }
        return false;
    }

    craftFishingRod(qty = 1) {
        if (!qty || qty <= 0) qty = 1;
        const woodNeeded = 3 * qty;
        const stoneNeeded = 1 * qty;
        const goldNeeded = 20 * qty;

        const currentWood = this.data.inventory?.wood || 0;
        const currentStone = this.data.inventory?.stone || 0;
        const currentGold = this.data.gold || 0;

        if (currentWood < woodNeeded) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Bạn cần thêm ${woodNeeded - currentWood} Gỗ (Wood) để chế tạo ${qty} Cần Câu!`, 'warning');
            return false;
        }
        if (currentStone < stoneNeeded) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Bạn cần thêm ${stoneNeeded - currentStone} Đá (Stone) để chế tạo ${qty} Cần Câu!`, 'warning');
            return false;
        }
        if (currentGold < goldNeeded) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Bạn cần thêm ${(goldNeeded - currentGold).toLocaleString('vi-VN')} Vàng để chế tạo ${qty} Cần Câu!`, 'warning');
            return false;
        }

        // Trừ tài nguyên
        this.data.inventory.wood -= woodNeeded;
        if (this.data.inventory.wood <= 0) delete this.data.inventory.wood;

        this.data.inventory.stone -= stoneNeeded;
        if (this.data.inventory.stone <= 0) delete this.data.inventory.stone;

        this.data.gold = Math.round((this.data.gold - goldNeeded) * 10) / 10;

        // Thêm cần câu
        this.data.fishingRods = (this.data.fishingRods || 0) + qty;
        if (!this.data.tools) this.data.tools = {};
        this.data.tools.fishing_rod = this.data.fishingRods;

        if (window.sound) window.sound.playCoin();
        if (window.adsgramManager) {
            window.adsgramManager.showToast(`🎣 Đã chế tạo thành công ${qty}x Cần Câu (-${woodNeeded} Gỗ, -${stoneNeeded} Đá, -${goldNeeded} Vàng)!`, 'success');
        }

        this.save();
        this.renderAll();
        return true;
    }

    craftFishingRodMax() {
        const currentWood = this.data.inventory?.wood || 0;
        const currentStone = this.data.inventory?.stone || 0;
        const currentGold = this.data.gold || 0;

        const maxByWood = Math.floor(currentWood / 3);
        const maxByStone = Math.floor(currentStone / 1);
        const maxByGold = Math.floor(currentGold / 20);
        const maxQty = Math.min(maxByWood, maxByStone, maxByGold);

        if (maxQty <= 0) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Không đủ nguyên liệu để chế tạo Cần Câu (Cần: 3 Gỗ + 1 Đá + 20 Vàng mỗi cần)!`, 'warning');
            return false;
        }

        return this.craftFishingRod(maxQty);
    }

    buyFishingBait(tier = 'normal') {
        const dailyCrops = this.getDailyBaitCrops();
        const reqCropId = dailyCrops[tier] || dailyCrops.normal;
        const cropMeta = SEED_TYPES[reqCropId];
        const cropHave = this.data.inventory?.[reqCropId] || 0;

        if (cropHave < 5) {
            const tierName = tier === 'normal' ? 'Thường' : tier === 'medium' ? 'Trung Bình' : 'Cao Cấp';
            if (window.adsgramManager) {
                window.adsgramManager.showToast(`Cần 5 ${cropMeta ? cropMeta.name : 'nông sản'} để mua Mồi Câu ${tierName}! Bạn có: ${cropHave}/5. Hãy trồng thêm ở Vườn Cây!`, 'warning');
            }
            return false;
        }

        if (!this.data.inventory) this.data.inventory = {};
        this.data.inventory[reqCropId] -= 5;
        if (this.data.inventory[reqCropId] <= 0) delete this.data.inventory[reqCropId];

        const baitKey = `bait_${tier}`;
        this.data.inventory[baitKey] = (this.data.inventory[baitKey] || 0) + 1;
        this.selectedBaitTier = tier;

        if (window.sound) window.sound.playClick();
        const tierName = tier === 'normal' ? 'Thường' : tier === 'medium' ? 'Trung Bình' : 'Cao Cấp';
        if (window.adsgramManager) {
            window.adsgramManager.showToast(`🎣 Đã mua 1 Mồi Câu ${tierName}! (Trong túi hiện có: ${this.data.inventory[baitKey]} mồi)`, 'success');
        }

        this.save();
        this.renderAll();
        return true;
    }

    selectBaitTier(tier) {
        this.selectedBaitTier = tier;
        this.renderSunflowerFishingUI();
    }

    executeQuickFishing() {
        const daily = this.getDailyFishingStats();
        if (daily.remaining <= 0) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Hôm nay bạn đã đạt giới hạn 20 lần câu! Hãy quay lại vào ngày mai nhé.`, 'warning');
            return false;
        }

        if (this.getFishingRodCount() < 1) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Bạn chưa có Cần Câu! Hãy dùng Gỗ, Đá & Vàng để chế tạo Cần Câu ở Xưởng bên dưới.`, 'warning');
            return false;
        }

        const tier = this.selectedBaitTier || 'normal';
        const tierName = tier === 'normal' ? 'Thường' : (tier === 'medium' ? 'Trung Bình' : 'Cao Cấp');
        const baitCount = this.data.inventory?.[`bait_${tier}`] || 0;

        if (baitCount < 1) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Bạn chưa có Mồi Câu ${tierName}! Hãy bấm nút "Mua" ở mục 3 Cấp Độ Mồi Câu bên dưới.`, 'warning');
            return false;
        }

        return this.castSunflowerFishing(tier);
    }

    castSunflowerFishing(tier = 'normal') {
        const daily = this.getDailyFishingStats();
        if (daily.remaining <= 0) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Hôm nay bạn đã đạt giới hạn 20 lần câu! Hãy quay lại vào ngày mai nhé.`, 'warning');
            return false;
        }

        if (this.getFishingRodCount() < 1) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Bạn chưa có Cần Câu! Hãy dùng Gỗ, Đá & Vàng để chế tạo Cần Câu ở Xưởng bên dưới.`, 'warning');
            return false;
        }

        // Kiểm tra mồi câu theo loại đã chọn
        const actualTier = tier || this.selectedBaitTier || 'normal';
        const baitKey = `bait_${actualTier}`;
        const baitHave = this.data.inventory?.[baitKey] || 0;
        const tierName = actualTier === 'normal' ? 'Thường' : (actualTier === 'medium' ? 'Trung Bình' : 'Cao Cấp');

        if (baitHave < 1) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Bạn chưa có Mồi Câu ${tierName}! Hãy bấm nút "Mua" ở mục 3 Cấp Độ Mồi Câu bên dưới.`, 'warning');
            return false;
        }

        // Trừ 1 cần câu + 1 mồi câu
        this.consumeFishingRod(1);
        this.data.inventory[baitKey] -= 1;
        if (this.data.inventory[baitKey] <= 0) delete this.data.inventory[baitKey];

        // Tăng lượt câu trong ngày
        this.data.dailyFishing.count = (this.data.dailyFishing.count || 0) + 1;

        // Mồi câu thường câu Cá Rô Đồng, mồi câu trung bình câu Cá Chép Vàng, mồi câu cao cấp câu Cá Hồi
        let targetFishId = 'fish_ro';
        if (actualTier === 'medium') {
            targetFishId = 'fish_chep';
        } else if (actualTier === 'high') {
            targetFishId = 'fish_hoi';
        }
        const caughtFish = FISH_TYPES.find(f => f.id === targetFishId) || FISH_TYPES[0];

        // Kích hoạt hiệu ứng quăng cần Sunflower Land
        this.triggerSunflowerCatchAnimation(caughtFish);

        this.currentCatch = { ...caughtFish };
        this.data.totalFishCount = (this.data.totalFishCount || 0) + 1;

        // Ticker thông báo
        const ticker = document.getElementById('live-catch-ticker');
        if (ticker) {
            ticker.innerHTML = `🎣 <b class="text-yellow-300">${this.playerName || 'Bạn'}</b> vừa quăng mồi câu được <b class="text-emerald-300">${caughtFish.icon} ${caughtFish.name}</b>!`;
        }

        if (window.sound) window.sound.playHarvest();

        // Hiển thị modal nhận thưởng
        setTimeout(() => {
            this.showCatchRewardModal(this.currentCatch);
        }, 550);

        this.save();
        this.renderAll();
        return true;
    }

    startFishing() {
        return this.castSunflowerFishing('normal');
    }

    useCrop(cropId, qty = 1) {
        if (!qty || qty <= 0) qty = 1;
        const cropMeta = SEED_TYPES[cropId];
        if (!cropMeta) return false;

        const have = this.data.inventory?.[cropId] || 0;
        if (have < qty) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Bạn không có đủ ${qty} ${cropMeta.name} để sử dụng!`, 'warning');
            return false;
        }

        this.data.inventory[cropId] -= qty;
        if (this.data.inventory[cropId] <= 0) delete this.data.inventory[cropId];

        const expAward = (cropMeta.exp || 1) * qty;
        this.addExp(expAward, 'use_crop');

        if (window.sound) window.sound.playFanfare();
        if (window.adsgramManager) {
            window.adsgramManager.showToast(`😋 Bạn vừa sử dụng ${qty}x ${cropMeta.name}! Nhận ngay +${expAward.toLocaleString('vi-VN')} ⭐ EXP tài khoản!`, 'success');
        }

        this.save();
        this.renderAll();
        return true;
    }

    eatCrop(cropId, qty = 1) {
        return this.useCrop(cropId, qty);
    }

    eatFish(fishId, qty = 1) {
        if (window.adsgramManager) {
            window.adsgramManager.showToast(`Cá câu được chỉ dùng để nấu bánh hoặc trả nhiệm vụ, không thể sử dụng để tăng EXP!`, 'warning');
        }
        return false;
    }

    eatCatchNow() {
        const modal = document.getElementById('modal-catch-reward');
        if (modal) modal.classList.add('hidden');

        if (!this.currentCatch) return;
        const fish = this.currentCatch;
        let expGain = fish.exp || 30;
        if (fish.id === 'fish_ro') expGain = 30;
        else if (fish.id === 'fish_chep') expGain = 60;
        else if (fish.id === 'fish_hoi') expGain = 90;

        this.addExp(expGain, 'fish');
        if (window.sound) window.sound.playCoin();
        if (window.adsgramManager) {
            window.adsgramManager.showToast(`🐟 Thưởng thức "${fish.name}" tươi ngon: +${expGain.toLocaleString()} ⭐ EXP!`, 'success');
        }
        this.currentCatch = null;
        this.save();
        this.renderAll();
    }

    cookFishDish(recipeId) {
        const rec = FISH_COOKING_RECIPES.find(r => r.id === recipeId);
        if (!rec) return false;

        if ((this.data.level || 1) < rec.minLevel) {
            if (window.adsgramManager) window.adsgramManager.showToast(`Yêu cầu Đầu Bếp Cấp ${rec.minLevel} để nấu món "${rec.name}"!`, 'warning');
            return false;
        }

        // Kiểm tra nguyên liệu
        for (const ing of rec.ingredients) {
            const have = this.data.inventory?.[ing.id] || 0;
            if (have < ing.qty) {
                if (window.adsgramManager) window.adsgramManager.showToast(`Thiếu nguyên liệu ${ing.name} (Có: ${have}/${ing.qty}) để nấu "${rec.name}"!`, 'warning');
                return false;
            }
        }

        // Trừ nguyên liệu
        for (const ing of rec.ingredients) {
            this.data.inventory[ing.id] -= ing.qty;
            if (this.data.inventory[ing.id] <= 0) delete this.data.inventory[ing.id];
        }

        // Thưởng EXP tài khoản
        this.addExp(rec.exp, 'cooking');
        this.data.totalCakesCooked = (this.data.totalCakesCooked || 0) + 1;

        if (window.sound) window.sound.playFanfare();
        if (window.adsgramManager) {
            window.adsgramManager.showToast(`🍲 Nấu thành công "${rec.name}"! Nhận ngay +${rec.exp.toLocaleString('vi-VN')} ⭐ EXP tài khoản!`, 'success');
        }

        this.save();
        this.renderAll();
        return true;
    }

    showCatchRewardModal(fish) {
        const modal = document.getElementById('modal-catch-reward');
        if (!modal) return;
        const iconEl = document.getElementById('catch-icon');
        if (iconEl) iconEl.innerText = fish.icon;
        const rarityEl = document.getElementById('catch-rarity-label');
        if (rarityEl) rarityEl.innerText = fish.rarity || 'Cá Hồ Sunflower';
        const nameEl = document.getElementById('catch-name');
        if (nameEl) nameEl.innerText = fish.name;

        let expGain = fish.exp || 30;
        if (fish.id === 'fish_ro') expGain = 30;
        else if (fish.id === 'fish_chep') expGain = 60;
        else if (fish.id === 'fish_hoi') expGain = 90;

        const goldEl = document.getElementById('catch-gold');
        if (goldEl) goldEl.innerText = `+${expGain} ⭐ EXP`;
        const diaEl = document.getElementById('catch-diamonds');
        if (diaEl) diaEl.innerText = `+${fish.diamonds || 0} 💎`;
        const expEl = document.getElementById('catch-exp');
        if (expEl) expEl.innerText = `Tăng EXP / Long Nữ`;
        const eatExpVal = document.getElementById('catch-eat-exp-val');
        if (eatExpVal) eatExpVal.innerText = `${expGain}`;

        const btnEat = document.getElementById('btn-catch-eat-now');
        if (btnEat) btnEat.classList.remove('hidden');

        const btnDouble = document.getElementById('btn-catch-double');
        if (btnDouble) {
            btnDouble.innerText = `🎬 XEM VIDEO NHẬN X2 CÁ`;
        }

        modal.classList.remove('hidden');
    }

    claimCatch(double = false) {
        const modal = document.getElementById('modal-catch-reward');
        if (modal) modal.classList.add('hidden');

        if (!this.currentCatch) return;

        const multiplier = double ? 2 : 1;
        const fish = this.currentCatch;

        if (!this.data.inventory) this.data.inventory = {};
        this.data.inventory[fish.id] = (this.data.inventory[fish.id] || 0) + multiplier;
        this.incrementQuest('fish', 1);

        if (fish.diamonds > 0) {
            this.data.diamonds += fish.diamonds * multiplier;
            if (window.adsgramManager) window.adsgramManager.showToast(`Tuyệt vời! Bạn nhận +${fish.diamonds * multiplier} 💎 Ngọc từ ${fish.name}!`, 'success');
        }

        if (window.sound) window.sound.playCoin();
        if (window.adsgramManager) {
            window.adsgramManager.showToast(`🧺 Đã thu ${multiplier}x ${fish.icon} ${fish.name} vào kho!`, 'success');
        }

        this.currentCatch = null;
        this.save();
        this.renderAll();
    }

    initFishingCanvas() {
        const canvas = document.getElementById('fishing-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            if (canvas.parentElement && canvas.parentElement.clientWidth > 0) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight || 220;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        canvas.addEventListener('pointerdown', (e) => {
            if (e.target && e.target.closest('#fishing-action-corner')) return;
            const rodCount = this.getFishingRodCount();
            const baitNormal = this.data.inventory?.bait_normal || 0;
            const baitMedium = this.data.inventory?.bait_medium || 0;
            const baitHigh = this.data.inventory?.bait_high || 0;
            if (rodCount >= 1 && (baitNormal + baitMedium + baitHigh) >= 1) {
                this.executeQuickFishing();
            }
        });

        let tick = 0;
        this.sunflowerCatchAnim = null;

        const drawLoop = () => {
            const W = canvas.width;
            const H = canvas.height;
            if (W === 0 || H === 0) {
                requestAnimationFrame(drawLoop);
                return;
            }
            ctx.clearRect(0, 0, W, H);
            tick++;

            // 1. Bầu trời & mặt trời Sunflower Land
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.45);
            skyGrad.addColorStop(0, '#7dd3fc');
            skyGrad.addColorStop(1, '#bae6fd');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H * 0.45);

            // Mặt trời
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(W * 0.82, H * 0.16, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
            ctx.beginPath();
            ctx.arc(W * 0.82, H * 0.16, 28, 0, Math.PI * 2);
            ctx.fill();

            // Mây trôi
            const cloudX = ((tick * 0.25) % (W + 80)) - 40;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(cloudX, H * 0.14, 12, 0, Math.PI * 2);
            ctx.arc(cloudX + 10, H * 0.11, 15, 0, Math.PI * 2);
            ctx.arc(cloudX + 22, H * 0.14, 11, 0, Math.PI * 2);
            ctx.fill();

            // Rặng đồi xanh xa
            ctx.fillStyle = '#65a30d';
            ctx.beginPath();
            ctx.moveTo(0, H * 0.45);
            ctx.quadraticCurveTo(W * 0.3, H * 0.32, W * 0.6, H * 0.44);
            ctx.quadraticCurveTo(W * 0.85, H * 0.36, W, H * 0.42);
            ctx.lineTo(W, H * 0.45);
            ctx.lineTo(0, H * 0.45);
            ctx.closePath();
            ctx.fill();

            // 2. Mặt nước hồ xanh biếc ngọc bích lấp lánh sóng
            const waterGrad = ctx.createLinearGradient(0, H * 0.42, 0, H);
            waterGrad.addColorStop(0, '#0284c7');
            waterGrad.addColorStop(0.5, '#0369a1');
            waterGrad.addColorStop(1, '#075985');
            ctx.fillStyle = waterGrad;
            ctx.fillRect(0, H * 0.42, W, H * 0.58);

            // Sóng nước
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 5; i++) {
                const waveY = H * (0.48 + i * 0.1);
                const offset = (tick * 0.8 + i * 35) % 90;
                ctx.beginPath();
                ctx.moveTo(W * 0.35 + offset, waveY);
                ctx.quadraticCurveTo(W * 0.35 + offset + 15, waveY - 2, W * 0.35 + offset + 30, waveY);
                ctx.stroke();
            }

            // Bóng cá bơi lội
            for (let i = 0; i < 3; i++) {
                const fishProg = ((tick * (0.5 + i * 0.2) + i * 140) % (W * 0.7)) + W * 0.3;
                const fishY = H * (0.55 + i * 0.12) + Math.sin(tick * 0.05 + i) * 3;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
                ctx.beginPath();
                ctx.ellipse(fishProg, fishY, 10, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 3. Cầu gỗ (Pier) và bờ cỏ
            const pierW = W * 0.38;
            const pierY = H * 0.62;

            ctx.fillStyle = '#4d7c0f';
            ctx.beginPath();
            ctx.moveTo(0, H * 0.38);
            ctx.lineTo(W * 0.22, H * 0.52);
            ctx.lineTo(W * 0.18, H);
            ctx.lineTo(0, H);
            ctx.closePath();
            ctx.fill();

            // Cột cầu
            ctx.fillStyle = '#451a03';
            ctx.fillRect(pierW * 0.5, pierY + 8, 8, H - pierY);
            ctx.fillRect(pierW * 0.88, pierY + 8, 8, H - pierY);

            // Sàn cầu
            ctx.fillStyle = '#78350f';
            ctx.fillRect(0, pierY, pierW, 14);
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1;
            for (let gx = 15; gx < pierW; gx += 18) {
                ctx.beginPath();
                ctx.moveTo(gx, pierY);
                ctx.lineTo(gx, pierY + 14);
                ctx.stroke();
            }

            // Xô cá
            const bucketX = pierW * 0.55;
            const bucketY = pierY - 12;
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(bucketX - 7, bucketY);
            ctx.lineTo(bucketX + 7, bucketY);
            ctx.lineTo(bucketX + 5, bucketY + 12);
            ctx.lineTo(bucketX - 5, bucketY + 12);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(bucketX - 5, bucketY + 2, 10, 2);

            // 4. Nông dân Sunflower Land
            const farmerX = pierW * 0.82;
            const farmerY = pierY;

            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(farmerX - 5, farmerY - 14, 10, 14);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(farmerX - 5, farmerY - 22, 10, 8);

            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.arc(farmerX, farmerY - 26, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ca8a04';
            ctx.beginPath();
            ctx.ellipse(farmerX, farmerY - 30, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(farmerX - 5, farmerY - 34, 10, 4);

            // Cần câu & Dây câu
            const rodTipX = farmerX + 45;
            const rodTipY = farmerY - 42;
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(farmerX + 4, farmerY - 18);
            ctx.quadraticCurveTo(farmerX + 25, farmerY - 32, rodTipX, rodTipY);
            ctx.stroke();

            const bobberX = W * 0.65;
            const bobberY = H * 0.68 + Math.sin(tick * 0.08) * 2;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(rodTipX, rodTipY);
            ctx.quadraticCurveTo((rodTipX + bobberX) / 2, Math.min(rodTipY, bobberY) - 8, bobberX, bobberY);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bobberX, bobberY, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bobberX, bobberY - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            const ripR = (tick * 0.4) % 14;
            ctx.beginPath();
            ctx.ellipse(bobberX, bobberY + 2, ripR, ripR * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 5. Hiệu ứng cá bay lên giỏ khi câu thành công
            if (this.sunflowerCatchAnim) {
                const anim = this.sunflowerCatchAnim;
                anim.t += 0.04;
                const curX = bobberX + (bucketX - bobberX) * anim.t;
                const arcHeight = Math.sin(anim.t * Math.PI) * 70;
                const curY = bobberY + (bucketY - bobberY) * anim.t - arcHeight;

                ctx.font = '24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(anim.icon, curX, curY);

                if (anim.t >= 1) {
                    this.sunflowerCatchAnim = null;
                }
            }

            requestAnimationFrame(drawLoop);
        };

        requestAnimationFrame(drawLoop);
    }

    triggerSunflowerCatchAnimation(fish) {
        this.sunflowerCatchAnim = {
            icon: fish.icon || '🐟',
            t: 0
        };
    }

    renderSunflowerFishingUI() {
        const view = document.getElementById('view-fishing');
        if (!view) return;

        const daily = this.getDailyFishingStats();
        const dailyCountEl = document.getElementById('daily-fish-count');
        if (dailyCountEl) dailyCountEl.innerText = `${daily.count}`;

        const ownedRodsEl = document.getElementById('owned-rods-count');
        if (ownedRodsEl) ownedRodsEl.innerText = `${this.getFishingRodCount()}`;

        // Tài nguyên chế cần
        const woodEl = document.getElementById('craft-wood-have');
        if (woodEl) woodEl.innerText = `${this.data.inventory?.wood || 0} / 3`;

        const stoneEl = document.getElementById('craft-stone-have');
        if (stoneEl) stoneEl.innerText = `${this.data.inventory?.stone || 0} / 1`;

        const goldEl = document.getElementById('craft-gold-have');
        if (goldEl) goldEl.innerText = `${this.data.gold || 0} / 20`;

        // 3 Cấp độ mồi câu
        const dailyCrops = this.getDailyBaitCrops();
        const tiers = ['normal', 'medium', 'high'];
        tiers.forEach(tier => {
            const cropId = dailyCrops[tier];
            const cropMeta = SEED_TYPES[cropId];
            const have = this.data.inventory?.[cropId] || 0;

            const labelEl = document.getElementById(`bait-crop-${tier}-label`);
            if (labelEl && cropMeta) {
                labelEl.innerHTML = `${cropMeta.icon} 5x ${cropMeta.name}`;
            }

            const haveEl = document.getElementById(`bait-crop-${tier}-have`);
            if (haveEl) {
                haveEl.innerHTML = `<span class="${have >= 5 ? 'text-emerald-700 font-black' : 'text-rose-600 font-bold'}">${have} / 5</span>`;
            }
        });

        // Mồi câu trong túi
        const baitNormal = this.data.inventory?.bait_normal || 0;
        const baitMedium = this.data.inventory?.bait_medium || 0;
        const baitHigh = this.data.inventory?.bait_high || 0;
        const totalBait = baitNormal + baitMedium + baitHigh;
        const rodCount = this.getFishingRodCount();

        // 1. Hiển thị số mồi trên thanh thống kê Ảnh 4
        const baitNormalEl = document.getElementById('owned-bait-normal');
        if (baitNormalEl) baitNormalEl.innerText = `${baitNormal}`;
        const baitMediumEl = document.getElementById('owned-bait-medium');
        if (baitMediumEl) baitMediumEl.innerText = `${baitMedium}`;
        const baitHighEl = document.getElementById('owned-bait-high');
        if (baitHighEl) baitHighEl.innerText = `${baitHigh}`;

        // 2. Hiển thị số mồi trên từng card mồi
        const cardBaitNormalEl = document.getElementById('bait-owned-normal');
        if (cardBaitNormalEl) cardBaitNormalEl.innerText = `${baitNormal} mồi`;
        const cardBaitMediumEl = document.getElementById('bait-owned-medium');
        if (cardBaitMediumEl) cardBaitMediumEl.innerText = `${baitMedium} mồi`;
        const cardBaitHighEl = document.getElementById('bait-owned-high');
        if (cardBaitHighEl) cardBaitHighEl.innerText = `${baitHigh} mồi`;

        // 3. Nút Câu Cá & Chọn Loại Mồi ở góc màn hình (Luôn hiện, thiếu gì bấm vào sẽ thông báo)
        const cornerActionEl = document.getElementById('fishing-action-corner');
        const cornerBadgeEl = document.getElementById('quick-fishing-bait-badge');
        const selectorEl = document.getElementById('fishing-bait-selector-corner');

        if (cornerActionEl) {
            cornerActionEl.classList.remove('hidden');

            const activeTier = this.selectedBaitTier || 'normal';
            const tierShortName = activeTier === 'normal' ? 'Thường' : (activeTier === 'medium' ? 'TB' : 'Cao Cấp');
            const curCount = this.data.inventory?.[`bait_${activeTier}`] || 0;
            if (cornerBadgeEl) {
                cornerBadgeEl.innerText = `${tierShortName} (${curCount})`;
            }

            // Thanh chọn 3 loại mồi câu nhanh luôn hiển thị
            if (selectorEl) {
                selectorEl.classList.remove('hidden');
                const allTiers = [
                    { id: 'normal', label: 'Thường', icon: '🟢', count: baitNormal },
                    { id: 'medium', label: 'TB', icon: '🔵', count: baitMedium },
                    { id: 'high', label: 'Cao Cấp', icon: '👑', count: baitHigh }
                ];
                selectorEl.innerHTML = allTiers.map(t => {
                    const isSel = t.id === activeTier;
                    return `
                        <button type="button" onclick="game.selectBaitTier('${t.id}')"
                            class="px-2 py-0.5 rounded-lg text-[9px] font-black transition active:scale-95 cursor-pointer ${isSel ? 'bg-amber-400 text-slate-950 shadow ring-1 ring-white/50' : 'bg-white/20 text-white hover:bg-white/30'}">
                            <span>${t.icon} ${t.label} (${t.count})</span>
                        </button>
                    `;
                }).join('');
            }
        }

        // Giỏ cá của bạn
        const basketContainer = document.getElementById('fish-basket-list');
        const totalBasketEl = document.getElementById('total-fish-basket-count');
        if (basketContainer) {
            const ownedFishList = FISH_TYPES.filter(f => (this.data.inventory?.[f.id] || 0) > 0);
            const totalCount = ownedFishList.reduce((sum, f) => sum + (this.data.inventory[f.id] || 0), 0);
            if (totalBasketEl) totalBasketEl.innerText = `${totalCount} con`;

            if (ownedFishList.length === 0) {
                basketContainer.innerHTML = `
                    <div class="col-span-full py-4 text-center text-slate-500 text-xs italic">
                        Giỏ câu đang trống! Hãy chế tạo Cần và chọn mồi câu bên trên để kéo cá nhé!
                    </div>
                `;
            } else {
                basketContainer.innerHTML = ownedFishList.map(fish => {
                    const qty = this.data.inventory[fish.id];
                    return `
                        <div class="bg-white/95 rounded-2xl p-2.5 border-2 border-emerald-400/60 shadow-sm flex flex-col justify-between gap-1.5">
                            <div class="flex justify-between items-start">
                                <span class="text-3xl">${fish.icon}</span>
                                <span class="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">x${qty}</span>
                            </div>
                            <div>
                                <div class="font-black text-xs text-slate-900 truncate">${fish.name}</div>
                                <div class="text-[10px] text-amber-800 font-bold">🐟 Dùng nấu bánh / NV</div>
                                <div class="text-[9.5px] text-emerald-700 font-extrabold">Giá chợ: ${fish.sellVnd.toLocaleString('vi-VN')}đ</div>
                            </div>
                            <div class="mt-1">
                                <div class="w-full py-1.5 bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[10px] rounded-xl text-center shadow-xs">
                                    🍳 Dùng Nấu Bánh / NV
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Bếp nấu cá
        const cookingContainer = document.getElementById('fish-cooking-list');
        if (cookingContainer) {
            cookingContainer.innerHTML = FISH_COOKING_RECIPES.map(rec => {
                const canCook = rec.ingredients.every(ing => (this.data.inventory?.[ing.id] || 0) >= ing.qty);
                const isLevelMet = (this.data.level || 1) >= rec.minLevel;
                const ingsHtml = rec.ingredients.map(ing => {
                    const have = this.data.inventory?.[ing.id] || 0;
                    const ok = have >= ing.qty;
                    return `<span class="${ok ? 'text-emerald-700 font-bold' : 'text-rose-600 font-semibold'}">${ing.icon} ${ing.name} (${have}/${ing.qty})</span>`;
                }).join(' + ');

                return `
                    <div class="bg-white/95 rounded-2xl p-2.5 border-2 border-amber-300 shadow-sm flex flex-col justify-between gap-2">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-2xl">${rec.icon}</span>
                                <div>
                                    <div class="font-black text-xs text-amber-950">${rec.name}</div>
                                    <div class="text-[10px] text-amber-800 font-extrabold">+${rec.exp.toLocaleString('vi-VN')} ⭐ EXP tài khoản</div>
                                </div>
                            </div>
                            <span class="text-[9px] font-black px-1.5 py-0.5 rounded ${isLevelMet ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-600'}">Lv.${rec.minLevel}</span>
                        </div>
                        <div class="text-[10px] text-slate-600 leading-tight">
                            Nguyên liệu: ${ingsHtml}
                        </div>
                        <button type="button" onclick="game.cookFishDish('${rec.id}')" class="w-full py-1.5 ${canCook && isLevelMet ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black' : 'bg-slate-200 text-slate-500 font-bold cursor-not-allowed'} text-xs rounded-xl shadow active:scale-95 flex items-center justify-center gap-1">
                            <span>🍳 Nấu Ngay (+${rec.exp.toLocaleString('vi-VN')} EXP)</span>
                        </button>
                    </div>
                `;
            }).join('');
        }
    }

    openReportModal() {
        const totalEl = document.getElementById('report-total-count');
        if (totalEl) totalEl.innerText = `${this.data.totalFishCount || 0} con`;
        const sessionEl = document.getElementById('report-session-info');
        if (sessionEl) sessionEl.innerText = `${this.sessionEntryTime || 'Hôm nay'} • Tỉ lệ 100%`;

        const pricesEl = document.getElementById('report-fish-prices');
        if (pricesEl) {
            pricesEl.innerHTML = FISH_TYPES.map(f => `
                <div class="flex justify-between items-center p-1.5 rounded-lg ${f.isBigFish ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-100'}">
                    <div class="flex items-center gap-1.5">
                        <span class="text-base">${f.icon}</span>
                        <div>
                            <div class="font-black text-slate-800 leading-tight">${f.name}</div>
                            <div class="text-[9.5px] ${f.isBigFish ? 'text-amber-700 font-black' : 'text-slate-500'}">
                                ${f.rarity} • +${f.exp} EXP
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-black text-amber-700">+${f.exp} EXP</div>
                        <div class="text-[9px] font-black text-sky-700">Trả Long Nữ</div>
                        ${f.diamonds > 0 ? `<div class="text-[9.5px] font-black text-cyan-600">+${f.diamonds} 💎</div>` : ''}
                    </div>
                </div>
            `).join('');
        }

        const reportModal = document.getElementById('modal-report');
        if (reportModal) reportModal.classList.remove('hidden');
    }

    // ==========================================
    // CHĂN NUÔI TRANG TRẠI GÀ (CHICKEN COOP)
    // ==========================================
    isChickenBoostActive() {
        return Date.now() < (this.data.chickenBoostUntil || 0);
    }

    isPhoenixActive() {
        return Date.now() < (this.data.phoenixUntil || 0);
    }

    syncChickenVisuals() {
        const list = [...this.data.chickens];
        if (this.isPhoenixActive()) {
            list.push({ id: 'temp_phoenix', breed: 'phoenix', isTemp: true });
        }

        // Giữ vị trí các gà đã có, thêm mới nếu có gà mới
        const nextVisuals = list.map((c, idx) => {
            const existing = this.chickenVisuals.find(v => v.id === c.id);
            if (existing) return existing;
            return {
                id: c.id,
                breed: c.breed,
                x: 0.2 + ((idx * 0.17) % 0.65),
                y: 0.45 + ((idx * 0.13) % 0.40),
                vx: (Math.random() - 0.5) * 0.0025,
                vy: (Math.random() - 0.5) * 0.0018,
                dir: Math.random() > 0.5 ? 1 : -1,
                peckTimer: 0
            };
        });
        this.chickenVisuals = nextVisuals;
    }

    initChickenCanvas() {
        const canvas = document.getElementById('chicken-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            if (canvas.parentElement.clientWidth > 0) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Chạm vào trứng để nhặt hoặc chạm vào gà để vỗ về!
        canvas.addEventListener('pointerdown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;

            // Kiểm tra nhặt trứng gần vị trí bấm
            for (let i = this.data.eggsOnGround.length - 1; i >= 0; i--) {
                const egg = this.data.eggsOnGround[i];
                const dist = Math.hypot(egg.x - px, egg.y - py);
                if (dist < 0.08) {
                    this.collectEgg(i);
                    return;
                }
            }

            // Kiểm tra chạm vào gà để cho ăn (2 Lúa) hoặc nhặt trứng tự động!
            let clickedVisual = null;
            let minDist = 0.095;
            for (const c of this.chickenVisuals) {
                const dist = Math.hypot(c.x - px, c.y - py);
                if (dist < minDist) {
                    minDist = dist;
                    clickedVisual = c;
                }
            }

            if (clickedVisual) {
                clickedVisual.peckTimer = 30;
                window.sound.playCluck();
                this.handleChickenTap(clickedVisual.id, clickedVisual.x, clickedVisual.y);
                return;
            }
        });

        let tick = 0;
        const drawLoop = () => {
            const W = canvas.width;
            const H = canvas.height;
            if (W === 0 || H === 0) {
                requestAnimationFrame(drawLoop);
                return;
            }
            ctx.clearRect(0, 0, W, H);

            // 1. NỀN BẦU TRỜI NẮNG ẤM, ĐỒI CỎ & BÃI CỎ 4D SIÊU THỰC
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.30);
            skyGrad.addColorStop(0, '#38bdf8');
            skyGrad.addColorStop(1, '#e0f2fe');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H * 0.30);

            // Mặt trời & tia nắng ấm
            const sunGrad = ctx.createRadialGradient(W * 0.88, H * 0.08, 4, W * 0.88, H * 0.08, 65);
            sunGrad.addColorStop(0, 'rgba(254, 249, 195, 0.95)');
            sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
            ctx.fillStyle = sunGrad;
            ctx.fillRect(0, 0, W, H * 0.5);

            const grassGrad = ctx.createLinearGradient(0, H * 0.28, 0, H);
            grassGrad.addColorStop(0, '#84cc16');
            grassGrad.addColorStop(0.5, '#65a30d');
            grassGrad.addColorStop(1, '#3f6212');
            ctx.fillStyle = grassGrad;
            ctx.fillRect(0, H * 0.28, W, H * 0.72);

            // Cỏ chi tiết trên nền sân
            ctx.strokeStyle = 'rgba(217, 249, 157, 0.35)';
            ctx.lineWidth = 1.5;
            for (let gx = 18; gx < W; gx += 38) {
                for (let gy = H * 0.38; gy < H - 15; gy += 34) {
                    ctx.beginPath();
                    ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 5);
                    ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 6);
                    ctx.stroke();
                }
            }

            // 2. HÀNG RÀO GỖ 3D CÓ ĐỔ BÓNG XUỐNG CỎ
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fillRect(0, H * 0.33, W, 5);
            for (let fx = 8; fx < W; fx += 24) {
                ctx.fillStyle = '#fef3c7';
                ctx.fillRect(fx, H * 0.21, 6, 22);
                ctx.fillStyle = '#d97706';
                ctx.fillRect(fx + 4, H * 0.21, 2, 22); // Viền 3D
            }
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(0, H * 0.25, W, 4);
            ctx.fillRect(0, H * 0.32, W, 4);

            // 3. CHUỒNG GÀ 3D MÁI NGÓI ĐỎ BÊN TRÁI (CÓ MẶT BÊN & BÓNG ĐỔ)
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.beginPath(); ctx.ellipse(54, H * 0.37, 46, 10, 0, 0, Math.PI * 2); ctx.fill();
            // Mặt trước & Mặt bên 3D
            ctx.fillStyle = '#d97706';
            ctx.fillRect(14, H * 0.14, 62, 42);
            ctx.fillStyle = '#92400e';
            ctx.fillRect(76, H * 0.14, 18, 42);
            // Mái ngói đổ bóng
            const barnRoof = ctx.createLinearGradient(8, H * 0.02, 80, H * 0.16);
            barnRoof.addColorStop(0, '#ef4444');
            barnRoof.addColorStop(1, '#991b1b');
            ctx.fillStyle = barnRoof;
            ctx.beginPath();
            ctx.moveTo(6, H * 0.16);
            ctx.lineTo(45, H * 0.02);
            ctx.lineTo(84, H * 0.16);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.moveTo(45, H * 0.02);
            ctx.lineTo(84, H * 0.16);
            ctx.lineTo(98, H * 0.12);
            ctx.lineTo(58, H * 0.01);
            ctx.closePath();
            ctx.fill();
            // Cửa chuồng
            ctx.fillStyle = '#290f02';
            ctx.beginPath();
            ctx.roundRect(33, H * 0.22, 24, 24, [10, 10, 0, 0]);
            ctx.fill();

            // 4. MÁNG THÓC 3D & HẠT THÓC ÓNG ÁNH
            const troughX = W * 0.72;
            const troughY = H * 0.36;
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(troughX + 2, troughY + 12, 64, 5);
            ctx.fillStyle = '#78350f';
            ctx.beginPath(); ctx.roundRect(troughX, troughY, 64, 15, 4); ctx.fill();
            ctx.fillStyle = '#b45309';
            ctx.fillRect(troughX + 2, troughY + 2, 60, 4);
            if (this.data.coopFood > 0) {
                const foodG = ctx.createRadialGradient(troughX + 32, troughY, 2, troughX + 32, troughY + 2, 28);
                foodG.addColorStop(0, '#fef08a');
                foodG.addColorStop(1, '#eab308');
                ctx.fillStyle = foodG;
                ctx.beginPath();
                ctx.ellipse(troughX + 32, troughY + 2, 28 * (this.data.coopFood / 100), 6, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 5. VẼ TRỨNG 3D BÓNG BẨY TRÊN CỎ (CÓ ĐIỂM SÁNG SPECULAR)
            this.data.eggsOnGround.forEach(egg => {
                const ex = egg.x * W;
                const ey = egg.y * H;
                const meta = EGG_TYPES[egg.type] || EGG_TYPES.egg_normal;

                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.32)';
                ctx.beginPath();
                ctx.ellipse(ex + 1, ey + 8, 8.5, 3.8, 0, 0, Math.PI * 2);
                ctx.fill();

                if (egg.type === 'egg_gold' || egg.type === 'egg_diamond') {
                    ctx.shadowColor = meta.color;
                    ctx.shadowBlur = 14;
                }

                const eggGrad = ctx.createRadialGradient(ex - 2.5, ey - 3.5, 1.5, ex, ey, 11);
                eggGrad.addColorStop(0, '#ffffff');
                eggGrad.addColorStop(0.45, meta.color);
                eggGrad.addColorStop(1, '#92400e');
                ctx.fillStyle = eggGrad;
                ctx.beginPath();
                ctx.ellipse(ex, ey, 7.5, 10, 0, 0, Math.PI * 2);
                ctx.fill();

                // Điểm sáng bóng 4D
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.beginPath();
                ctx.ellipse(ex - 2.5, ey - 4, 2, 3, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // 6. VẼ & DI CHUYỂN ĐÀN GÀ KHỐI 3D CHÂN THỰC
            this.chickenVisuals.forEach(c => {
                const meta = CHICKEN_TYPES[c.breed] || CHICKEN_TYPES.ri;

                c.x += c.vx * (this.isChickenBoostActive() ? 1.8 : 1);
                c.y += c.vy * (this.isChickenBoostActive() ? 1.8 : 1);
                if (c.x < 0.1 || c.x > 0.9) { c.vx *= -1; c.x = Math.max(0.1, Math.min(0.9, c.x)); }
                if (c.y < 0.42 || c.y > 0.88) { c.vy *= -1; c.y = Math.max(0.42, Math.min(0.88, c.y)); }
                if (Math.random() < 0.015) {
                    c.vx = (Math.random() - 0.5) * 0.0028;
                    c.vy = (Math.random() - 0.5) * 0.0020;
                }
                c.dir = c.vx >= 0 ? 1 : -1;
                if (c.peckTimer > 0) c.peckTimer--;

                const cx = c.x * W;
                const cy = c.y * H + (c.peckTimer > 0 ? Math.sin(tick * 0.5) * 3 : Math.abs(Math.sin(tick * 0.12 + cx)) * -2);

                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(c.dir, 1);

                // Bóng mềm dưới chân
                ctx.fillStyle = 'rgba(0,0,0,0.32)';
                ctx.beginPath();
                ctx.ellipse(0, 12.5, 12, 4.5, 0, 0, Math.PI * 2);
                ctx.fill();

                if (c.breed === 'gold_hen' || c.breed === 'phoenix') {
                    ctx.shadowColor = c.breed === 'phoenix' ? '#f43f5e' : '#facc15';
                    ctx.shadowBlur = 12;
                }

                // Chân gà
                ctx.strokeStyle = '#ea580c';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(-3, 7); ctx.lineTo(-3, 12);
                ctx.moveTo(3, 7); ctx.lineTo(3, 12);
                ctx.stroke();

                // Thân gà khối cầu 3D (Radial Gradient)
                const bodyGrad = ctx.createRadialGradient(-2, -4, 2, 0, 0, 13);
                bodyGrad.addColorStop(0, '#ffffff');
                bodyGrad.addColorStop(0.35, meta.bodyColor);
                bodyGrad.addColorStop(1, meta.wingColor);
                ctx.fillStyle = bodyGrad;
                ctx.beginPath();
                ctx.ellipse(0, 0, 12.5, 9.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Đuôi gà
                ctx.fillStyle = meta.wingColor;
                ctx.beginPath();
                ctx.moveTo(-10, -2);
                ctx.lineTo(-18, -10);
                ctx.lineTo(-14, 2);
                ctx.closePath();
                ctx.fill();

                // Cánh gà có bóng nổi
                ctx.fillStyle = meta.wingColor;
                ctx.beginPath();
                ctx.ellipse(-1, 1 + Math.sin(tick * 0.2 + cx) * 1, 6.5, 4.2, 0.2, 0, Math.PI * 2);
                ctx.fill();

                // Đầu gà khối 3D
                const headGrad = ctx.createRadialGradient(6, -10, 1, 8, -7, 7);
                headGrad.addColorStop(0, '#ffffff');
                headGrad.addColorStop(0.4, meta.bodyColor);
                headGrad.addColorStop(1, meta.wingColor);
                ctx.fillStyle = headGrad;
                ctx.beginPath();
                ctx.arc(8, -7, 6.8, 0, Math.PI * 2);
                ctx.fill();

                // Mào đỏ
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(8, -14, 3.2, 0, Math.PI * 2);
                ctx.fill();

                // Mỏ vàng
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.moveTo(14, -8);
                ctx.lineTo(18.5, -6);
                ctx.lineTo(14, -4);
                ctx.closePath();
                ctx.fill();

                // Mắt đen lấp lánh
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(10.5, -8, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(11, -8.5, 0.5, 0, Math.PI * 2);
                ctx.fill();

                // Dấu chấm than (!) trên đầu gà nếu đủ 24h và sẵn sàng cho ăn 2🌾 để nhận trứng
                const chData = (this.data.chickens || []).find(item => item.id === c.id);
                const isReadyToHarvest = chData && (Date.now() >= this.getChickenReadyAt(chData));
                if (isReadyToHarvest) {
                    ctx.save();
                    ctx.scale(c.dir, 1); // Triệt tiêu hướng lật gương để chữ (!) luôn đứng thẳng
                    const bounce = Math.sin(tick * 0.16 + cx) * 3.5;
                    const bx = 8 * c.dir;
                    const by = -28 + bounce;

                    // Hiệu ứng phát sáng hào quang đỏ nổi bật
                    ctx.shadowColor = 'rgba(239, 68, 68, 0.95)';
                    ctx.shadowBlur = 10;

                    // Huy hiệu tròn nền đỏ
                    ctx.beginPath();
                    ctx.arc(bx, by, 8.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#dc2626';
                    ctx.fill();
                    ctx.lineWidth = 1.8;
                    ctx.strokeStyle = '#ffffff';
                    ctx.stroke();

                    // Dấu chấm than (!) màu trắng đậm
                    ctx.shadowBlur = 0;
                    ctx.font = '900 12px sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('!', bx, by + 0.5);

                    ctx.restore();
                }

                ctx.restore();
            });

            // 7. Chữ nổi khi nhặt trứng hoặc chạm gà
            for (let i = this.chickenFloats.length - 1; i >= 0; i--) {
                const f = this.chickenFloats[i];
                f.y -= 0.002;
                f.life--;
                if (f.life <= 0) {
                    this.chickenFloats.splice(i, 1);
                    continue;
                }
                ctx.font = 'bold 11px Nunito, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fef08a';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2.5;
                ctx.strokeText(f.text, f.x * W, f.y * H);
                ctx.fillText(f.text, f.x * W, f.y * H);
            }

            tick++;
            requestAnimationFrame(drawLoop);
        };
        drawLoop();
    }

    getChickenReadyAt(ch) {
        if (!ch) return Date.now();
        if (ch.readyAt && ch.readyAt > 0) return ch.readyAt;
        if (ch.startedAt && ch.startedAt > 0) return ch.startedAt + CHICKEN_LAY_TIME_MS;
        if (ch.fedAt && ch.fedAt > 0) return ch.fedAt + CHICKEN_LAY_TIME_MS;
        ch.startedAt = Date.now();
        ch.readyAt = ch.startedAt + CHICKEN_LAY_TIME_MS;
        return ch.readyAt;
    }

    handleChickenTap(chickenId, x, y) {
        if (!this.data.chickens || this.data.chickens.length === 0) return;
        const chicken = this.data.chickens.find(c => c.id === chickenId);
        if (!chicken) return;

        const now = Date.now();
        const readyAt = this.getChickenReadyAt(chicken);
        const isReady = now >= readyAt;

        if (!isReady) {
            // Gà đang tự sống và ấp trứng trong chu kỳ 24h
            const remaining = readyAt - now;
            const strTime = this.formatDurationMs(remaining);
            this.chickenFloats.push({ x: x || 0.5, y: (y || 0.5) - 0.08, text: `⏳ Đẻ sau: ${strTime}`, life: 40 });
            window.adsgramManager.showToast(`🐔 Gà đang sống khỏe mạnh và tự ấp trứng! Còn ${strTime} nữa sẽ đẻ trứng.`, "info");
            return;
        }

        // Gà đã đủ 24h và có trứng chờ thu hoạch! CẦN 2 LÚA ĐỂ THU HOẠCH
        const riceQty = (this.data.inventory && this.data.inventory.rice) || 0;
        if (riceQty < CHICKEN_FEED_RICE_QTY) {
            this.chickenFloats.push({ x: x || 0.5, y: (y || 0.5) - 0.08, text: "Cần 2🌾 để nhận trứng!", life: 45 });
            window.adsgramManager.showToast(`Bạn cần cho gà ăn 2🌾 Lúa Nước để thu hoạch trứng! Bạn đang có ${riceQty}🌾 Lúa. Hãy trồng Lúa ở Nông Trại.`, "warning");
            return;
        }

        // Đủ 2 Lúa: Trừ 2 Lúa, nhận 1 Trứng, gà bắt đầu chu kỳ 24h tiếp theo
        this.data.inventory.rice -= CHICKEN_FEED_RICE_QTY;
        if (this.data.inventory.rice <= 0) delete this.data.inventory.rice;

        this.data.inventory.egg_normal = (this.data.inventory.egg_normal || 0) + 1;
        this.incrementQuest('eggs', 1);

        // Sau khi thu hoạch xong, gà tiếp tục sống và chạy thời gian 24h tiếp theo
        chicken.startedAt = now;
        chicken.readyAt = now + CHICKEN_LAY_TIME_MS;
        chicken.fedAt = now;

        window.sound.playHarvest();
        window.sound.playCluck();

        this.chickenFloats.push({ x: x || 0.5, y: (y || 0.5) - 0.08, text: `🥚 +1 Trứng (-2🌾) • ⏳ 24h mới`, life: 45 });
        window.adsgramManager.showToast(`🎉 Đã cho gà ăn 2🌾 Lúa và thu hoạch 1 quả Trứng Gà! Gà tiếp tục đếm ngược 24h để đẻ tiếp.`, "success");

        this.save();
        this.renderAll();
    }

    getMaxChickens() {
        const tier = Math.max(1, Math.min(5, this.data.coopTier || 1));
        return (COOP_TIERS[tier] && COOP_TIERS[tier].maxChickens) || 10;
    }

    formatDurationMs(ms) {
        if (ms <= 0) return '0s';
        const totalSec = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        if (hours > 0) return `${hours}h ${minutes}p`;
        if (minutes > 0) return `${minutes}p ${seconds}s`;
        return `${seconds}s`;
    }

    renderChickenUI() {
        const curTier = Math.max(1, Math.min(5, this.data.coopTier || 1));
        const metaTier = COOP_TIERS[curTier] || COOP_TIERS[1];
        const maxChickens = metaTier.maxChickens;
        const playerLv = this.data.level || 1;
        const chickens = this.data.chickens || [];
        const count = chickens.length;
        const riceQty = (this.data.inventory && this.data.inventory.rice) || 0;
        const eggQty = (this.data.inventory && this.data.inventory.egg_normal) || 0;
        const now = Date.now();

        // 1. Cập nhật Badge Header
        const tierBadge = document.getElementById('coop-tier-badge');
        if (tierBadge) tierBadge.innerText = `${metaTier.icon} Cấp ${curTier}`;

        const countBadge = document.getElementById('chicken-count-badge');
        if (countBadge) countBadge.innerText = `${count}/${maxChickens} Con Gà`;

        const capacityBadge = document.getElementById('coop-capacity-badge');
        if (capacityBadge) capacityBadge.innerText = `Sức chứa: ${count}/${maxChickens} con`;

        // 2. Yêu cầu Cấp độ & Nút Mua/Nâng cấp Trại Gà
        const upgradeBtn = document.getElementById('btn-upgrade-coop');
        const upgradeText = document.getElementById('coop-upgrade-btn-text');

        if (curTier >= 5) {
            if (upgradeBtn) {
                upgradeBtn.disabled = true;
                upgradeBtn.className = 'px-2.5 py-1.5 bg-slate-600 text-slate-300 rounded-xl font-black text-[10px] opacity-70 cursor-not-allowed';
            }
            if (upgradeText) upgradeText.innerText = '👑 Cấp Tối Đa';
        } else {
            const nextTier = curTier + 1;
            if (upgradeBtn) {
                upgradeBtn.disabled = false;
                upgradeBtn.className = 'px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 rounded-xl font-black text-[10px] shadow border-b-2 border-amber-700 active:scale-95 flex items-center gap-1 transition';
                if (upgradeText) upgradeText.innerText = `✨ Nâng Cấp Cấp ${nextTier}`;
            }
        }

        // 3. Lộ Trình 5 Cấp Trại Gà
        const roadmapEl = document.getElementById('coop-tiers-roadmap');
        if (roadmapEl) {
            roadmapEl.innerHTML = [1, 2, 3, 4, 5].map(t => {
                const info = COOP_TIERS[t];
                const isCurrent = t === curTier;
                const isUnlocked = t <= curTier;
                const isNext = t === curTier + 1;
                const isLvReached = playerLv >= info.minLevel;

                let cardStyle = 'bg-white/80 border-slate-300 text-slate-500 cursor-pointer hover:border-amber-400 active:scale-95 transition';
                let statusBadge = `🔒 Lv.${info.minLevel}`;
                if (isCurrent) {
                    cardStyle = 'bg-amber-400 border-[#78350f] text-slate-950 font-black ring-2 ring-amber-600 scale-[1.02] shadow-sm cursor-pointer hover:brightness-105 active:scale-95 transition';
                    statusBadge = '✓ Đang nuôi';
                } else if (isUnlocked) {
                    cardStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold cursor-pointer hover:bg-emerald-200 active:scale-95 transition';
                    statusBadge = '✓ Đã xong';
                } else if (isNext) {
                    cardStyle = isLvReached
                        ? 'bg-yellow-200 border-amber-600 text-amber-950 font-bold animate-pulse cursor-pointer hover:brightness-105 active:scale-95 transition'
                        : 'bg-amber-50 border-amber-300 text-amber-950 font-bold cursor-pointer hover:border-amber-500 active:scale-95 transition';
                    statusBadge = isLvReached ? '⚡ Nâng Cấp' : `🔒 Lv.${info.minLevel}`;
                }

                return `
                    <div onclick="game.openCoopUpgradeModal(${t})" class="rounded-xl p-1 border flex flex-col items-center justify-between text-[8px] min-h-[58px] ${cardStyle}" title="Bấm để xem điều kiện nâng cấp ${info.name}">
                        <span class="text-sm leading-none mt-0.5">${info.icon}</span>
                        <span class="font-extrabold text-[8.5px] leading-tight line-clamp-1">Cấp ${t}</span>
                        <span class="text-[7.5px] opacity-85">${info.maxChickens} gà</span>
                        <span class="text-[7.5px] px-1 py-0.2 rounded font-black mt-0.5 ${isCurrent ? 'bg-amber-900 text-white' : (isNext && isLvReached ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700')}">${statusBadge}</span>
                    </div>
                `;
            }).join('');
        }

        // 4. Thống kê trạng thái đàn gà
        let layingCount = 0;
        let readyCount = 0;
        chickens.forEach(ch => {
            const readyAt = this.getChickenReadyAt(ch);
            if (now >= readyAt) {
                readyCount++;
            } else {
                layingCount++;
            }
        });

        // 5. Canvas Info Badges
        const riceCountEl = document.getElementById('coop-rice-count');
        if (riceCountEl) riceCountEl.innerText = `${riceQty}`;

        const eggsBadge = document.getElementById('coop-eggs-badge');
        if (eggsBadge) {
            eggsBadge.innerText = readyCount > 0 
                ? `🥚 ${readyCount} Trứng sẵn sàng (Cần 2🌾/q)` 
                : (eggQty > 0 ? `🥚 Kho: ${eggQty} Trứng` : '🥚 0 Trứng sẵn sàng');
        }

        // 6. Action Buttons Labels
        const feedCostLabel = document.getElementById('feed-cost-label');
        if (feedCostLabel) {
            feedCostLabel.innerText = readyCount > 0 ? `Cần ${readyCount * CHICKEN_FEED_RICE_QTY}🌾 (Có: ${riceQty}🌾)` : 'Tất cả đang tự ấp ⏳';
        }

        const collectLabel = document.getElementById('collect-count-label');
        if (collectLabel) {
            collectLabel.innerText = readyCount > 0 ? `${readyCount} quả sẵn sàng!` : `Đang ấp ${layingCount} con (24h)`;
        }

        const vndSellLabel = document.getElementById('coop-vnd-sell-label');
        if (vndSellLabel) {
            vndSellLabel.innerText = eggQty > 0 ? `+${(eggQty * EGG_SELL_VND).toLocaleString('vi-VN')}đ (${eggQty} quả)` : 'Kho: 0 trứng (50đ/q)';
        }

        const p2pLabel = document.getElementById('coop-p2p-market-label');
        if (p2pLabel) {
            p2pLabel.innerText = eggQty > 0 ? `Có ${eggQty} quả (Đăng bán)` : 'Đăng bán lấy VND';
        }

        // 7. Nút Mua Gà (100 Vàng / con)
        const buy1Btn = document.getElementById('btn-buy-chicken-1');
        const buyMaxBtn = document.getElementById('btn-buy-chicken-max');
        const isFull = count >= maxChickens;
        const canAffordOne = this.data.gold >= CHICKEN_PRICE_GOLD;
        if (buy1Btn) {
            buy1Btn.disabled = isFull || !canAffordOne;
            buy1Btn.classList.toggle('opacity-50', isFull || !canAffordOne);
            buy1Btn.classList.toggle('cursor-not-allowed', isFull || !canAffordOne);
        }
        if (buyMaxBtn) {
            buyMaxBtn.disabled = isFull || !canAffordOne;
            buyMaxBtn.classList.toggle('opacity-50', isFull || !canAffordOne);
            buyMaxBtn.classList.toggle('cursor-not-allowed', isFull || !canAffordOne);
        }

        // 8. Danh sách Đàn Gà Trong Trại
        const ownedSummary = document.getElementById('coop-owned-summary');
        if (ownedSummary) {
            ownedSummary.innerText = `${count}/${maxChickens} con • ${readyCount} trứng sẵn sàng • ${layingCount} đang ấp`;
        }

        const ownedList = document.getElementById('owned-chickens-list');
        if (ownedList) {
            if (chickens.length === 0) {
                ownedList.innerHTML = `<div class="col-span-2 text-center py-4 text-xs font-bold text-slate-500 bg-amber-50 rounded-xl border border-amber-200">Trại gà đang trống! Hãy bấm <b>"Mua 1 (100💰)"</b> để mua gà bắt đầu chăn nuôi!</div>`;
            } else {
                ownedList.innerHTML = chickens.map((ch, idx) => {
                    const readyAt = this.getChickenReadyAt(ch);
                    const isReady = now >= readyAt;

                    let statusHtml = '';
                    let actionHtml = '';

                    if (isReady) {
                        statusHtml = `<span class="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 animate-pulse">🥚 Sẵn Sàng (Cần 2🌾)</span>`;
                        actionHtml = `<button type="button" onclick="game.handleChickenTap(${ch.id})" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[9px] shadow active:scale-95">🧺 Nhận</button>`;
                    } else {
                        const remMs = readyAt - now;
                        const elapsed = CHICKEN_LAY_TIME_MS - remMs;
                        const pct = Math.min(100, Math.max(0, Math.floor((elapsed / CHICKEN_LAY_TIME_MS) * 100)));
                        statusHtml = `
                            <div class="flex flex-col gap-0.5 w-full">
                                <span class="text-[8.5px] font-bold text-blue-800">⏳ Đẻ sau: <b>${this.formatDurationMs(remMs)}</b></span>
                                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div class="bg-blue-500 h-full rounded-full transition-all" style="width: ${pct}%"></div>
                                </div>
                            </div>
                        `;
                        actionHtml = `<span class="text-[8.5px] text-slate-400 font-bold">Đang ấp...</span>`;
                    }

                    return `
                        <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-1.5 flex justify-between items-center gap-1.5">
                            <div class="flex items-center gap-1.5 min-w-0 flex-1">
                                <span class="text-2xl leading-none flex-shrink-0">🐔</span>
                                <div class="min-w-0 flex-1">
                                    <div class="font-black text-slate-800 text-[10px] leading-tight">Gà #${idx + 1}</div>
                                    ${statusHtml}
                                </div>
                            </div>
                            <div class="flex-shrink-0">
                                ${actionHtml}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    buyChicken(qty = 1) {
        const curTier = Math.max(1, Math.min(5, this.data.coopTier || 1));
        const maxChickens = this.getMaxChickens();
        const currentCount = (this.data.chickens || []).length;
        const emptySlots = maxChickens - currentCount;

        if (emptySlots <= 0) {
            if (curTier < 5) {
                const nextTier = curTier + 1;
                const nextMeta = COOP_TIERS[nextTier];
                window.adsgramManager.showToast(`Trại gà Cấp ${curTier} đã đầy (${maxChickens}/${maxChickens} con)! Cần đạt Lv.${nextMeta.minLevel} để nâng cấp ${nextMeta.name} (+10 chỗ gà)!`, "warning");
            } else {
                window.adsgramManager.showToast("Trại gà đã đạt Cấp tối đa (50/50 con gà)!", "warning");
            }
            return;
        }

        const buyCount = Math.min(qty, emptySlots);
        const totalCost = buyCount * CHICKEN_PRICE_GOLD;
        if (this.data.gold < totalCost) {
            window.adsgramManager.showToast(`Cần ${totalCost.toLocaleString('vi-VN')}💰 Vàng để mua ${buyCount} con gà (100💰/con)!`, "warning");
            return;
        }

        this.data.gold = Math.round((this.data.gold - totalCost) * 10) / 10;
        const now = Date.now();
        for (let i = 0; i < buyCount; i++) {
            this.data.chickens.push({
                id: now + i + Math.floor(Math.random() * 1000),
                breed: 'ri',
                startedAt: now,
                readyAt: now + CHICKEN_LAY_TIME_MS,
                fedAt: now
            });
        }

        this.syncChickenVisuals();
        window.sound.playCluck();
        window.adsgramManager.showToast(`🐣 Đã mua ${buyCount} con gà vào trại (-${totalCost.toLocaleString('vi-VN')}💰 Vàng)! Gà tự động sống và đếm ngược 24h để đẻ trứng.`, "success");
        this.save();
        this.renderAll();
    }

    buyChickenMax() {
        const maxChickens = this.getMaxChickens();
        const emptySlots = maxChickens - (this.data.chickens || []).length;
        if (emptySlots <= 0) {
            this.buyChicken(1);
            return;
        }
        const maxAfford = Math.floor(this.data.gold / CHICKEN_PRICE_GOLD);
        if (maxAfford <= 0) {
            window.adsgramManager.showToast(`Cần ít nhất ${CHICKEN_PRICE_GOLD}💰 Vàng để mua 1 con gà!`, "warning");
            return;
        }
        const count = Math.min(emptySlots, maxAfford);
        this.buyChicken(count);
    }

    upgradeCoopTier() {
        const curTier = Math.max(1, Math.min(5, this.data.coopTier || 1));
        if (curTier >= 5) {
            window.adsgramManager.showToast("Trại gà của bạn đã đạt Cấp 5 tối đa (50 con gà)!", "info");
            return;
        }

        const nextTier = curTier + 1;
        const nextMeta = COOP_TIERS[nextTier];
        const playerLv = this.data.level || 1;

        if (playerLv < nextMeta.minLevel) {
            window.adsgramManager.showToast(`Cần đạt Cấp độ người chơi Lv.${nextMeta.minLevel} để nâng cấp ${nextMeta.name}! Hãy vào Bếp Nấu Bánh để tăng cấp Lv!`, "warning");
            return;
        }

        const inv = this.data.inventory = this.data.inventory || {};
        const curWood = inv.wood || 0;
        const curIron = inv.iron || 0;
        const curGoldOre = inv.gold_ore || 0;
        const curDiamonds = this.data.diamonds || 0;
        const curGold = this.data.gold || 0;

        const missing = [];
        if (curWood < (nextMeta.wood || 0)) missing.push(`${nextMeta.wood - curWood}🌳 Gỗ`);
        if (curIron < (nextMeta.iron || 0)) missing.push(`${nextMeta.iron - curIron}⚙️ Sắt`);
        if (curGoldOre < (nextMeta.gold_ore || 0)) missing.push(`${nextMeta.gold_ore - curGoldOre}✨ Cục Vàng`);
        if (curDiamonds < (nextMeta.diamonds || 0)) missing.push(`${nextMeta.diamonds - curDiamonds}💎 Kim Cương`);
        if (curGold < (nextMeta.priceGold || 0)) missing.push(`${((nextMeta.priceGold || 0) - curGold).toLocaleString('vi-VN')}💰 Vàng`);

        if (missing.length > 0) {
            window.adsgramManager.showToast(`Còn thiếu: ${missing.join(', ')} để nâng cấp ${nextMeta.name}!`, "warning");
            return;
        }

        // Khấu trừ tài nguyên và tiền tệ theo đúng yêu cầu
        if (nextMeta.wood > 0) {
            inv.wood = Math.max(0, curWood - nextMeta.wood);
            if (inv.wood === 0) delete inv.wood;
        }
        if (nextMeta.iron > 0) {
            inv.iron = Math.max(0, curIron - nextMeta.iron);
            if (inv.iron === 0) delete inv.iron;
        }
        if (nextMeta.gold_ore > 0) {
            inv.gold_ore = Math.max(0, curGoldOre - nextMeta.gold_ore);
            if (inv.gold_ore === 0) delete inv.gold_ore;
        }
        if (nextMeta.diamonds > 0) {
            this.data.diamonds = Math.max(0, Math.round((curDiamonds - nextMeta.diamonds) * 10) / 10);
        }
        if (nextMeta.priceGold > 0) {
            this.data.gold = Math.max(0, Math.round((curGold - nextMeta.priceGold) * 10) / 10);
        }

        this.data.coopTier = nextTier;

        window.sound.playFanfare();
        window.adsgramManager.showToast(`🎉 CHÚC MỪNG! Bạn đã nâng cấp lên ${nextMeta.name}! Sức chứa tăng lên ${nextMeta.maxChickens} con gà!`, "success");
        this.save();
        this.renderAll();
    }

    openCoopUpgradeModal(targetTier) {
        const curTier = Math.max(1, Math.min(5, this.data.coopTier || 1));
        const tier = typeof targetTier === 'number' ? Math.max(1, Math.min(5, targetTier)) : Math.min(5, curTier + 1);
        const meta = COOP_TIERS[tier];
        if (!meta) return;

        const modal = document.getElementById('modal-coop-upgrade');
        const titleEl = document.getElementById('coop-upgrade-modal-title');
        const contentEl = document.getElementById('coop-upgrade-modal-content');
        if (!modal || !contentEl) return;

        if (titleEl) {
            titleEl.innerHTML = `<span>${meta.icon}</span> Điều Kiện Nâng Cấp: ${meta.name}`;
        }

        const playerLv = this.data.level || 1;
        const inv = this.data.inventory || {};
        const curWood = inv.wood || 0;
        const curIron = inv.iron || 0;
        const curGoldOre = inv.gold_ore || 0;
        const curDiamonds = this.data.diamonds || 0;
        const curGold = this.data.gold || 0;

        const isCurrent = tier === curTier;
        const isUnlocked = tier <= curTier;
        const isNext = tier === curTier + 1;
        const isLvReached = playerLv >= meta.minLevel;

        const hasWood = curWood >= (meta.wood || 0);
        const hasIron = curIron >= (meta.iron || 0);
        const hasGoldOre = curGoldOre >= (meta.gold_ore || 0);
        const hasDiamonds = curDiamonds >= (meta.diamonds || 0);
        const hasGold = curGold >= (meta.priceGold || 0);
        const canAffordAll = hasWood && hasIron && hasGoldOre && hasDiamonds && hasGold;
        const canUpgradeNow = isNext && isLvReached && canAffordAll;

        let statusBadgeHtml = '';
        if (isCurrent) {
            statusBadgeHtml = '<span class="bg-amber-900 text-white text-[9.5px] px-2 py-0.5 rounded-full font-black">✓ Đang Nuôi</span>';
        } else if (isUnlocked) {
            statusBadgeHtml = '<span class="bg-emerald-600 text-white text-[9.5px] px-2 py-0.5 rounded-full font-black">✓ Đã Mở Khóa</span>';
        } else if (isNext) {
            statusBadgeHtml = isLvReached 
                ? '<span class="bg-amber-500 text-slate-950 text-[9.5px] px-2 py-0.5 rounded-full font-black animate-pulse">⚡ Cấp Tiếp Theo</span>'
                : `<span class="bg-slate-500 text-white text-[9.5px] px-2 py-0.5 rounded-full font-black">🔒 Khóa Lv.${meta.minLevel}</span>`;
        } else {
            statusBadgeHtml = `<span class="bg-slate-400 text-white text-[9.5px] px-2 py-0.5 rounded-full font-black">🔒 Chưa Mở</span>`;
        }

        let actionButtonHtml = '';
        if (isCurrent) {
            actionButtonHtml = `<button disabled class="w-full py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl opacity-90 cursor-default shadow-xs">✓ Đang Sử Dụng Cấp Này (Sức chứa ${meta.maxChickens} gà)</button>`;
        } else if (isUnlocked) {
            actionButtonHtml = `<button disabled class="w-full py-2.5 bg-emerald-700 text-white font-black text-xs rounded-xl opacity-90 cursor-default shadow-xs">✓ Đã Hoàn Thành Cấp Này</button>`;
        } else if (isNext) {
            if (canUpgradeNow) {
                actionButtonHtml = `<button onclick="game.executeCoopUpgrade(${tier})" class="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg border-2 border-amber-600 active:scale-95 transition flex items-center justify-center gap-1.5 animate-bounce">
                    🚀 Nâng Cấp Lên ${meta.name} Ngay
                </button>`;
            } else {
                actionButtonHtml = `<button onclick="game.upgradeCoopTier()" class="w-full py-2.5 bg-slate-300 hover:bg-slate-400/50 text-slate-700 font-black text-xs rounded-xl border border-slate-400 active:scale-95 flex items-center justify-center gap-1.5 shadow-xs">
                    🔒 Chưa Đủ Điều Kiện (Bấm để xem chi tiết)
                </button>`;
            }
        } else {
            actionButtonHtml = `<button disabled class="w-full py-2.5 bg-slate-200 text-slate-500 font-bold text-xs rounded-xl border border-slate-300 cursor-not-allowed">
                🔒 Cần nâng cấp Trại Gà Cấp ${tier - 1} trước
            </button>`;
        }

        contentEl.innerHTML = `
            <!-- Thẻ Giới Thiệu Cấp Trại -->
            <div class="bg-gradient-to-r from-amber-100 to-yellow-50 border border-amber-300 rounded-2xl p-2.5 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <span class="text-3xl">${meta.icon}</span>
                    <div>
                        <div class="font-black text-amber-950 text-xs leading-tight">${meta.name}</div>
                        <div class="text-[10px] text-amber-900 font-extrabold mt-0.5">Sức chứa: <b class="text-emerald-700">${meta.maxChickens} con gà</b> ${tier > 1 ? '<span class="text-emerald-600">(+10 con)</span>' : ''}</div>
                    </div>
                </div>
                <div>${statusBadgeHtml}</div>
            </div>

            <!-- Bảng Điều Kiện Cần Có -->
            <div class="bg-white/90 border border-amber-300/80 rounded-2xl p-2.5 space-y-2">
                <div class="font-black text-amber-950 text-[11px] flex items-center justify-between border-b border-amber-100 pb-1">
                    <span>📋 Điều Kiện Cần Đạt</span>
                    <span class="text-[9.5px] text-slate-500 font-bold">Hiện tại: Cấp ${curTier} (${COOP_TIERS[curTier].maxChickens} gà)</span>
                </div>

                <!-- Điều kiện Level -->
                <div class="flex items-center justify-between p-2 rounded-xl ${isLvReached ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}">
                    <div class="flex items-center gap-1.5">
                        <span class="text-base leading-none">⭐</span>
                        <div>
                            <div class="font-black text-slate-800 text-[10.5px]">Cấp độ người chơi (Lv)</div>
                            <div class="text-[9px] text-slate-500">Yêu cầu tối thiểu: <b>Lv.${meta.minLevel}</b></div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10.5px] font-black ${isLvReached ? 'text-emerald-700' : 'text-rose-600'}">Lv.${playerLv} / ${meta.minLevel}</div>
                        <div class="text-[8.5px] font-extrabold ${isLvReached ? 'text-emerald-600' : 'text-rose-500'}">${isLvReached ? '✓ Đạt yêu cầu' : `Thiếu ${meta.minLevel - playerLv} Lv`}</div>
                    </div>
                </div>

                <!-- Danh sách 5 tài nguyên & tiền tệ -->
                ${tier > 1 ? `
                <div class="space-y-1 pt-1">
                    <div class="text-[10px] font-black text-amber-950">📦 Tài nguyên & Tiền tệ nâng cấp:</div>
                    <div class="grid grid-cols-1 gap-1 text-[10.5px]">
                        <!-- Gỗ -->
                        <div class="flex items-center justify-between p-1.5 px-2 rounded-lg border ${hasWood ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                            <span class="font-extrabold flex items-center gap-1">🌳 Gỗ</span>
                            <span class="font-black ${hasWood ? 'text-emerald-700' : 'text-rose-600'}">${curWood.toLocaleString('vi-VN')} / ${meta.wood} ${hasWood ? '✓' : '✗'}</span>
                        </div>
                        <!-- Sắt -->
                        <div class="flex items-center justify-between p-1.5 px-2 rounded-lg border ${hasIron ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                            <span class="font-extrabold flex items-center gap-1">⚙️ Sắt</span>
                            <span class="font-black ${hasIron ? 'text-emerald-700' : 'text-rose-600'}">${curIron.toLocaleString('vi-VN')} / ${meta.iron} ${hasIron ? '✓' : '✗'}</span>
                        </div>
                        <!-- Cục Vàng -->
                        <div class="flex items-center justify-between p-1.5 px-2 rounded-lg border ${hasGoldOre ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                            <span class="font-extrabold flex items-center gap-1">✨ Cục Vàng</span>
                            <span class="font-black ${hasGoldOre ? 'text-emerald-700' : 'text-rose-600'}">${curGoldOre.toLocaleString('vi-VN')} / ${meta.gold_ore} ${hasGoldOre ? '✓' : '✗'}</span>
                        </div>
                        <!-- Kim Cương -->
                        <div class="flex items-center justify-between p-1.5 px-2 rounded-lg border ${hasDiamonds ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                            <span class="font-extrabold flex items-center gap-1">💎 Kim Cương</span>
                            <span class="font-black ${hasDiamonds ? 'text-emerald-700' : 'text-rose-600'}">${curDiamonds.toLocaleString('vi-VN')} / ${meta.diamonds} ${hasDiamonds ? '✓' : '✗'}</span>
                        </div>
                        <!-- Vàng -->
                        <div class="flex items-center justify-between p-1.5 px-2 rounded-lg border ${hasGold ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                            <span class="font-extrabold flex items-center gap-1">💰 Vàng</span>
                            <span class="font-black ${hasGold ? 'text-emerald-700' : 'text-rose-600'}">${curGold.toLocaleString('vi-VN')} / ${meta.priceGold.toLocaleString('vi-VN')} ${hasGold ? '✓' : '✗'}</span>
                        </div>
                    </div>
                </div>
                ` : `
                <div class="p-2.5 bg-amber-50 rounded-xl text-center text-amber-900 font-bold text-[10px]">
                    🛖 Cấp 1 là trại gà ban đầu có sẵn mặc định cho người chơi khi mới bắt đầu game!
                </div>
                `}
            </div>

            <!-- Nút hành động -->
            <div class="pt-1">
                ${actionButtonHtml}
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeCoopUpgradeModal() {
        const modal = document.getElementById('modal-coop-upgrade');
        if (modal) modal.classList.add('hidden');
    }

    executeCoopUpgrade(targetTier) {
        this.upgradeCoopTier();
        this.closeCoopUpgradeModal();
    }

    feedChickens() {
        this.feedAllChickens();
    }

    feedAllChickens() {
        const hungry = (this.data.chickens || []).filter(c => !c.fedAt || c.fedAt === 0);
        if (hungry.length === 0) {
            const readyCount = (this.data.chickens || []).filter(c => c.fedAt > 0 && (Date.now() - c.fedAt) >= CHICKEN_LAY_TIME_MS).length;
            if (readyCount > 0) {
                window.adsgramManager.showToast(`Có ${readyCount} quả trứng đã đẻ xong! Hãy bấm "Thu Hoạch Trứng" trước!`, "info");
            } else {
                window.adsgramManager.showToast("Tất cả gà trong trại đều đã ăn và đang trong thời gian ấp trứng 24h!", "info");
            }
            return;
        }

        this.collectAllEggs();
    }

    feedSingleChicken(chickenId) {
        this.handleChickenTap(chickenId);
    }

    harvestSingleChicken(chickenId) {
        this.handleChickenTap(chickenId);
    }

    collectEgg(index) {
        const egg = this.data.eggsOnGround && this.data.eggsOnGround[index];
        if (!egg) return;
        this.data.eggsOnGround.splice(index, 1);

        this.data.inventory.egg_normal = (this.data.inventory.egg_normal || 0) + 1;
        this.incrementQuest('eggs', 1);

        this.chickenFloats.push({ x: egg.x, y: egg.y, text: "+1 🥚 Trứng Gà!", life: 40 });
        window.sound.playCoin();
        this.save();
        this.renderAll();
    }

    collectAllEggs() {
        if (!this.data.chickens || this.data.chickens.length === 0) {
            window.adsgramManager.showToast("Trại gà chưa có con gà nào! Hãy mua gà để bắt đầu.", "info");
            return;
        }

        const now = Date.now();
        const readyChickens = this.data.chickens.filter(c => now >= this.getChickenReadyAt(c));

        if (readyChickens.length === 0) {
            const minTimeLeft = Math.min(...this.data.chickens.map(c => Math.max(0, this.getChickenReadyAt(c) - now)));
            window.adsgramManager.showToast(`Chưa có trứng nào sẵn sàng! Gà sớm nhất sẽ đẻ sau ${this.formatDurationMs(minTimeLeft)}.`, "info");
            return;
        }

        const riceQty = (this.data.inventory && this.data.inventory.rice) || 0;
        const maxCanHarvest = Math.floor(riceQty / CHICKEN_FEED_RICE_QTY);

        if (maxCanHarvest <= 0) {
            window.adsgramManager.showToast(`Có ${readyChickens.length} con gà đã sẵn sàng đẻ trứng, nhưng cần ít nhất 2🌾 Lúa Nước cho gà ăn để thu hoạch! Bạn đang có ${riceQty}🌾 Lúa. Hãy trồng Lúa ở Nông Trại.`, "warning");
            return;
        }

        const harvestCount = Math.min(readyChickens.length, maxCanHarvest);
        const riceUsed = harvestCount * CHICKEN_FEED_RICE_QTY;

        this.data.inventory.rice -= riceUsed;
        if (this.data.inventory.rice <= 0) delete this.data.inventory.rice;

        this.data.inventory.egg_normal = (this.data.inventory.egg_normal || 0) + harvestCount;
        this.incrementQuest('eggs', harvestCount);

        for (let i = 0; i < harvestCount; i++) {
            const ch = readyChickens[i];
            ch.startedAt = now;
            ch.readyAt = now + CHICKEN_LAY_TIME_MS;
            ch.fedAt = now;
        }

        window.sound.playHarvest();
        window.sound.playCluck();

        this.chickenFloats.push({ x: 0.5, y: 0.5, text: `+${harvestCount} 🥚 Trứng (-${riceUsed}🌾)!`, life: 45 });
        window.adsgramManager.showToast(`🧺 Đã cho gà ăn ${riceUsed}🌾 Lúa và thu hoạch ${harvestCount} Trứng Gà vào kho! Gà tiếp tục chu kỳ 24h mới.`, "success");

        this.save();
        this.renderAll();
    }

    openEggP2PMarket() {
        window.sound.playClick();
        const eggQty = (this.data.inventory && this.data.inventory.egg_normal) || 0;
        if (eggQty > 0) {
            this.openListModal('egg_normal');
        } else {
            window.adsgramManager.showToast("Bạn chưa có Trứng Gà trong kho! Hãy thu hoạch trứng trước khi đăng bán trên Chợ P2P.", "info");
            this.switchMainView('view-market');
        }
    }

    sellEggsForVnd(qtyOrAll = 'all') {
        this.openEggP2PMarket();
    }

    packChickenToMarket(chickenId) {
        window.adsgramManager.showToast("Gà sống trong chuồng và không thể cho vào kho đồ hay bán P2P!", "warning");
    }

    unpackChickenFromInventory(itemId) {
        const qty = (this.data.inventory && this.data.inventory[itemId]) || 0;
        if (qty <= 0) return;
        const maxChickens = this.getMaxChickens();
        if ((this.data.chickens || []).length >= maxChickens) {
            window.adsgramManager.showToast(`Trại gà đã đầy ${maxChickens}/${maxChickens} con!`, "warning");
            return;
        }

        this.data.inventory[itemId] -= 1;
        if (this.data.inventory[itemId] <= 0) delete this.data.inventory[itemId];
        this.data.chickens.push({ id: Date.now() + Math.floor(Math.random() * 1000), breed: 'ri', fedAt: 0, readyAt: 0 });
        this.syncChickenVisuals();
        window.sound.playCluck();
        window.adsgramManager.showToast("🐣 Đã thả 1 Gà vào chuồng nuôi!", "success");
        this.save();
        this.renderAll();
    }

    activateChickenBoostWithAd() {
        window.adsgramManager.showRewardAd('chicken_boost').then(success => {
            if (success) {
                this.data.coopFood = 100;
                this.data.chickenBoostUntil = Date.now() + 2 * 60 * 1000; // 2 phút
                window.sound.playFanfare();
                window.adsgramManager.showToast("⚡ Cám Tăng Trọng kích hoạt 2 phút! Gà đẻ trứng siêu tốc!", "success");
                this.save();
                this.renderChickenUI();
            }
        });
    }

    summonPhoenixWithAd() {
        window.adsgramManager.showRewardAd('chicken_phoenix').then(success => {
            if (success) {
                this.data.phoenixUntil = Date.now() + 5 * 60 * 1000; // 5 phút
                this.syncChickenVisuals();
                window.sound.playFanfare();
                window.adsgramManager.showToast("🔥 Phượng Hoàng Gà VIP đã vào chuồng 5 phút! Đẻ Trứng Kim Cương!", "success");
                this.save();
                this.renderChickenUI();
            }
        });
    }

    // ==========================================
    // CHỢ GIAO THƯƠNG P2P (NGƯỜI CHƠI MUA BÁN VỚI NHAU - SÀN THU PHÍ 20% / VIP 12,5%)
    // ==========================================
    getPlayerId() {
        if (this.currentUser && this.currentUser.playerId) {
            return this.currentUser.playerId;
        }
        if (window.paymentManager && window.paymentManager.playerId) {
            return window.paymentManager.playerId;
        }
        let id = localStorage.getItem('lucky_farm_player_id');
        if (!id) {
            id = 'PL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
            localStorage.setItem('lucky_farm_player_id', id);
        }
        return id;
    }

    escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    getAllItemsMeta() {
        const chickenItems = Object.values(CHICKEN_TYPES).reduce((acc, c) => ({
            ...acc,
            [`chicken_${c.id}`]: {
                id: `chicken_${c.id}`,
                name: c.name,
                icon: c.icon,
                sellVnd: c.sellVnd,
                category: 'chicken'
            }
        }), {});
        return {
            ...SEED_TYPES,
            ...RESOURCE_ITEMS,
            ...EGG_TYPES,
            ...FISH_TYPES.reduce((acc, f) => ({ ...acc, [f.id]: f }), {}),
            ...chickenItems,
            ...BAIT_TYPES
        };
    }

    // ==========================================
    // KHO ĐỒ TỔNG HỢP (CÂY TRỒNG, TÀI NGUYÊN, HẠT GIỐNG, CÔNG CỤ, CÁ & TRỨNG)
    // ==========================================
    switchMainView(targetViewId) {
        document.querySelectorAll('.nav-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-target') === targetViewId);
        });
        document.querySelectorAll('.game-view').forEach(v => {
            v.classList.toggle('hidden', v.id !== targetViewId);
        });
        if (targetViewId === 'view-fishing' || targetViewId === 'view-chickens') {
            setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
        }
        if (targetViewId === 'view-market') {
            this.refreshP2PMarket(true);
        }
        if (targetViewId === 'view-resources') {
            this.renderIslandResourceNodes();
        }
        if (targetViewId === 'view-warehouse') {
            this.renderWarehouseModal();
        }
        if (targetViewId === 'view-spin') {
            this.renderBakeryUI();
        }
    }

    openWarehouseModal(category = 'all') {
        window.sound && window.sound.playClick();
        this.warehouseCategory = category || 'all';
        this.switchMainView('view-warehouse');
        this.renderAll();
    }

    selectSeedFromWarehouse(seedId) {
        if (!SEED_TYPES[seedId]) return;
        this.data.selectedSeed = seedId;
        window.sound && window.sound.playClick();
        window.adsgramManager.showToast(`🌱 Đã chọn hạt ${SEED_TYPES[seedId].name} để gieo ở Vườn Cây!`, 'success');
        this.save();
        this.renderWarehouseModal();
    }

    setWarehouseCategory(category) {
        this.warehouseCategory = ['crops', 'resources', 'eggs', 'fish', 'animals', 'cakes'].includes(category) ? category : 'all';
        window.sound && window.sound.playClick();
        this.renderWarehouseModal();
    }

    renderWarehouseSection(title, totalQty, badgeClass, cardsHtml) {
        return `
            <div class="bg-[#f7e7c8] border-2 border-[#8c5426] rounded-xl p-2 space-y-1.5">
                <div class="flex items-center justify-between gap-2 pb-1 border-b border-[#8c5426]/30">
                    <span class="font-black text-[11px] text-[#3b1c06]">${title}</span>
                    <span class="px-2 py-0.5 rounded-full border text-[9.5px] font-black ${badgeClass}">Tổng: ${totalQty.toLocaleString()}</span>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    renderWarehouseModal() {
        const container = document.getElementById('warehouse-sections');
        const totalBadge = document.getElementById('warehouse-total-badge');
        if (!container) return;

        const cat = this.warehouseCategory || 'all';
        document.querySelectorAll('.warehouse-tab-btn').forEach(btn => {
            const isSel = btn.getAttribute('data-warehouse-cat') === cat;
            btn.classList.toggle('bg-[#5c3010]', isSel);
            btn.classList.toggle('text-amber-100', isSel);
            btn.classList.toggle('bg-[#f7e7c8]', !isSel);
            btn.classList.toggle('text-[#4a260a]', !isSel);
        });

        const inv = this.data.inventory || {};
        const orderedSeeds = this.getOrderedSeedTypes();

        // 1. Mục Cây Trồng / Nông Sản (15 loại - Dùng Nấu Bánh tăng EXP, Bán Phú Nông hoặc P2P)
        const cropTotal = orderedSeeds.reduce((sum, s) => sum + (inv[s.id] || 0), 0);
        const cropCards = orderedSeeds.map(s => {
            const qty = inv[s.id] || 0;
            return `
                <div class="rounded-xl p-1.5 border ${qty > 0 ? 'bg-white border-emerald-500 shadow-xs' : 'bg-[#efd3a3]/70 border-[#8c5426]/40 opacity-65'} flex flex-col items-center text-center gap-0.5">
                    <div class="flex items-center justify-between w-full text-[8.5px] font-black">
                        <span class="text-slate-500">${s.growTimeLabel}</span>
                        <span class="px-1 rounded ${qty > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">x${qty}</span>
                    </div>
                    <div class="my-0.5">${this.getCropSvg(s.id, 100)}</div>
                    <div class="text-[9.5px] font-black text-[#3b1c06] truncate w-full">${s.name}</div>
                    ${qty > 0 ? `<div class="w-full flex gap-0.5"><button type="button" onclick="game.npcSelectedSellId='${s.id}'; game.openNpcShop('sell');" class="flex-1 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded text-[8px] border border-amber-700">Bán ${s.sellGold.toLocaleString('vi-VN')}💰</button><button type="button" onclick="game.openListModal('${s.id}')" class="px-1 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded text-[8px]">P2P</button></div>` : `<span class="text-[8px] font-bold text-slate-500">Chưa có</span>`}
                </div>
            `;
        }).join('');

        // 2. Mục Tài Nguyên Khai Thác (Gỗ, Đá, Sắt, Vàng)
        const resourceList = Object.values(RESOURCE_ITEMS);
        const resTotal = resourceList.reduce((sum, r) => sum + (inv[r.id] || 0), 0);
        const resCards = resourceList.map(r => {
            const qty = inv[r.id] || 0;
            return `
                <div class="rounded-xl p-1.5 border ${qty > 0 ? 'bg-white border-amber-500 shadow-xs' : 'bg-[#efd3a3]/70 border-[#8c5426]/40 opacity-70'} flex flex-col items-center text-center gap-1">
                    <div class="flex items-center justify-between w-full text-[8.5px] font-black">
                        <span class="text-amber-800">Tài nguyên</span>
                        <span class="px-1 rounded ${qty > 0 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}">x${qty}</span>
                    </div>
                    <div class="my-0.5">${this.getResourceItemSvg(r.id, 'w-8 h-8')}</div>
                    <div class="text-[9.5px] font-black text-[#3b1c06] truncate w-full">${r.name}</div>
                    ${qty > 0 ? `<button type="button" onclick="game.openListModal('${r.id}')" class="w-full py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded text-[8px]">🏷️ Bán P2P</button>` : ''}
                </div>
            `;
        }).join('');

        // 3. Mục Trứng (chỉ chứa Trứng, bỏ Gà theo yêu cầu của user)
        const eggMetaList = Object.values(EGG_TYPES);
        const eggOwned = eggMetaList.filter(e => (inv[e.id] || 0) > 0);
        const eggTotal = eggOwned.reduce((sum, e) => sum + (inv[e.id] || 0), 0);
        const eggCards = eggOwned.length > 0
            ? eggOwned.map(e => {
                const qty = inv[e.id] || 0;
                return `
                    <div class="rounded-xl p-1.5 border bg-white border-amber-400 shadow-xs flex flex-col items-center text-center gap-0.5">
                        <div class="flex items-center justify-end w-full text-[8.5px] font-black">
                            <span class="px-1 rounded bg-amber-600 text-white">x${qty}</span>
                        </div>
                        <span class="text-2xl leading-none my-1">${e.icon}</span>
                        <div class="text-[9.5px] font-black text-[#3b1c06] truncate w-full">${e.name}</div>
                        <div class="w-full">
                            <button type="button" onclick="game.openListModal('${e.id}')" class="w-full py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded text-[8px]">🏷️ P2P</button>
                        </div>
                    </div>
                `;
            }).join('')
            : `<div class="col-span-3 text-center py-2 text-[10px] font-bold text-[#784319]">Chưa có trứng trong rương. Hãy ghé Trại Gà để thu hoạch trứng!</div>`;

        // 4. Mục Cá Hồ Sunflower (Chỉ Dùng Tăng EXP & Trả Long Nữ - Không Thể Bán)
        const fishOwned = FISH_TYPES.filter(f => (inv[f.id] || 0) > 0);
        const fishTotal = fishOwned.reduce((sum, f) => sum + (inv[f.id] || 0), 0);
        const fishCards = fishOwned.length > 0
            ? fishOwned.map(f => {
                const qty = inv[f.id] || 0;
                let expGain = f.exp || 30;
                if (f.id === 'fish_ro') expGain = 30;
                else if (f.id === 'fish_chep') expGain = 60;
                else if (f.id === 'fish_hoi') expGain = 90;
                return `
                    <div class="rounded-xl p-1.5 border bg-white border-sky-400 shadow-xs flex flex-col items-center text-center gap-0.5">
                        <div class="flex items-center justify-between w-full text-[8.5px] font-black">
                            <span class="text-sky-800">⭐ +${expGain} EXP</span>
                            <span class="px-1 rounded bg-sky-600 text-white">x${qty}</span>
                        </div>
                        <span class="text-2xl leading-none my-1">${f.icon}</span>
                        <div class="text-[9.5px] font-black text-[#3b1c06] truncate w-full">${f.name}</div>
                        <div class="text-[8px] text-cyan-800 font-bold truncate w-full">Dùng EXP / Trả Long Nữ</div>
                        <div class="w-full mt-0.5">
                            <button type="button" onclick="game.useFish('${f.id}')"
                                class="w-full py-0.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:brightness-110 active:scale-95 text-white font-black rounded text-[8px] shadow-xs flex items-center justify-center gap-0.5 cursor-pointer">
                                <span>🐟 Dùng (+${expGain} EXP)</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('')
            : `<div class="col-span-3 text-center py-2 text-[10px] font-bold text-[#784319]">Chưa có cá trong kho. Hãy ghé Hồ Câu Sunflower!</div>`;

        // 5. Mục Bánh Nướng (15 Loại - Tự động vào rương, không thể bán, chỉ dùng để ăn lấy EXP)
        const cakeOwned = BAKERY_RECIPES.map(recipe => ({
            ...recipe,
            qty: inv[recipe.id] || 0
        })).filter(c => c.qty > 0);
        const cakeTotal = cakeOwned.reduce((sum, c) => sum + c.qty, 0);
        const cakeCards = cakeOwned.length > 0
            ? cakeOwned.map(c => {
                return `
                    <div class="rounded-xl p-1.5 border bg-white border-amber-500 shadow-xs flex flex-col items-center text-center gap-0.5">
                        <div class="flex items-center justify-between w-full text-[8.5px] font-black">
                            <span class="text-amber-800">⭐ +${c.exp} EXP</span>
                            <span class="px-1 rounded bg-amber-600 text-white">x${c.qty}</span>
                        </div>
                        <div class="my-0.5 w-10 h-10 flex items-center justify-center">
                            ${this.getCakeSvg(c.id, 'w-10 h-10')}
                        </div>
                        <div class="text-[9.5px] font-black text-[#3b1c06] truncate w-full" title="${this.escapeHtml(c.name)}">${this.escapeHtml(c.name)}</div>
                        <button type="button" onclick="game.eatCake('${c.id}')"
                            class="w-full py-0.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 active:scale-95 text-white font-black rounded text-[8px] border border-emerald-400 shadow-xs flex items-center justify-center gap-0.5 cursor-pointer">
                            <span>😋 Ăn (+${c.exp} EXP)</span>
                        </button>
                    </div>
                `;
            }).join('')
            : `<div class="col-span-3 text-center py-2 text-[10px] font-bold text-[#784319]">Chưa có bánh trong rương. Hãy qua Bếp Bánh để nướng bánh thơm lừng!</div>`;

        const grandTotal = cropTotal + resTotal + eggTotal + fishTotal + cakeTotal;
        if (totalBadge) totalBadge.innerText = `${grandTotal.toLocaleString()} món`;

        const blocks = [];
        if (cat === 'all' || cat === 'crops') {
            blocks.push(this.renderWarehouseSection('🌾 Nông Sản & Cây Trồng (15 Loại)', cropTotal, 'bg-emerald-100 text-emerald-900 border-emerald-500', cropCards));
        }
        if (cat === 'all' || cat === 'resources') {
            blocks.push(this.renderWarehouseSection('⛏️ Tài Nguyên Khai Thác (Gỗ, Đá, Sắt, Vàng)', resTotal, 'bg-amber-100 text-amber-950 border-amber-500', resCards));
        }
        if (cat === 'all' || cat === 'eggs' || cat === 'animals') {
            blocks.push(this.renderWarehouseSection('🥚 Trứng', eggTotal, 'bg-amber-100 text-amber-950 border-amber-500', eggCards));
        }
        if (cat === 'all' || cat === 'fish' || cat === 'animals') {
            blocks.push(this.renderWarehouseSection('🐟 Cá Hồ Sunflower (Chỉ Dùng Tăng EXP & Trả Long Nữ - Không Thể Bán)', fishTotal, 'bg-sky-100 text-sky-950 border-sky-500', fishCards));
        }
        if (cat === 'all' || cat === 'cakes') {
            blocks.push(this.renderWarehouseSection('🍰 Bánh Nướng Thơm Lừng (Ăn Tăng EXP - Không Thể Bán)', cakeTotal, 'bg-amber-100 text-amber-950 border-amber-500', cakeCards));
        }
        container.innerHTML = blocks.join('');
    }

    async refreshP2PMarket(showPayoutToast = true) {
        try {
            const playerId = this.getPlayerId();
            const landTier = this.getHighestLandTier();
            const res = await fetch(`/api/market/listings?playerId=${encodeURIComponent(playerId)}&landTier=${landTier}`);
            const data = await res.json();
            if (!res.ok || !data.ok) return;

            this.marketListings = data.listings || [];
            this.renderP2PMarketListings();

            if (Array.isArray(data.unclaimedPayouts) && data.unclaimedPayouts.length > 0) {
                const claimRes = await fetch('/api/market/claim-payouts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerId })
                });
                const claimData = await claimRes.json();
                if (claimRes.ok && claimData.ok && claimData.totalNetVnd > 0) {
                    this.data.vnd += Number(claimData.totalNetVnd);
                    const savedVnd = Number(claimData.totalSavedFeeVnd || 0);
                    if (savedVnd > 0) {
                        if (!this.data.vipStats) this.data.vipStats = this.createDefaultData().vipStats;
                        this.data.vipStats.vndFeeSaved = (this.data.vipStats.vndFeeSaved || 0) + savedVnd;
                    }
                    this.save();
                    this.renderAll();
                    if (showPayoutToast) {
                        window.sound && window.sound.playCoin();
                        if (claimData.ownerFeeCount > 0 && claimData.sellerSaleCount > 0) {
                            window.adsgramManager.showToast(
                                `👑 Tự Động Nhận +${Number(claimData.totalNetVnd).toLocaleString()}đ VND (Gồm +${Number(claimData.totalOwnerFeeVnd).toLocaleString()}đ phí sàn từ ${claimData.ownerFeeCount} giao dịch & bán được ${claimData.sellerSaleCount} đơn hàng)!`,
                                'success'
                            );
                        } else if (claimData.ownerFeeCount > 0) {
                            window.adsgramManager.showToast(
                                `👑 Doanh Thu Chợ P2P: Bạn vừa tự động nhận được +${Number(claimData.totalOwnerFeeVnd).toLocaleString()}đ VND tiền phí sàn từ ${claimData.ownerFeeCount} giao dịch của người chơi!`,
                                'success'
                            );
                        } else {
                            window.adsgramManager.showToast(
                                `💵 Chợ P2P: Đã bán được ${claimData.payouts.length} đơn hàng! Nhận +${Number(claimData.totalNetVnd).toLocaleString()}đ VND${savedVnd > 0 ? ` (👑 VIP tiết kiệm +${savedVnd.toLocaleString()}đ phí!)` : ' (đã trừ 20% phí sàn)'}!`,
                                'success'
                            );
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Market refresh failed:', err);
        }
    }

    getMarketItemVisualHtml(itemId, fallbackIcon = '📦') {
        if (SEED_TYPES[itemId]) {
            return `<div class="w-9 h-9 flex items-center justify-center">${this.getCropSvg(itemId, 100)}</div>`;
        }
        if (RESOURCE_ITEMS[itemId]) {
            return this.getResourceItemSvg(itemId, 'w-9 h-9');
        }
        if (EGG_TYPES[itemId] || itemId === 'egg' || (itemId && itemId.startsWith('egg_'))) {
            return `<div class="w-9 h-9 flex items-center justify-center text-3xl">🥚</div>`;
        }
        return `<span class="text-2xl leading-none">${this.escapeHtml(fallbackIcon)}</span>`;
    }

    getMarketListingCategory(itemId) {
        if (RESOURCE_ITEMS[itemId]) return 'resources';
        if (EGG_TYPES[itemId] || itemId === 'egg' || (itemId && itemId.startsWith('egg_'))) return 'eggs';
        return 'crops';
    }

    renderMarketCardHtml(l, myId) {
        const isMine = l.sellerId === myId;
        const fmt = (v) => (Math.round(Number(v || 0) * 10) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
        return `
            <div class="relative rounded-lg border-2 ${isMine ? 'border-amber-700 bg-[#efd3a3]' : 'border-[#784319] bg-[#e9bc81]'} flex flex-col justify-between overflow-hidden shadow-xs text-left">
                <div class="flex items-center justify-between gap-1 px-1.5 pt-1 text-[8.5px] font-black leading-none">
                    <span class="text-[#5c3010] truncate">💵 ${fmt(l.unitPriceVnd)}đ/cái</span>
                    <span class="px-1 py-[1px] bg-[#f1f5f9] border border-[#475569] rounded text-[8px] font-black text-slate-900 flex-shrink-0">x${l.qty}</span>
                </div>
                <div class="py-1.5 flex items-center justify-center">
                    ${this.getMarketItemVisualHtml(l.itemId, l.itemIcon)}
                </div>
                <div class="bg-[#f7e7c8] border-t border-[#784319]/50 px-1.5 py-1 flex flex-col gap-0.5">
                    <div class="font-black text-[10px] text-[#3b1c06] truncate leading-tight">${this.escapeHtml(l.itemName)}</div>
                    <div class="text-[8.5px] font-bold text-[#6b3a15] truncate leading-tight">
                        ${isMine ? 'Của bạn' : this.escapeHtml(l.sellerName)} • ${fmt(l.totalPriceVnd)}đ
                    </div>
                    ${isMine ? `
                        <button type="button" onclick="game.cancelMarketListing('${this.escapeHtml(l.id)}')" class="w-full mt-0.5 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-400 font-black rounded text-[9px] active:scale-95">
                            Thu Hồi
                        </button>
                    ` : `
                        <button type="button" onclick="game.buyMarketListing('${this.escapeHtml(l.id)}')" class="w-full mt-0.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded text-[9px] shadow-xs active:scale-95">
                            Mua ${fmt(l.totalPriceVnd)}đ
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    renderMarketSectionHtml(title, badgeCls, items, myId, emptyText) {
        return `
            <div class="bg-[#efd3a3]/85 border-2 border-[#8c5426] rounded-xl p-2 space-y-1.5">
                <div class="flex items-center justify-between gap-2 pb-1 border-b border-[#8c5426]/35">
                    <span class="font-black text-[11px] text-[#3b1c06]">${title}</span>
                    <span class="px-2 py-0.5 rounded-full border text-[9.5px] font-black ${badgeCls}">${items.length} sạp</span>
                </div>
                ${items.length > 0
                    ? `<div class="grid grid-cols-3 gap-1.5">${items.map(l => this.renderMarketCardHtml(l, myId)).join('')}</div>`
                    : `<div class="text-center py-2.5 text-[10.5px] font-bold text-[#6b3a15]">${emptyText}</div>`
                }
            </div>
        `;
    }

    renderP2PMarketListings() {
        const container = document.getElementById('p2p-market-listings');
        const totalEl = document.getElementById('market-total-count');
        const mineEl = document.getElementById('market-mine-count');
        const cropsCountEl = document.getElementById('market-crops-count');
        const eggsCountEl = document.getElementById('market-eggs-count');
        const resCountEl = document.getElementById('market-resources-count');
        if (!container) return;

        const myId = this.getPlayerId();
        const all = this.marketListings || [];
        const mine = all.filter(l => l.sellerId === myId);
        if (totalEl) totalEl.innerText = all.length;
        if (mineEl) mineEl.innerText = mine.length;

        const shown = this.marketFilter === 'mine' ? mine : all;
        const cropItems = shown.filter(l => this.getMarketListingCategory(l.itemId) === 'crops');
        const eggItems = shown.filter(l => this.getMarketListingCategory(l.itemId) === 'eggs');
        const resourceItems = shown.filter(l => this.getMarketListingCategory(l.itemId) === 'resources');
        if (cropsCountEl) cropsCountEl.innerText = cropItems.length;
        if (eggsCountEl) eggsCountEl.innerText = eggItems.length;
        if (resCountEl) resCountEl.innerText = resourceItems.length;

        const cat = this.marketCategory || 'all';
        if (shown.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-[#6b3a15] font-bold text-[11px] bg-[#f7e7c8]/85 rounded-xl border border-dashed border-[#8c5426]">
                    ${this.marketFilter === 'mine'
                        ? 'Bạn chưa treo sạp hàng nào.'
                        : 'Chưa có người chơi nào treo bán trên Chợ P2P. Hãy là người đầu tiên đăng bán!'}
                </div>
            `;
            return;
        }

        const blocks = [];
        if (cat === 'all' || cat === 'crops') {
            blocks.push(this.renderMarketSectionHtml(
                '🌾 Nông Sản & Sản Phẩm',
                'bg-emerald-100 text-emerald-900 border-emerald-500',
                cropItems,
                myId,
                'Chưa có nông sản nào đang treo bán.'
            ));
        }
        if (cat === 'all' || cat === 'eggs') {
            blocks.push(this.renderMarketSectionHtml(
                '🥚 Trứng Gà Vườn',
                'bg-amber-100 text-amber-900 border-amber-500',
                eggItems,
                myId,
                'Chưa có trứng gà nào đang treo bán.'
            ));
        }
        if (cat === 'all' || cat === 'resources') {
            blocks.push(this.renderMarketSectionHtml(
                '⛏️ Tài Nguyên (Gỗ, Đá, Sắt, Vàng)',
                'bg-amber-100 text-amber-950 border-amber-500',
                resourceItems,
                myId,
                'Chưa có tài nguyên nào đang treo bán.'
            ));
        }
        container.innerHTML = blocks.join('');
    }

    openListModal(itemId) {
        if (itemId && itemId.startsWith('chicken_')) {
            window.adsgramManager.showToast('Gà không thể bán trên Chợ P2P!', 'warning');
            return;
        }
        if (itemId && itemId.startsWith('cake_')) {
            window.adsgramManager.showToast('Bánh không thể bán! Chỉ có thể ăn để nhận EXP.', 'warning');
            return;
        }
        if (itemId && (itemId.startsWith('fish_') || itemId === 'chest')) {
            window.adsgramManager.showToast('Cá không thể bán! Chỉ có thể sử dụng để tăng EXP hoặc trả nhiệm vụ cho Long Nữ.', 'warning');
            return;
        }
        if (itemId && itemId.startsWith('bait_')) {
            window.adsgramManager.showToast('Mồi câu không thể bán! Hãy dùng để câu cá.', 'warning');
            return;
        }

        const check = this.canListOnMarket();
        if (!check.allowed) {
            window.adsgramManager.showToast('Bạn chưa mua VIP nên chỉ được đăng bán 1 món hàng mỗi ngày trên Chợ! Hãy mua VIP để đăng bán không giới hạn.', 'warning');
            this.openVipCenterModal('buy');
            return;
        }

        const qtyOwned = this.data.inventory[itemId] || 0;
        const meta = this.getAllItemsMeta()[itemId];
        if (!meta || qtyOwned <= 0) return;

        this.pendingListItemId = itemId;
        const isCrop = !!P2P_CROP_FLOOR_PRICES[itemId];
        const floorPrice = isCrop ? P2P_CROP_FLOOR_PRICES[itemId] : (meta.sellVnd || 20);
        const defaultQty = qtyOwned;
        const minTotal = Math.round(defaultQty * floorPrice * 10) / 10;
        const maxTotal = isCrop ? (Math.floor(defaultQty * floorPrice * (1 + P2P_MAX_PRICE_SURCHARGE_RATE) * 10) / 10) : Infinity;
        const defaultTotal = minTotal;

        document.getElementById('list-item-icon').innerText = meta.icon;
        document.getElementById('list-item-name').innerText = meta.name;
        document.getElementById('list-item-owned').innerText = qtyOwned;
        const refLabelEl = document.getElementById('list-item-ref');
        if (refLabelEl) {
            refLabelEl.innerText = isCrop
                ? `${floorPrice.toLocaleString('vi-VN')}đ (Sàn cố định)`
                : `${floorPrice.toLocaleString('vi-VN')}đ`;
        }

        const qtyInput = document.getElementById('list-item-qty');
        const priceInput = document.getElementById('list-item-price');
        qtyInput.max = qtyOwned;
        qtyInput.value = defaultQty;
        priceInput.min = minTotal;
        if (isCrop) {
            priceInput.max = maxTotal;
            priceInput.step = '0.1';
        } else {
            priceInput.removeAttribute('max');
            priceInput.step = '1';
        }
        priceInput.value = defaultTotal;

        this.updateListModalPreview();
        window.sound.playClick();
        document.getElementById('modal-list-item').classList.remove('hidden');
    }

    updateListModalPreview() {
        const itemId = this.pendingListItemId;
        const meta = this.getAllItemsMeta()[itemId];
        const isCrop = !!P2P_CROP_FLOOR_PRICES[itemId];
        const floorPrice = isCrop ? P2P_CROP_FLOOR_PRICES[itemId] : (meta?.sellVnd || 20);
        const qty = Math.max(1, Math.floor(Number(document.getElementById('list-item-qty')?.value || 1)));
        const rawPrice = Number(document.getElementById('list-item-price')?.value || 0);
        const price = Math.max(0, Math.round(rawPrice * 10) / 10);
        const minTotal = isCrop ? (Math.round(qty * floorPrice * 10) / 10) : 10;
        const maxTotal = isCrop ? (Math.floor(qty * floorPrice * (1 + P2P_MAX_PRICE_SURCHARGE_RATE) * 10) / 10) : Infinity;

        const isVip = this.hasVipPass();
        const feeRate = this.getMarketFeeRate();
        const feePctStr = (feeRate * 100).toFixed(1).replace('.0', '').replace('.', ',') + '%';
        const fee = price >= 10 ? Math.max(1, Math.round(price * feeRate * 10) / 10) : 0;
        const net = Math.max(0, Math.round((price - fee) * 10) / 10);

        const tier = this.getHighestLandTier();
        let badgeText = '';
        if (isVip) badgeText += ' 👑VIP';
        if (tier === 2) badgeText += ' 🌿Đất C2 (-2,5%)';
        if (tier >= 3) badgeText += ' 🌟Đất C3 (-5%)';

        const lbl = document.getElementById('list-fee-label');
        if (lbl) lbl.innerText = `Phí sàn Chợ P2P (${feePctStr}${badgeText}):`;

        const promo = document.getElementById('list-vip-promo');
        if (promo) {
            promo.classList.remove('hidden');
            const listingsToday = this.getDailyMarketListingsCount();
            if (isVip) {
                promo.innerHTML = `
                    <div class="flex items-center justify-between w-full">
                        <span class="text-emerald-700 font-black">👑 VIP: Đăng bán không giới hạn (Phí sàn chỉ ${feePctStr})</span>
                    </div>
                `;
            } else {
                promo.innerHTML = `
                    <div class="flex items-center justify-between w-full">
                        <span class="text-amber-900 font-bold">Chưa VIP: Đã bán <b>${listingsToday}/1</b> đơn hôm nay</span>
                        <button type="button" id="btn-list-open-vip" class="underline text-rose-600 font-black" onclick="game.openVipCenterModal('buy')">Mua VIP (Bán không giới hạn)</button>
                    </div>
                `;
            }
        }

        const fmt = (v) => (Math.round(Number(v || 0) * 10) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
        const previewGross = document.getElementById('list-preview-gross');
        if (previewGross) previewGross.innerText = `${fmt(price)}đ`;
        const previewFee = document.getElementById('list-preview-fee');
        if (previewFee) previewFee.innerText = `-${fmt(fee)}đ`;
        const previewNet = document.getElementById('list-preview-net');
        if (previewNet) previewNet.innerText = `+${fmt(net)}đ`;

        const rangeNotice = document.getElementById('list-price-range-notice');
        const priceInput = document.getElementById('list-item-price');
        if (rangeNotice) {
            if (isCrop) {
                rangeNotice.classList.remove('hidden');
                const margin = Math.round((maxTotal - minTotal) * 10) / 10;
                if (price < minTotal) {
                    rangeNotice.className = 'mt-1 p-1.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300';
                    rangeNotice.innerHTML = `⚠️ Thấp hơn tổng giá sàn! Sàn <b>${fmt(floorPrice)}đ/món</b> x ${qty} món = tối thiểu <b>${fmt(minTotal)}đ</b>!`;
                    if (priceInput) priceInput.classList.add('border-rose-500', 'text-rose-700');
                } else if (price > maxTotal) {
                    rangeNotice.className = 'mt-1 p-1.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300';
                    rangeNotice.innerHTML = `⚠️ Vượt quá +3% tổng giá sàn! Tối đa <b>${fmt(maxTotal)}đ</b> cho ${qty} món (Tổng sàn ${fmt(minTotal)}đ + 3% = +${fmt(margin)}đ)!`;
                    if (priceInput) priceInput.classList.add('border-rose-500', 'text-rose-700');
                } else {
                    rangeNotice.className = 'mt-1 p-1.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
                    rangeNotice.innerHTML = `✓ Giá hợp lệ cho ${qty} món: Tổng sàn <b>${fmt(minTotal)}đ</b> • Khoảng cho phép (+3%): <b>${fmt(minTotal)}đ - ${fmt(maxTotal)}đ</b> (~${fmt(price / qty)}đ/món).`;
                    if (priceInput) priceInput.classList.remove('border-rose-500', 'text-rose-700');
                }
            } else {
                rangeNotice.classList.add('hidden');
                if (priceInput) priceInput.classList.remove('border-rose-500', 'text-rose-700');
            }
        }
    }

    async confirmListItem() {
        if (this.isMarketBusy) return;

        const check = this.canListOnMarket();
        if (!check.allowed) {
            window.adsgramManager.showToast('Bạn chưa mua VIP nên chỉ được đăng bán 1 món hàng mỗi ngày trên Chợ! Hãy mua VIP để đăng bán không giới hạn.', 'warning');
            this.openVipCenterModal('buy');
            return;
        }

        const itemId = this.pendingListItemId;
        const meta = this.getAllItemsMeta()[itemId];
        const owned = this.data.inventory[itemId] || 0;
        if (!itemId || !meta || owned <= 0) return;

        const qty = Math.floor(Number(document.getElementById('list-item-qty').value || 0));
        const price = Math.round(Number(document.getElementById('list-item-price').value || 0) * 10) / 10;

        if (qty < 1 || qty > owned) {
            window.adsgramManager.showToast(`Số lượng bán phải từ 1 đến ${owned}!`, 'warning');
            return;
        }
        if (price < 10) {
            window.adsgramManager.showToast('Tổng giá niêm yết tối thiểu là 10đ VND!', 'warning');
            return;
        }

        if (P2P_CROP_FLOOR_PRICES[itemId]) {
            const floor = P2P_CROP_FLOOR_PRICES[itemId];
            const minTotal = Math.round(qty * floor * 10) / 10;
            const maxTotal = Math.floor(qty * floor * (1 + P2P_MAX_PRICE_SURCHARGE_RATE) * 10) / 10;
            const fmt = (v) => (Math.round(Number(v || 0) * 10) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
            if (price < minTotal) {
                window.adsgramManager.showToast(`Tổng giá bán không được thấp hơn tổng giá sàn (${qty} món x ${fmt(floor)}đ = tối thiểu ${fmt(minTotal)}đ)!`, 'warning');
                return;
            }
            if (price > maxTotal) {
                window.adsgramManager.showToast(`Tổng giá bán không được vượt quá +3% tổng giá sàn (${qty} món x ${fmt(floor)}đ = ${fmt(minTotal)}đ, tối đa ${fmt(maxTotal)}đ)!`, 'warning');
                return;
            }
        }

        this.isMarketBusy = true;
        try {
            const res = await fetch('/api/market/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId: this.getPlayerId(),
                    sellerName: this.playerName,
                    sellerLandTier: this.getHighestLandTier(),
                    itemId,
                    itemName: meta.name,
                    itemIcon: meta.icon,
                    category: itemId.startsWith('chicken_') ? 'chicken' : (itemId.startsWith('egg_') ? 'egg' : (itemId.startsWith('fish_') || itemId === 'chest' ? 'fish' : 'crop')),
                    qty,
                    totalPriceVnd: price
                })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                window.adsgramManager.showToast(data.error || 'Không thể đăng bán!', 'error');
                return;
            }

            this.data.inventory[itemId] -= qty;
            if (this.data.inventory[itemId] <= 0) delete this.data.inventory[itemId];
            this.pendingListItemId = null;
            document.getElementById('modal-list-item').classList.add('hidden');

            if (!this.data.marketListingsToday || this.data.marketListingsToday.date !== this.getTodayDateKey()) {
                this.data.marketListingsToday = { date: this.getTodayDateKey(), count: 0 };
            }
            this.data.marketListingsToday.count = (this.data.marketListingsToday.count || 0) + 1;

            window.sound.playCoin();
            window.adsgramManager.showToast(`🏷️ Đã treo bán ${qty} ${meta.name} giá ${price.toLocaleString()}đ lên Chợ P2P!`, 'success');
            this.save();
            this.renderAll();
            await this.refreshP2PMarket(false);
        } catch (err) {
            window.adsgramManager.showToast('Lỗi kết nối máy chủ Chợ P2P!', 'error');
        } finally {
            this.isMarketBusy = false;
        }
    }

    async buyMarketListing(listingId) {
        if (this.isMarketBusy) return;
        const listing = (this.marketListings || []).find(l => l.id === listingId);
        if (!listing) return;

        if (this.data.vnd < listing.totalPriceVnd) {
            window.adsgramManager.showToast(
                `Bạn cần ${Number(listing.totalPriceVnd).toLocaleString()}đ VND để mua đơn này! Có thể nạp MoMo/ZaloPay hoặc bán đồ trên Chợ.`,
                'warning'
            );
            return;
        }

        this.isMarketBusy = true;
        try {
            const res = await fetch('/api/market/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId,
                    buyerId: this.getPlayerId(),
                    buyerName: this.playerName
                })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                window.adsgramManager.showToast(data.error || 'Mua hàng thất bại!', 'warning');
                await this.refreshP2PMarket(false);
                return;
            }

            this.data.vnd -= Number(listing.totalPriceVnd);
            this.data.inventory[listing.itemId] = (this.data.inventory[listing.itemId] || 0) + Number(listing.qty);

            const appliedPctStr = Number(((data.appliedFeeRate || 0.20) * 100).toFixed(1)).toString().replace('.', ',');
            window.sound.playFanfare();
            window.adsgramManager.showToast(
                `🛒 Đã mua ${listing.qty} ${listing.itemName} từ ${listing.sellerName} (-${Number(listing.totalPriceVnd).toLocaleString()}đ • Phí sàn ${appliedPctStr}%: ${data.feeVnd}đ)!`,
                'success'
            );
            this.save();
            this.renderAll();
            await this.refreshP2PMarket(false);
        } catch (err) {
            window.adsgramManager.showToast('Lỗi kết nối máy chủ Chợ P2P!', 'error');
        } finally {
            this.isMarketBusy = false;
        }
    }

    async cancelMarketListing(listingId) {
        if (this.isMarketBusy) return;
        this.isMarketBusy = true;
        try {
            const res = await fetch('/api/market/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId,
                    playerId: this.getPlayerId()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                window.adsgramManager.showToast(data.error || 'Không thể thu hồi sạp hàng!', 'warning');
                await this.refreshP2PMarket(false);
                return;
            }

            this.data.inventory[data.itemId] = (this.data.inventory[data.itemId] || 0) + Number(data.qty);
            window.sound.playClick();
            window.adsgramManager.showToast(`📦 Đã thu hồi ${data.qty} ${data.itemName} về Kho!`, 'info');
            this.save();
            this.renderAll();
            await this.refreshP2PMarket(false);
        } catch (err) {
            window.adsgramManager.showToast('Lỗi kết nối máy chủ Chợ P2P!', 'error');
        } finally {
            this.isMarketBusy = false;
        }
    }

    convertVndToGold(vndAmount = 100, goldGain = 10) {
        if (this.data.vnd < vndAmount) {
            window.adsgramManager.showToast(`Cần ${vndAmount.toLocaleString()}đ VND để đổi lấy ${goldGain.toLocaleString()}💰 Vàng! Hãy bán nông sản trước!`, "warning");
            return;
        }

        this.data.vnd -= vndAmount;
        this.data.gold += goldGain;
        window.sound.playCoin();
        window.adsgramManager.showToast(`💱 Đổi thành công ${vndAmount.toLocaleString()}đ VND ➔ +${goldGain.toLocaleString()} 💰 Vàng!`, "success");
        this.save();
        this.renderAll();
    }

    convertVndToDiamond(vndAmount = 100, diamondGain = 10) {
        if ((this.data.vnd || 0) < vndAmount) {
            window.adsgramManager.showToast(`Bạn cần ${vndAmount.toLocaleString()}đ VND để đổi lấy ${diamondGain.toLocaleString()} 💎 Kim Cương! Hãy bán nông sản/cá trên Chợ!`, "warning");
            return;
        }

        this.data.vnd -= vndAmount;
        this.data.diamonds = (this.data.diamonds || 0) + diamondGain;
        window.sound.playCoin();
        window.adsgramManager.showToast(`💎 Đổi thành công ${vndAmount.toLocaleString()}đ VND ➔ +${diamondGain.toLocaleString()} 💎 Kim Cương!`, "success");
        this.save();
        this.renderAll();
    }

    buyVipRodWithGold() {
        if (this.data.hasVipRodPermanent) {
            window.adsgramManager.showToast("Bạn đã sở hữu Cần Câu VIP vĩnh viễn rồi!", "info");
            return false;
        }
        if (this.data.gold < VIP_ROD_PRICE_GOLD) {
            window.adsgramManager.showToast(`Cần ${VIP_ROD_PRICE_GOLD.toLocaleString()}💰 Vàng để mua Cần Câu VIP!`, "warning");
            return false;
        }

        this.data.gold -= VIP_ROD_PRICE_GOLD;
        this.data.hasVipRodPermanent = true;
        this.data.isVipRod = true;
        window.sound.playFanfare();
        window.adsgramManager.showToast("👑 Đã mua Cần Câu VIP Vĩnh Viễn! Giờ bạn có thể câu được toàn bộ Cá To tại HỒ CÁ!", "success");
        this.save();
        this.renderAll();
        return true;
    }

    openVipRodModal() {
        const modal = document.getElementById('modal-vip-rod');
        const btnBuy = document.getElementById('btn-buy-vip-rod-gold');
        const statusEl = document.getElementById('vip-rod-status-text');
        if (!modal) return;

        if (this.data.hasVipRodPermanent) {
            if (statusEl) statusEl.innerHTML = `<span class="text-emerald-700 font-black">✅ Bạn đã sở hữu Cần Câu VIP Vĩnh Viễn!</span> Các loài <b>Cá To</b> đã được mở khóa ở HỒ CÁ.`;
            if (btnBuy) {
                btnBuy.innerHTML = '👑 Đã Sở Hữu Vĩnh Viễn ✓';
                btnBuy.disabled = true;
                btnBuy.classList.add('opacity-60');
            }
        } else {
            if (statusEl) statusEl.innerHTML = `Cần thường chỉ câu được cá nhỏ. Hãy <b>Mua Cần Câu VIP</b> để mở khóa toàn bộ <b>Cá To</b> giá cao (320đ – 1,200đ + 💎)!`;
            if (btnBuy) {
                btnBuy.innerHTML = `👑 Mua Vĩnh Viễn: ${VIP_ROD_PRICE_GOLD.toLocaleString()} ${GOLD_ICON} Vàng`;
                btnBuy.disabled = false;
                btnBuy.classList.remove('opacity-60');
            }
        }
        modal.classList.remove('hidden');
    }

    upgradeRod() {
        if (this.data.rodLevel >= 3) {
            window.adsgramManager.showToast("Cần thường đã đạt cấp tối đa! Hãy mua Cần Câu VIP để câu Cá To!", "info");
            return;
        }
        const cost = this.data.rodLevel * 500;
        if (this.data.gold < cost) {
            window.adsgramManager.showToast(`Bạn cần ${cost}💰 Vàng để nâng cấp cần câu!`, "warning");
            return;
        }

        this.data.gold -= cost;
        this.data.rodLevel++;
        window.sound.playFanfare();
        window.adsgramManager.showToast("Nâng cấp cần câu thành công!", "success");
        this.save();
        this.renderAll();
    }

    // ==========================================
    // BẾP NẤU BÁNH NÔNG TRẠI (BAKERY SYSTEM)
    // LÊN CẤP CHỈ DỰA VÀO NẤU ĂN DÙNG NGUYÊN LIỆU TRỒNG ĐƯỢC
    // ==========================================
    setBakeryFilter(filter) {
        this.data.bakeryFilter = filter || 'all';
        document.querySelectorAll('.bakery-filter-tab').forEach(tab => {
            const f = tab.getAttribute('data-filter');
            const isActive = f === this.data.bakeryFilter;
            tab.className = isActive
                ? 'bakery-filter-tab px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black shadow transition active:scale-95'
                : 'bakery-filter-tab px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 hover:text-white transition active:scale-95';
        });
        this.renderBakeryUI();
    }

    renderBakeryUI() {
        const listEl = document.getElementById('bakery-recipes-list');
        const summaryEl = document.getElementById('bakery-ovens-summary');
        const now = Date.now();

        if (!this.data.bakingSlots || typeof this.data.bakingSlots !== 'object') {
            this.data.bakingSlots = {};
        }

        const isVip = this.hasVipPass();
        const maxSlots = isVip ? 4 : 1;
        const activeSlots = Object.values(this.data.bakingSlots);
        const activeCount = activeSlots.length;

        let readyCount = 0;
        let bakingCount = 0;
        activeSlots.forEach(slot => {
            if (slot && typeof slot === 'object') {
                if (now >= slot.finishAt) {
                    readyCount++;
                } else {
                    bakingCount++;
                }
            }
        });

        // 1. Render Danh Sách Dạng Lưới Các Lò Nướng Đang Nấu (Thay thế phần ở Ảnh 1)
        if (summaryEl) {
            let ovenCardsHtml = '';

            // Render các lò đang có bánh nướng / đã chín
            activeSlots.forEach(slot => {
                const isReady = now >= slot.finishAt;
                const remSec = Math.max(0, Math.ceil((slot.finishAt - now) / 1000));
                const recMeta = BAKERY_RECIPES.find(r => r.id === slot.recipeId);
                const expDisplay = recMeta ? recMeta.exp : (slot.exp || 60);
                ovenCardsHtml += `
                    <div class="rounded-2xl border-2 ${isReady ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300' : 'border-amber-500 bg-amber-50/90'} p-2.5 shadow-sm flex flex-col justify-between items-center text-center gap-1.5 transition">
                        <div class="flex items-center justify-between w-full text-[9px] font-black leading-none">
                            <span class="text-amber-800">⭐ +${expDisplay} EXP</span>
                            <span class="px-1.5 py-0.5 rounded text-[8.5px] ${isReady ? 'bg-emerald-600 text-white animate-pulse' : 'bg-amber-500 text-white'}">
                                ${isReady ? '✨ Đã Chín' : '🔥 Đang Nướng'}
                            </span>
                        </div>
                        <div class="my-0.5 w-12 h-12 flex items-center justify-center">
                            ${this.getCakeSvg(slot.recipeId, 'w-12 h-12')}
                        </div>
                        <div class="font-black text-[11px] text-[#3b1c06] truncate w-full">${this.escapeHtml(slot.name)}</div>
                        
                        ${isReady ? `
                            <button type="button" onclick="game.claimBakedCake('${slot.recipeId}')"
                                class="w-full py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 active:scale-95 text-white font-black text-[10px] rounded-xl shadow border border-emerald-300 animate-bounce cursor-pointer flex items-center justify-center gap-1">
                                <span>✨ Nhận Bánh</span>
                            </button>
                        ` : `
                            <div class="w-full py-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[10px] rounded-xl border border-amber-500 shadow-xs flex items-center justify-center gap-1 animate-pulse">
                                <span>⏱️</span>
                                <span>${this.formatCountdownClock(remSec)}</span>
                            </div>
                        `}
                    </div>
                `;
            });

            // Render các lò trống còn lại trong sức chứa
            const emptySlotsCount = Math.max(0, maxSlots - activeCount);
            for (let i = 0; i < emptySlotsCount; i++) {
                ovenCardsHtml += `
                    <div class="rounded-2xl border-2 border-dashed border-[#8c5426]/30 bg-[#fbf3db]/60 p-2.5 flex flex-col justify-center items-center text-center gap-1 min-h-[120px]">
                        <span class="text-2xl opacity-60">♨️</span>
                        <div class="text-[11px] font-black text-[#6b3a15]">Lò Nướng Trống</div>
                        <div class="text-[9px] text-[#8c5426]">Chọn bánh bên dưới để nướng</div>
                    </div>
                `;
            }

            // Nếu người chơi chưa có VIP, hiển thị thẻ gợi ý 3 lò VIP đang bị khóa
            if (!isVip) {
                ovenCardsHtml += `
                    <div class="rounded-2xl border-2 border-dashed border-amber-400/80 bg-gradient-to-b from-amber-50 to-orange-50 p-2.5 flex flex-col justify-center items-center text-center gap-1 min-h-[120px]">
                        <div class="flex items-center gap-1 text-lg">
                            <span>🔒</span><span>👑</span>
                        </div>
                        <div class="text-[11px] font-black text-amber-950">+3 Lò Nướng VIP</div>
                        <div class="text-[8.5px] text-amber-800 leading-tight">Nâng cấp VIP để nấu tối đa 4 loại bánh cùng lúc!</div>
                        <button type="button" onclick="game.openVipCenterModal('buy')"
                            class="mt-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] rounded-lg shadow-xs active:scale-95">
                            Xem Gói VIP
                        </button>
                    </div>
                `;
            }

            const gridColsClass = isVip ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2';

            summaryEl.innerHTML = `
                <div class="flex flex-col gap-2 w-full">
                    <div class="flex items-center justify-between gap-2 border-b border-[#8c5426]/20 pb-1.5">
                        <div class="flex items-center gap-1.5">
                            <span class="text-lg">🔥</span>
                            <span class="font-black text-xs text-[#5c2d0c]">
                                Lò Nướng Bánh (${activeCount}/${maxSlots} Lò ${isVip ? '• 👑 VIP' : '• Thường'})
                            </span>
                        </div>
                        <div class="flex items-center gap-1">
                            ${readyCount > 0 ? `
                                <button type="button" onclick="game.claimAllBakedCakes()"
                                    class="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 active:scale-95 text-white text-[10px] font-black shadow border border-emerald-300 animate-bounce cursor-pointer flex items-center gap-1">
                                    <span>✨ Nhận Hết (${readyCount})</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="grid ${gridColsClass} gap-2">
                        ${ovenCardsHtml}
                    </div>
                </div>
            `;
        }

        // 2. Render Danh Sách 15 Loại Bánh (Trở về trạng thái bình thường - không hiện Đang nướng như Ảnh 2)
        if (!listEl) return;
        listEl.className = 'grid grid-cols-3 gap-1.5 pb-2';

        const inv = this.data.inventory || {};
        const filtered = BAKERY_RECIPES;

        listEl.innerHTML = filtered.map(recipe => {
            const cropIng = (recipe.ingredients && recipe.ingredients[0]) || { id: 'rau_mam', name: 'Rau Mầm', icon: '🌱', qty: 1 };
            const eggIng = (recipe.ingredients && recipe.ingredients[1]) || { id: 'egg_normal', name: 'Trứng Gà', icon: '🥚', qty: 2 };
            const cropHave = inv[cropIng.id] || 0;
            const eggHave = inv[eggIng.id] || 0;
            const hasCrop = cropHave >= (cropIng.qty || 1);
            const hasEgg = eggHave >= (eggIng.qty || 2);
            const canCook = hasCrop && hasEgg;

            let actionHtml = '';
            if (!canCook) {
                let missingLabel = 'Thiếu NL';
                if (!hasCrop && !hasEgg) {
                    missingLabel = `Thiếu ${cropIng.name} & Trứng`;
                } else if (!hasCrop) {
                    missingLabel = `Thiếu ${cropIng.name}`;
                } else {
                    missingLabel = `Thiếu 2 Trứng (${eggHave}/2)`;
                }
                actionHtml = `
                    <button type="button" disabled
                        class="w-full mt-0.5 py-1 bg-slate-300/80 text-slate-500 font-bold rounded text-[8.5px] cursor-not-allowed">
                        ${missingLabel}
                    </button>
                `;
            } else {
                actionHtml = `
                    <button type="button" onclick="game.startCookingRecipe('${recipe.id}')"
                        class="w-full mt-0.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded text-[9px] shadow-xs transition cursor-pointer flex items-center justify-center gap-0.5">
                        <span>🔥 Nướng Bánh</span>
                    </button>
                `;
            }

            return `
                <div class="relative rounded-lg border-2 border-[#784319] bg-[#e9bc81] flex flex-col justify-between overflow-hidden shadow-xs text-left transition">
                    <div class="flex items-center justify-between gap-1 px-1.5 pt-1 text-[8.5px] font-black leading-none">
                        <span class="text-[#5c3010] truncate">⭐ +${recipe.exp} EXP</span>
                        <div class="flex items-center gap-0.5 text-[8px] font-black flex-shrink-0">
                            <span class="px-1 py-[0.5px] rounded border ${hasCrop ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-[#f1f5f9] text-slate-700 border-slate-400'}" title="${cropIng.name}">${cropIng.icon}x${cropHave}</span>
                            <span class="px-1 py-[0.5px] rounded border ${hasEgg ? 'bg-amber-600 text-white border-amber-700' : 'bg-rose-100 text-rose-800 border-rose-300'}" title="Trứng Gà">🥚${eggHave}/2</span>
                        </div>
                    </div>
                    <div class="py-1 flex items-center justify-center relative">
                        <div class="w-10 h-10 flex items-center justify-center">
                            ${this.getCakeSvg(recipe.id, 'w-10 h-10')}
                        </div>
                    </div>
                    <div class="bg-[#f7e7c8] border-t border-[#784319]/50 px-1.5 py-1 flex flex-col gap-0.5">
                        <div class="font-black text-[10px] text-[#3b1c06] truncate leading-tight">${this.escapeHtml(recipe.name)}</div>
                        <div class="text-[8.5px] font-bold text-[#6b3a15] truncate leading-tight">
                            1x ${cropIng.icon} + 2🥚 • ⏱️ ${recipe.cookTimeLabel}
                        </div>
                        ${actionHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    startCookingRecipe(recipeId) {
        const recipe = BAKERY_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return false;

        if (!this.data.bakingSlots || typeof this.data.bakingSlots !== 'object') {
            this.data.bakingSlots = {};
        }

        const now = Date.now();
        const slotKeys = Object.keys(this.data.bakingSlots);
        const isVip = this.hasVipPass();
        const maxSlots = isVip ? 4 : 1;

        // Nếu loại bánh này đang có trong lò
        const existingSlot = this.data.bakingSlots[recipeId];
        if (existingSlot) {
            if (now >= existingSlot.finishAt) {
                // Bánh đã chín, bấm nhận luôn
                return this.claimBakedCake(recipeId);
            } else {
                const remSec = Math.max(0, Math.ceil((existingSlot.finishAt - now) / 1000));
                window.adsgramManager.showToast(`Bánh "${recipe.name}" đang được nướng ở Lò bên trên (còn ${this.formatCountdownClock(remSec)})! Vui lòng chờ bánh chín.`, 'warning');
                return false;
            }
        }

        // Kiểm tra giới hạn số loại bánh nướng cùng lúc (Không VIP: 1 loại, VIP: 4 loại)
        if (slotKeys.length >= maxSlots) {
            if (!isVip) {
                window.adsgramManager.showToast(`Bạn chỉ có thể nấu 1 loại bánh cùng lúc! Hãy chờ bánh chín hoặc mua Thẻ VIP để mở tối đa 4 lò nướng cùng lúc!`, 'warning');
            } else {
                window.adsgramManager.showToast(`Đã đạt tối đa 4 lò nướng cùng lúc! Vui lòng chờ bánh chín để nhận bánh.`, 'warning');
            }
            return false;
        }

        // Kiểm tra nguyên liệu nông sản & trứng gà
        const inv = this.data.inventory || {};
        for (const ing of recipe.ingredients) {
            const have = inv[ing.id] || 0;
            if (have < ing.qty) {
                if (ing.id === 'egg_normal') {
                    window.adsgramManager.showToast(`Không đủ ${ing.name} (cần ${ing.qty} quả, trong kho có ${have})! Hãy nuôi gà đẻ trứng ở Trại Gà!`, 'warning');
                } else {
                    window.adsgramManager.showToast(`Không đủ ${ing.name} (cần ${ing.qty}, trong kho có ${have})! Hãy trồng thêm ở Vườn Cây!`, 'warning');
                }
                return false;
            }
        }

        // Trừ nguyên liệu nông sản & trứng trong kho
        recipe.ingredients.forEach(ing => {
            this.data.inventory[ing.id] -= ing.qty;
            if (this.data.inventory[ing.id] <= 0) {
                delete this.data.inventory[ing.id];
            }
        });

        const cookTimeSec = recipe.cookTimeSec || 60;
        this.data.bakingSlots[recipeId] = {
            recipeId,
            count: 1,
            startedAt: now,
            finishAt: now + cookTimeSec * 1000,
            cookTimeSec,
            exp: recipe.exp,
            name: recipe.name,
            icon: recipe.icon
        };

        if (window.sound) window.sound.playClick();
        window.adsgramManager.showToast(`🔥 Đã đưa "${recipe.name}" vào lò nướng (${slotKeys.length + 1}/${maxSlots} lò)!`, 'info');

        this.save();
        this.renderBakeryUI();
        return true;
    }

    claimBakedCake(recipeId) {
        if (!this.data.bakingSlots || typeof this.data.bakingSlots !== 'object') {
            this.data.bakingSlots = {};
        }
        const slot = this.data.bakingSlots[recipeId];
        if (!slot) return false;

        const now = Date.now();
        if (now < slot.finishAt) {
            const remSec = Math.max(0, Math.ceil((slot.finishAt - now) / 1000));
            window.adsgramManager.showToast(`Bánh ${slot.name || ''} chưa chín! Vui lòng chờ thêm ${this.formatCountdownClock(remSec)}.`, 'warning');
            return false;
        }

        const recipe = BAKERY_RECIPES.find(r => r.id === recipeId);
        const name = slot.name || (recipe ? recipe.name : 'Bánh');
        const count = slot.count || 1;

        delete this.data.bakingSlots[recipeId];
        this.data.totalCakesCooked = (this.data.totalCakesCooked || 0) + count;

        // Bánh tự động vào rương đồ (inventory)
        if (!this.data.inventory) this.data.inventory = {};
        this.data.inventory[recipeId] = (this.data.inventory[recipeId] || 0) + count;

        if (window.sound) window.sound.playCoin();
        window.adsgramManager.showToast(`✨ Đã nhận ${count}x "${name}" vào Rương Đồ! Hãy vào Rương Đồ > mục Bánh để sử dụng nhận EXP!`, 'success');

        this.save();
        this.updateHeaderUI();
        this.renderBakeryUI();
        return true;
    }

    claimAllBakedCakes() {
        if (!this.data.bakingSlots || typeof this.data.bakingSlots !== 'object') {
            this.data.bakingSlots = {};
        }
        const now = Date.now();
        let count = 0;

        if (!this.data.inventory) this.data.inventory = {};

        Object.keys(this.data.bakingSlots).forEach(id => {
            const slot = this.data.bakingSlots[id];
            if (slot && now >= slot.finishAt) {
                const addQty = slot.count || 1;
                count += addQty;
                this.data.inventory[id] = (this.data.inventory[id] || 0) + addQty;
                delete this.data.bakingSlots[id];
            }
        });

        if (count === 0) {
            window.adsgramManager.showToast('Chưa có chiếc bánh nào chín để nhận!', 'info');
            return false;
        }

        this.data.totalCakesCooked = (this.data.totalCakesCooked || 0) + count;

        if (window.sound) window.sound.playCoin();
        window.adsgramManager.showToast(`✨ Đã nhận ${count} bánh chín vào Rương Đồ! Mở Rương Đồ > mục Bánh để ăn lấy EXP!`, 'success');

        this.save();
        this.updateHeaderUI();
        this.renderBakeryUI();
        return true;
    }

    eatCake(recipeId) {
        if (!this.data.inventory || !this.data.inventory[recipeId] || this.data.inventory[recipeId] <= 0) {
            window.adsgramManager.showToast('Bạn không có bánh này trong rương đồ!', 'warning');
            return false;
        }

        const recipe = BAKERY_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return false;

        this.data.inventory[recipeId] -= 1;
        if (this.data.inventory[recipeId] <= 0) {
            delete this.data.inventory[recipeId];
        }

        const expGain = recipe.exp || 60;
        this.addExp(expGain, 'cake');

        if (window.sound) window.sound.playCoin();
        window.adsgramManager.showToast(`😋 Bạn vừa ăn "${recipe.name}" và nhận được +${expGain.toLocaleString()} ⭐ EXP!`, 'success');

        this.save();
        this.updateHeaderUI();
        this.renderWarehouseModal();
        return true;
    }

    useFish(fishId) {
        if (!this.data.inventory || !this.data.inventory[fishId] || this.data.inventory[fishId] <= 0) {
            window.adsgramManager.showToast('Bạn không có loại cá này trong rương đồ!', 'warning');
            return false;
        }

        const fish = FISH_TYPES.find(f => f.id === fishId) || { name: 'Cá' };

        this.data.inventory[fishId] -= 1;
        if (this.data.inventory[fishId] <= 0) {
            delete this.data.inventory[fishId];
        }

        // Quy ước EXP: Cá Rô Đồng = 30 EXP, Cá Chép Vàng = 60 EXP, Cá Hồi = 90 EXP
        let expGain = 30;
        if (fishId === 'fish_ro') expGain = 30;
        else if (fishId === 'fish_chep') expGain = 60;
        else if (fishId === 'fish_hoi') expGain = 90;
        else if (fish.exp) expGain = fish.exp;

        this.addExp(expGain, 'fish');

        if (window.sound) window.sound.playCoin();
        window.adsgramManager.showToast(`🐟 Bạn vừa sử dụng "${fish.name}" và nhận được +${expGain.toLocaleString()} ⭐ EXP!`, 'success');

        this.save();
        this.updateHeaderUI();
        this.renderWarehouseModal();
        return true;
    }

    getLongNuFishReward(fishId) {
        const dailyCrops = this.getDailyBaitCrops();
        let baitCropId = dailyCrops.normal;
        if (fishId === 'fish_chep') {
            baitCropId = dailyCrops.medium;
        } else if (fishId === 'fish_hoi') {
            baitCropId = dailyCrops.high;
        }
        const cropMeta = (typeof SEED_TYPES !== 'undefined' && SEED_TYPES[baitCropId]) ? SEED_TYPES[baitCropId] : { seedCost: 1 };
        const buyPrice = cropMeta.seedCost !== undefined ? cropMeta.seedCost : 1;
        // Công thức: giá mua ở Phú Nông của tổng 5 mồi câu hôm đó + 140 vàng + thêm 10 vàng nữa
        return Math.round(((5 * buyPrice) + 140 + 10) * 10) / 10;
    }

    getLongNuQuestInfo(fishId) {
        const dailyCrops = this.getDailyBaitCrops();
        let baitCropId = dailyCrops.normal;
        let fishName = 'Cá Rô Đồng';
        let fishIcon = '🐟';
        let expVal = 30;
        if (fishId === 'fish_chep') {
            baitCropId = dailyCrops.medium;
            fishName = 'Cá Chép Vàng';
            fishIcon = '🐠';
            expVal = 60;
        } else if (fishId === 'fish_hoi') {
            baitCropId = dailyCrops.high;
            fishName = 'Cá Hồi';
            fishIcon = '🍣';
            expVal = 90;
        }
        const cropMeta = (typeof SEED_TYPES !== 'undefined' && SEED_TYPES[baitCropId]) ? SEED_TYPES[baitCropId] : { name: baitCropId, icon: '🌱', seedCost: 1 };
        const buyPrice = cropMeta.seedCost !== undefined ? cropMeta.seedCost : 1;
        const totalBaitCost = Math.round(5 * buyPrice * 10) / 10;
        const rewardGold = Math.round((totalBaitCost + 140 + 10) * 10) / 10;
        return {
            fishId,
            fishName,
            fishIcon,
            expVal,
            baitCropId,
            baitName: cropMeta.name,
            baitIcon: cropMeta.icon,
            buyPrice,
            totalBaitCost,
            rewardGold
        };
    }

    deliverFishToLongNu(fishId, qty = 1) {
        const owned = this.data.inventory?.[fishId] || 0;
        if (owned <= 0) {
            window.adsgramManager.showToast('Bạn chưa có con cá này trong kho để giao cho Long Nữ!', 'warning');
            return false;
        }

        const count = qty === 'all' ? owned : Math.min(owned, Math.max(1, Number(qty) || 1));
        const info = this.getLongNuQuestInfo(fishId);
        const singleReward = info.rewardGold;
        const totalReward = singleReward * count;

        this.data.inventory[fishId] -= count;
        if (this.data.inventory[fishId] <= 0) {
            delete this.data.inventory[fishId];
        }

        this.data.gold = Math.round((this.data.gold + totalReward) * 10) / 10;

        if (!this.data.dailyQuests || this.data.dailyQuests.date !== this.getTodayDateKey()) {
            this.data.dailyQuests = this.createFreshDailyQuests();
        }
        if (!this.data.dailyQuests.claimed) this.data.dailyQuests.claimed = {};
        const dailyQuestId = `q_long_nu_${fishId.replace('fish_', '')}`;
        this.data.dailyQuests.claimed[dailyQuestId] = true;

        if (window.sound) window.sound.playFanfare();
        window.adsgramManager.showToast(`🧜‍♀️ Long Nữ đã nhận ${count}x ${info.fishIcon} ${info.fishName}! Bạn nhận được +${totalReward.toLocaleString('vi-VN')}💰 Vàng!`, 'success');

        this.save();
        this.renderAll();
        return true;
    }

    cookRecipe(recipeId, count = 1) {
        return this.startCookingRecipe(recipeId);
    }

    // ==========================================
    // NHIỆM VỤ TRẢ TÀI NGUYÊN HÀNG NGÀY (CHỈ NHẬN VÀNG)
    // ==========================================
    incrementQuest() {
        if (!this.data.dailyQuests || this.data.dailyQuests.date !== this.getTodayDateKey()) {
            this.data.dailyQuests = this.createFreshDailyQuests();
        }
        this.renderQuestsUI();
    }

    renderQuestsUI() {
        const listEl = document.getElementById('quests-list');
        const dotEl = document.getElementById('quest-notify-dot');
        if (!this.data.dailyQuests) this.data.dailyQuests = this.createFreshDailyQuests();
        if (!this.data.dailyQuests.claimed) this.data.dailyQuests.claimed = {};

        const isVip = this.hasVipPass();
        let hasClaimable = false;

        // 1. BẢNG NHIỆM VỤ NÔNG SẢN "THƯƠNG GIA" (3 NHIỆM VỤ / NGÀY)
        const merchantCards = MERCHANT_QUESTS_META.map(q => {
            const isClaimed = !!this.data.dailyQuests?.claimed?.[q.id];
            const isLockedVip = q.isVipOnly && !isVip;

            // Kiểm tra từng nông sản trong đơn hàng (mỗi loại 5 quả)
            let allEnough = true;
            const itemsHtml = q.requirements.map(r => {
                const s = SEED_TYPES[r.id];
                const have = this.data.inventory?.[r.id] || 0;
                const ok = have >= r.qty;
                if (!ok) allEnough = false;
                return `
                    <div class="flex flex-col items-center justify-center p-1 rounded-xl border text-center ${
                        ok ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs' : 'bg-rose-50/70 border-rose-200'
                    }">
                        <div class="text-base sm:text-lg leading-tight my-0.5">${s.icon}</div>
                        <div class="text-[8.5px] font-bold text-slate-700 truncate w-full" title="${s.name}">${s.name}</div>
                        <div class="text-[9.5px] font-black ${ok ? 'text-emerald-700' : 'text-rose-600'}">
                            ${have}/${r.qty} ${ok ? '✓' : ''}
                        </div>
                    </div>
                `;
            }).join('');

            let actionBtnHtml = '';
            if (isClaimed) {
                actionBtnHtml = `
                    <button type="button" disabled
                        class="w-full py-1.5 rounded-xl bg-slate-200 text-slate-500 font-black text-[10px] cursor-not-allowed flex items-center justify-center gap-1">
                        <span>✓ Đã Trả Hôm Nay (+${q.rewardGold.toLocaleString('vi-VN')}💰 Vàng)</span>
                    </button>
                `;
            } else if (isLockedVip) {
                actionBtnHtml = `
                    <button type="button" onclick="game.openVipModal()"
                        class="w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-[10.5px] shadow-sm border border-yellow-200 flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>👑 Mua VIP Để Mở Đơn Này (+${q.rewardGold.toLocaleString('vi-VN')}💰 Vàng)</span>
                    </button>
                `;
            } else if (allEnough) {
                hasClaimable = true;
                actionBtnHtml = `
                    <button type="button" onclick="game.claimMerchantQuest('${q.id}')"
                        class="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-black text-[10.5px] shadow-md border-b-2 border-emerald-800 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse">
                        <span>🎁 Trả Hàng Cho Thương Gia (+${q.rewardGold.toLocaleString('vi-VN')}💰 Vàng)</span>
                    </button>
                `;
            } else {
                actionBtnHtml = `
                    <button type="button" onclick="game.claimMerchantQuest('${q.id}')"
                        class="w-full py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-black text-[10px] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>⚠️ Chưa Đủ Nông Sản (Bấm xem thiếu gì)</span>
                    </button>
                `;
            }

            return `
                <div class="bg-white/95 rounded-2xl p-2.5 border-2 ${
                    isClaimed
                        ? 'border-slate-300 bg-slate-50/70 opacity-80'
                        : (isLockedVip
                            ? 'border-amber-300 bg-amber-50/40'
                            : (allEnough ? 'border-emerald-500 ring-2 ring-emerald-300/80 shadow-sm' : 'border-amber-200'))
                } flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-md border ${q.tierBadgeClass}">${q.tierLabel}</span>
                            <span class="font-black text-[11px] text-amber-950">${q.title}</span>
                            ${q.isVipOnly ? '<span class="text-[9px] bg-purple-600 text-white font-black px-1.5 py-0.2 rounded-full shadow-xs">👑 VIP</span>' : '<span class="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full">Miễn Phí</span>'}
                        </div>
                        <div class="text-xs font-black text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-300 flex items-center gap-0.5">
                            <span>+${q.rewardGold.toLocaleString('vi-VN')}💰</span>
                            <span class="text-[9px] font-bold text-slate-600">Vàng</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-5 gap-1">
                        ${itemsHtml}
                    </div>
                    ${actionBtnHtml}
                </div>
            `;
        }).join('');

        const merchantBanner = `
            <div class="p-2.5 rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-amber-100/90 via-yellow-50 to-orange-50 flex flex-col gap-2 shadow-sm mb-2">
                <div class="flex items-center justify-between border-b border-amber-300/80 pb-1.5">
                    <div class="flex items-center gap-1.5">
                        <span class="text-2xl">👳‍♂️</span>
                        <div>
                            <div class="font-black text-amber-950 text-xs flex items-center gap-1">
                                <span>Thương Gia</span>
                                <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-200 text-amber-900 border border-amber-300">3 Đơn Nông Sản/Ngày</span>
                            </div>
                            <div class="text-[9px] text-amber-800 font-medium">Thu mua nông sản đổi lấy Vàng • Mua VIP mở thêm 2 đơn</div>
                        </div>
                    </div>
                    <span class="text-[9px] font-black px-2 py-0.5 rounded-full ${
                        isVip ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-600' : 'bg-slate-200 text-slate-700'
                    }">
                        ${isVip ? '👑 VIP: Mở 3/3 Đơn' : 'Thường: Mở 1/3 Đơn'}
                    </span>
                </div>
                <div class="flex flex-col gap-2">
                    ${merchantCards}
                </div>
            </div>
        `;

        // 2. BẢNG NHIỆM VỤ TÀI NGUYÊN "ĐỒNG NÁT" (MỖI NGÀY 1 NHIỆM VỤ TỰ ĐỘNG XOAY VÒNG)
        const { quest: scrapQuest, questIndex: scrapIndex } = this.getTodayScrapQuest();
        const isScrapClaimed = this.isScrapQuestClaimedToday();
        const scrapHave = Number(this.data.inventory?.[scrapQuest.resourceId] || 0);
        const scrapEnough = scrapHave >= scrapQuest.qty;

        if (!isScrapClaimed && scrapEnough) {
            hasClaimable = true;
        }

        // Lộ trình 4 nhiệm vụ tự động xoay vòng
        const rotationChipsHtml = SCRAP_QUESTS_META.map((sq, idx) => {
            const isToday = idx === scrapIndex;
            return `
                <div class="flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold ${
                    isToday
                        ? 'bg-amber-200/95 border-amber-600 text-amber-950 font-black ring-1 ring-amber-500 shadow-xs'
                        : 'bg-white/70 border-slate-200 text-slate-600 opacity-80'
                }">
                    <span>${sq.resourceIcon}</span>
                    <span>${sq.qty} ${sq.resourceName}</span>
                    <span class="text-amber-800 font-extrabold">➜ +${sq.rewardGold.toLocaleString('vi-VN')}💰</span>
                    ${isToday ? '<span class="ml-auto text-[8px] bg-amber-600 text-white px-1 py-0.2 rounded font-black">HÔM NAY</span>' : ''}
                </div>
            `;
        }).join('');

        let scrapActionBtnHtml = '';
        if (isScrapClaimed) {
            scrapActionBtnHtml = `
                <button type="button" disabled
                    class="w-full py-2 rounded-xl bg-slate-200 text-slate-500 font-black text-[10px] cursor-not-allowed flex items-center justify-center gap-1">
                    <span>✓ Đã Trả Nhiệm Vụ Hôm Nay (+${scrapQuest.rewardGold.toLocaleString('vi-VN')}💰 Vàng) • Đón chờ đơn xoay vòng ngày mai!</span>
                </button>
            `;
        } else if (scrapEnough) {
            scrapActionBtnHtml = `
                <button type="button" onclick="game.claimScrapQuest()"
                    class="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 hover:brightness-110 active:scale-95 text-white font-black text-[10.5px] shadow-md border-b-2 border-amber-900 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse">
                    <span>🧺 Trả ${scrapQuest.qty}x ${scrapQuest.resourceName} Cho Đồng Nát (+${scrapQuest.rewardGold.toLocaleString('vi-VN')}💰 Vàng)</span>
                </button>
            `;
        } else {
            const missing = scrapQuest.qty - scrapHave;
            scrapActionBtnHtml = `
                <button type="button" onclick="game.claimScrapQuest()"
                    class="w-full py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-black text-[10px] active:scale-95 flex items-center justify-center gap-1 cursor-pointer">
                    <span>⚠️ Chưa Đủ ${scrapQuest.resourceName} (Còn thiếu ${missing}x ${scrapQuest.resourceName} • Bấm xem)</span>
                </button>
            `;
        }

        const scrapBanner = `
            <div class="p-2.5 rounded-2xl border-2 border-orange-400 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col gap-2 shadow-sm mb-2">
                <div class="flex items-center justify-between border-b border-orange-200/80 pb-1.5">
                    <div class="flex items-center gap-1.5">
                        <span class="text-2xl">🧺</span>
                        <div>
                            <div class="font-black text-amber-950 text-xs flex items-center gap-1">
                                <span>Đồng Nát</span>
                                <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-orange-200 text-orange-950 border border-orange-300">1 Lượt / Ngày • Tự Xoay Vòng</span>
                            </div>
                            <div class="text-[9px] text-orange-900 font-medium">Thu mua tài nguyên Đảo đổi lấy Vàng • Tự động đổi nhiệm vụ mỗi ngày</div>
                        </div>
                    </div>
                    <span class="text-[9px] font-black px-2 py-0.5 rounded-full ${
                        isScrapClaimed ? 'bg-slate-200 text-slate-700' : (scrapEnough ? 'bg-emerald-600 text-white animate-bounce' : 'bg-orange-200 text-orange-900 border border-orange-300')
                    }">
                        ${isScrapClaimed ? '✓ Đã Trả' : (scrapEnough ? 'Đủ Tài Nguyên!' : 'Đang Chờ')}
                    </span>
                </div>

                <!-- Đơn hàng hôm nay -->
                <div class="bg-white/95 rounded-2xl p-2.5 border-2 ${
                    isScrapClaimed
                        ? 'border-slate-300 bg-slate-50/70 opacity-80'
                        : (scrapEnough ? 'border-amber-500 ring-2 ring-amber-300/80 shadow-sm' : 'border-orange-200')
                } flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-md border bg-amber-100 text-amber-900 border-amber-300">Hôm Nay</span>
                            <span class="font-black text-[11px] text-amber-950">${scrapQuest.title}</span>
                        </div>
                        <div class="text-xs font-black text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-300 flex items-center gap-0.5">
                            <span>+${scrapQuest.rewardGold.toLocaleString('vi-VN')}💰</span>
                            <span class="text-[9px] font-bold text-slate-600">Vàng</span>
                        </div>
                    </div>

                    <!-- Yêu cầu tài nguyên -->
                    <div class="flex items-center justify-between p-2 rounded-xl border ${scrapEnough ? 'bg-emerald-50/90 border-emerald-300' : 'bg-orange-50/80 border-orange-200'}">
                        <div class="flex items-center gap-2">
                            <span class="text-2xl">${scrapQuest.resourceIcon}</span>
                            <div>
                                <div class="font-black text-xs text-slate-800">${scrapQuest.resourceName}</div>
                                <div class="text-[9.5px] text-slate-500">${scrapQuest.desc}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs font-black ${scrapEnough ? 'text-emerald-700' : 'text-rose-600'}">
                                ${scrapHave}/${scrapQuest.qty} ${scrapEnough ? '✓ Đủ' : '✕ Thiếu'}
                            </div>
                            <div class="text-[9px] text-slate-500 font-bold">Cần ${scrapQuest.qty}</div>
                        </div>
                    </div>

                    ${scrapActionBtnHtml}
                </div>

                <!-- Lộ trình 4 nhiệm vụ xoay vòng -->
                <div class="mt-0.5">
                    <div class="text-[9.5px] font-black text-orange-950 mb-1 flex items-center justify-between">
                        <span>🔄 4 Nhiệm Vụ Tự Động Xoay Vòng:</span>
                        <span class="text-[8.5px] font-normal text-slate-500">(Mỗi ngày 1 nhiệm vụ)</span>
                    </div>
                    <div class="grid grid-cols-2 gap-1">
                        ${rotationChipsHtml}
                    </div>
                </div>
            </div>
        `;

        // 3. BẢNG GIAO CÁ ĐẶC BIỆT CHO "LONG NỮ"
        const fishList = ['fish_ro', 'fish_chep', 'fish_hoi'];
        const longNuRows = fishList.map(fId => {
            const info = this.getLongNuQuestInfo(fId);
            const haveFish = this.data.inventory?.[fId] || 0;
            const canDeliver = haveFish > 0;
            if (canDeliver) hasClaimable = true;
            return `
                <div class="bg-white/95 rounded-xl p-2 border border-sky-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${info.fishIcon}</span>
                        <div>
                            <div class="font-black text-[11px] text-sky-950 flex items-center gap-1">
                                <span>${info.fishName}</span>
                                <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold ${haveFish > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">Có: ${haveFish} con</span>
                            </div>
                            <div class="text-[9.5px] text-slate-600">
                                <b class="text-amber-700 font-black">+${info.rewardGold.toLocaleString('vi-VN')}💰 Vàng</b>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 justify-end">
                        <button type="button" onclick="game.deliverFishToLongNu('${fId}', 1)"
                            class="px-2.5 py-1 rounded-lg text-[10px] font-black ${canDeliver ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 text-white shadow active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}"
                            ${canDeliver ? '' : 'disabled'}>
                            ${canDeliver ? `Giao 1 con (+${info.rewardGold.toLocaleString()}💰)` : 'Chưa có cá'}
                        </button>
                        ${haveFish > 1 ? `
                            <button type="button" onclick="game.deliverFishToLongNu('${fId}', 'all')"
                                class="px-2 py-1 rounded-lg text-[9.5px] font-black bg-sky-600 hover:bg-sky-500 text-white shadow active:scale-95" title="Giao hết ${haveFish} con">
                                Giao Hết (${(info.rewardGold * haveFish).toLocaleString()}💰)
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const longNuBanner = `
            <div class="p-2.5 rounded-2xl border-2 border-sky-400 bg-gradient-to-br from-sky-100/90 via-cyan-50 to-teal-50 flex flex-col gap-2 shadow-xs mb-1">
                <div class="flex items-center justify-between border-b border-sky-200/80 pb-1">
                    <div class="flex items-center gap-1.5">
                        <span class="text-2xl">🧜‍♀️</span>
                        <div>
                            <div class="font-black text-sky-950 text-xs flex items-center gap-1">
                                <span>Long Nữ</span>
                                <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-sky-200 text-sky-900 border border-sky-300">Đổi Cá Nhận Vàng</span>
                            </div>
                            <div class="text-[9px] text-sky-800 font-medium">Giao cá câu được từ Hồ Sunflower đổi lấy Vàng</div>
                        </div>
                    </div>
                    <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 border border-sky-300">Đổi Nhận Vàng</span>
                </div>
                <div class="flex flex-col gap-1.5">${longNuRows}</div>
            </div>
        `;

        if (listEl) listEl.innerHTML = merchantBanner + scrapBanner + longNuBanner;
        if (dotEl) {
            if (hasClaimable) dotEl.classList.remove('hidden');
            else dotEl.classList.add('hidden');
        }
    }

    getTodayScrapQuest() {
        const todayKey = this.getTodayDateKey();
        const parts = todayKey.split('-').map(Number);
        const dayNumber = Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
        const questIndex = Math.abs(dayNumber) % SCRAP_QUESTS_META.length;
        const quest = SCRAP_QUESTS_META[questIndex];
        return { quest, questIndex, todayKey };
    }

    isScrapQuestClaimedToday() {
        const todayKey = this.getTodayDateKey();
        return !!(this.data.scrapQuest && this.data.scrapQuest.date === todayKey && this.data.scrapQuest.claimed);
    }

    claimScrapQuest() {
        const { quest, todayKey } = this.getTodayScrapQuest();
        if (!this.data.scrapQuest || this.data.scrapQuest.date !== todayKey) {
            this.data.scrapQuest = { date: todayKey, claimed: false };
        }

        if (this.data.scrapQuest.claimed) {
            window.adsgramManager.showToast('Bạn đã trả nhiệm vụ Đồng Nát hôm nay rồi! Mỗi ngày chỉ được trả 1 nhiệm vụ xoay vòng, hãy quay lại vào ngày mai nhé.', 'info');
            return;
        }

        if (!this.data.inventory) this.data.inventory = {};
        const have = Number(this.data.inventory[quest.resourceId] || 0);
        if (have < quest.qty) {
            const missing = quest.qty - have;
            window.adsgramManager.showToast(`Chưa đủ tài nguyên! Đồng Nát cần ${quest.qty}x ${quest.resourceName} (Hiện có: ${have}, còn thiếu: ${missing}). Hãy đi khai thác trên đảo nhé!`, 'warning');
            return;
        }

        // Trừ tài nguyên
        this.data.inventory[quest.resourceId] = have - quest.qty;
        if (this.data.inventory[quest.resourceId] <= 0) {
            delete this.data.inventory[quest.resourceId];
        }

        // Nhận Vàng
        this.data.gold = Math.round(((Number(this.data.gold) || 0) + quest.rewardGold) * 10) / 10;
        this.data.scrapQuest.claimed = true;

        if (window.sound && typeof window.sound.playFanfare === 'function') {
            window.sound.playFanfare();
        } else if (window.sound && typeof window.sound.playCoin === 'function') {
            window.sound.playCoin();
        }
        window.adsgramManager.showToast(`🧺 Đồng Nát: Đã thu gom ${quest.qty}x ${quest.resourceIcon} ${quest.resourceName}! Bạn nhận được +${quest.rewardGold.toLocaleString('vi-VN')}💰 Vàng!`, 'success');
        if (typeof this.spawnFloatingText === 'function') {
            this.spawnFloatingText(`+${quest.rewardGold}💰`);
        }

        this.save();
        this.renderAll();
        this.renderQuestsUI();
    }

    claimMerchantQuest(questId) {
        if (!this.data.dailyQuests || this.data.dailyQuests.date !== this.getTodayDateKey()) {
            this.data.dailyQuests = this.createFreshDailyQuests();
        }
        if (!this.data.dailyQuests.claimed) this.data.dailyQuests.claimed = {};

        const quest = MERCHANT_QUESTS_META.find(q => q.id === questId);
        if (!quest) return;

        if (this.data.dailyQuests.claimed[questId]) {
            window.adsgramManager.showToast('Bạn đã trả đơn hàng này cho Thương Gia hôm nay rồi! Hãy quay lại vào ngày mai nhé.', 'info');
            return;
        }

        const isVip = this.hasVipPass();
        if (quest.isVipOnly && !isVip) {
            window.adsgramManager.showToast(`Nhiệm vụ này là đặc quyền VIP! Hãy nâng cấp VIP để trả đơn hàng nhận ${quest.rewardGold.toLocaleString('vi-VN')} Vàng.`, 'warning');
            this.openVipModal();
            return;
        }

        // Kiểm tra 5 loại nông sản
        const missing = [];
        quest.requirements.forEach(r => {
            const have = this.data.inventory?.[r.id] || 0;
            if (have < r.qty) {
                const cropMeta = SEED_TYPES[r.id] || { name: r.id, icon: '🌾' };
                missing.push(`${r.qty - have}x ${cropMeta.icon} ${cropMeta.name}`);
            }
        });

        if (missing.length > 0) {
            window.adsgramManager.showToast(`Thương Gia kiểm tra còn thiếu: ${missing.join(', ')}! Hãy gieo trồng thêm hoặc mua tại Chợ P2P nhé.`, 'warning');
            return;
        }

        // Trừ 5 quả mỗi loại trong kho
        quest.requirements.forEach(r => {
            this.data.inventory[r.id] -= r.qty;
            if (this.data.inventory[r.id] <= 0) delete this.data.inventory[r.id];
        });

        // Nhận Vàng
        this.data.gold = (this.data.gold || 0) + quest.rewardGold;
        this.data.dailyQuests.claimed[questId] = true;

        window.sound.playFanfare();
        window.adsgramManager.showToast(`👳‍♂️ Thương Gia: Đã nhận đủ 5 loại nông sản! Bạn nhận được +${quest.rewardGold.toLocaleString('vi-VN')}💰 Vàng!`, 'success');
        this.spawnFloatingText(`+${quest.rewardGold}💰`);

        this.save();
        this.renderAll();
    }

    claimQuest(questId) {
        if (questId && questId.startsWith('q_merchant_')) {
            return this.claimMerchantQuest(questId);
        }
        if (!this.data.dailyQuests || this.data.dailyQuests.date !== this.getTodayDateKey()) {
            this.data.dailyQuests = this.createFreshDailyQuests();
        }
        const meta = DAILY_QUESTS_META.find(q => q.id === questId);
        if (!meta) return;

        if (this.data.dailyQuests.claimed[questId]) {
            window.adsgramManager.showToast("Bạn đã trả nhiệm vụ này hôm nay rồi!", "info");
            return;
        }

        const allMeta = this.getAllItemsMeta();
        const missing = [];
        meta.requirements.forEach(r => {
            const have = this.data.inventory[r.id] || 0;
            if (have < r.qty) {
                const itemMeta = allMeta[r.id] || { name: r.id };
                missing.push(`${r.qty - have} ${itemMeta.name}`);
            }
        });

        if (missing.length > 0) {
            window.adsgramManager.showToast(`Còn thiếu: ${missing.join(', ')}! Hãy thu hoạch, câu cá hoặc mua trên Chợ P2P!`, "warning");
            return;
        }

        // Trừ tài nguyên trong kho và CHỈ cộng Vàng
        meta.requirements.forEach(r => {
            this.data.inventory[r.id] -= r.qty;
            if (this.data.inventory[r.id] <= 0) {
                delete this.data.inventory[r.id];
            }
        });

        const effectiveReward = (meta.isLongNu || meta.id.startsWith('q_long_nu_'))
            ? this.getLongNuFishReward(meta.fishId || meta.requirements[0].id)
            : meta.rewardGold;

        this.data.dailyQuests.claimed[questId] = true;
        this.data.gold += effectiveReward;

        window.sound.playFanfare();
        window.adsgramManager.showToast(`🎁 Trả nhiệm vụ "${meta.title}" thành công! Nhận +${effectiveReward.toLocaleString()}💰 Vàng!`, "success");
        this.save();
        this.renderAll();
    }

    spawnFloatingText(text) {
        const el = document.createElement('div');
        el.className = 'floating-reward-pop text-amber-300';
        el.style.left = `${42 + Math.random() * 16}%`;
        el.style.top = '45%';
        el.innerText = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1100);
    }

    // ==========================================
    // RÚT TIỀN VND TỈ LỆ 1:1 (NGÂN HÀNG / MOMO / ZALOPAY)
    // ==========================================
    requestWithdraw() {
        const method = this.withdrawMethod || 'bank';
        let destination = '';

        if (method === 'bank') {
            const bankSelect = document.getElementById('withdraw-bank-select');
            const bankName = bankSelect ? bankSelect.options[bankSelect.selectedIndex].text : 'Ngân Hàng';
            const stk = (document.getElementById('withdraw-account-input')?.value || '').replace(/\s+/g, '').trim();
            const recipientName = (document.getElementById('withdraw-account-name')?.value || '').trim().toUpperCase();

            if (!stk || stk.length < 5) {
                window.adsgramManager.showToast("Vui lòng nhập Số Tài Khoản Ngân Hàng (STK) chính xác!", "warning");
                return;
            }
            if (!recipientName) {
                window.adsgramManager.showToast("Vui lòng nhập Tên Chủ Tài Khoản!", "warning");
                return;
            }
            destination = `${bankName} • STK: ${stk} • ${recipientName}`;
        } else {
            const isMomo = method === 'momo';
            const walletTitle = isMomo ? 'MoMo' : 'ZaloPay';
            const phone = (document.getElementById('withdraw-wallet-phone')?.value || document.getElementById('withdraw-account-input')?.value || '').replace(/\s+/g, '').trim();
            const recipientName = (document.getElementById('withdraw-wallet-name')?.value || '').trim().toUpperCase();

            if (!phone || phone.length < 9) {
                window.adsgramManager.showToast(`Vui lòng nhập Số Điện Thoại Ví ${walletTitle} hợp lệ!`, "warning");
                return;
            }
            if (!recipientName) {
                window.adsgramManager.showToast(`Vui lòng nhập Tên Chủ Ví ${walletTitle}!`, "warning");
                return;
            }
            destination = `Ví ${walletTitle} • SĐT: ${phone} • ${recipientName}`;
        }

        // Xác định số tiền rút VND (Tỉ lệ 1:1)
        const customInput = document.getElementById('withdraw-custom-vnd');
        const customVal = customInput ? parseInt(customInput.value) : 0;
        let reqVnd = 20000;
        if (customVal && customVal > 0) {
            reqVnd = customVal;
        } else {
            const selectedBtn = document.querySelector('.withdraw-amount-btn.bg-emerald-100') || document.querySelector('.withdraw-amount-btn');
            reqVnd = parseInt(selectedBtn?.getAttribute('data-vnd') || selectedBtn?.getAttribute('data-diamonds') || 20000);
        }

        if (reqVnd < 5000) {
            window.adsgramManager.showToast("Số tiền rút tối thiểu là 5.000đ VND!", "warning");
            return;
        }

        const currentVnd = Number(this.data.vnd || 0);
        if (currentVnd < reqVnd) {
            window.adsgramManager.showToast(`Bạn không đủ số dư VND! Hiện có: ${currentVnd.toLocaleString('vi-VN')} VND, cần ${reqVnd.toLocaleString('vi-VN')} VND để rút mốc này.`, "error");
            return;
        }

        // Trừ số dư VND theo tỉ lệ 1:1
        this.data.vnd = Math.max(0, currentVnd - reqVnd);

        // Lưu lịch sử rút tiền
        if (!this.data.withdrawHistory) this.data.withdrawHistory = [];
        this.data.withdrawHistory.unshift({
            id: Date.now(),
            method,
            destination,
            amountVnd: reqVnd,
            rate: '1:1',
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        // Gửi lệnh rút lên server
        fetch('/api/withdraw/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: this.getPlayerId(),
                playerName: this.playerName,
                method,
                destination,
                amountVnd: reqVnd
            })
        }).catch(() => {});

        window.sound.playFanfare();
        window.adsgramManager.showToast(`🎉 Gửi yêu cầu rút ${reqVnd.toLocaleString('vi-VN')}đ VND (1:1) thành công! Hệ thống sẽ chuyển về ${destination} trong 24h.`, "success");
        this.save();
        this.renderAll();
    }

    // ==========================================
    // GAME TICK & EVENT LISTENERS
    // ==========================================
    updateTick() {
        // Cập nhật đếm ngược Vé VIP / Cần Thượng Cổ hoặc thời gian chờ quảng cáo nhận Vàng (2h)
        const adGoldRem = this.getAdGoldCooldownRemaining();
        if (this.isVipTicketActive() || this.isVipRodActive() || adGoldRem > 0 || this._hadAdGoldCooldown) {
            this._hadAdGoldCooldown = adGoldRem > 0;
            this.updateHeaderUI();
        }

        // Cập nhật chuồng gà đẻ trứng & tiêu thụ thóc
        this.tickChickenCoop();

        // Tự động cập nhật luống đất 4D, tab Tài Nguyên & chuồng gà
        if (!document.getElementById('view-farm').classList.contains('hidden')) {
            this.renderPlots();
        }
        if (!document.getElementById('view-resources').classList.contains('hidden')) {
            this.renderIslandResourceNodes();
        }
        if (!document.getElementById('view-chickens').classList.contains('hidden')) {
            this.renderChickenUI();
        }
        const spinView = document.getElementById('view-spin');
        if (spinView && !spinView.classList.contains('hidden')) {
            this.renderBakeryUI();
        }
    }

    tickChickenCoop() {
        if (!this.data.chickens || this.data.chickens.length === 0) return;

        // Đảm bảo tất cả gà đều có mốc chu kỳ tự động sống 24h
        this.data.chickens.forEach(chicken => {
            this.getChickenReadyAt(chicken);
        });

        // Phượng hoàng mượn (nếu có)
        if (this.isPhoenixActive()) {
            this.phoenixTimer = (this.phoenixTimer || 0) + 1;
            if (this.phoenixTimer >= 60) {
                this.phoenixTimer = 0;
                this.spawnEggOnGround('egg_diamond', 0);
            }
        } else {
            if (this.chickenVisuals.some(v => v.id === 'temp_phoenix')) {
                this.syncChickenVisuals();
            }
        }
    }

    spawnEggOnGround(eggType, chickenIdx) {
        if (this.data.eggsOnGround.length >= 16) return;

        const vis = this.chickenVisuals[chickenIdx];
        const x = vis ? Math.max(0.12, Math.min(0.88, vis.x)) : (0.2 + Math.random() * 0.6);
        const y = vis ? Math.max(0.45, Math.min(0.88, vis.y + 0.04)) : (0.5 + Math.random() * 0.35);

        // Nếu đang Boost Cám Tăng Trọng -> 25% cơ hội nâng cấp lên Trứng Vàng!
        let finalType = eggType;
        if (this.isChickenBoostActive() && Math.random() < 0.25 && eggType !== 'egg_diamond') {
            finalType = 'egg_gold';
        }

        this.data.eggsOnGround.push({ type: finalType, x, y });
        this.save();
    }

    // ==========================================
    // VIP ACCESS CENTER (MUA VIP KIM CƯƠNG / QUÀ NGÀY / TIẾT KIỆM)
    // ==========================================
    async syncVipStatusFromServer() {
        try {
            const res = await fetch(`/api/vip/status?playerId=${encodeURIComponent(this.getPlayerId())}`);
            const data = await res.json();
            if (!res.ok || !data.ok) return;
            this.data.vipAccessUntil = data.isVip ? Number(data.vipUntil || 0) : 0;
            this.data.vipPlanId = data.planId || null;
            this.save();
            this.renderAll();
        } catch (err) {
            console.warn('VIP status sync failed:', err);
        }
    }

    openVipCenterModal(tab = null) {
        window.sound.playClick();
        const targetTab = tab || (this.canClaimVipDailyGift() ? 'daily' : 'buy');
        this.switchVipTab(targetTab);
        document.getElementById('modal-vip-center').classList.remove('hidden');
    }

    openVipTicketModal() {
        this.openVipCenterModal('buy');
    }

    switchVipTab(tab) {
        this.vipCenterTab = tab === 'daily' ? 'daily' : 'buy';
        document.querySelectorAll('.vip-center-tab').forEach(btn => {
            const active = btn.getAttribute('data-vip-tab') === this.vipCenterTab;
            btn.classList.toggle('bg-[#efd3a3]', active);
            btn.classList.toggle('text-[#4a260a]', active);
            btn.classList.toggle('bg-[#b3743b]', !active);
            btn.classList.toggle('text-amber-100', !active);
        });
        document.getElementById('vip-tab-buy').classList.toggle('hidden', this.vipCenterTab !== 'buy');
        document.getElementById('vip-tab-daily').classList.toggle('hidden', this.vipCenterTab !== 'daily');
        this.renderVipCenter();
    }

    selectVipPlan(planId) {
        if (!VIP_ACCESS_PLANS[planId]) return;
        this.selectedVipPlanId = planId;
        window.sound.playClick();
        this.renderVipCenter();
    }

    renderVipCenter() {
        const isVip = this.hasVipPass();
        const badgeEl = document.getElementById('vip-modal-status-badge');
        if (badgeEl) {
            if (isVip) {
                const daysLeft = Math.max(1, Math.ceil((this.data.vipAccessUntil - Date.now()) / 86400000));
                badgeEl.innerText = `👑 VIP (Còn ${daysLeft} ngày)`;
                badgeEl.className = 'px-2 py-0.5 rounded-lg bg-emerald-700 text-amber-200 font-black text-[9.5px]';
            } else {
                badgeEl.innerText = 'Chưa VIP (Phí 20%)';
                badgeEl.className = 'px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 font-black text-[9.5px]';
            }
        }

        const ownedEl = document.getElementById('vip-owned-diamonds');
        if (ownedEl) ownedEl.innerText = (this.data.diamonds || 0).toLocaleString('vi-VN');

        document.querySelectorAll('.vip-plan-card').forEach(card => {
            const pid = card.getAttribute('data-vip-plan');
            const selected = pid === this.selectedVipPlanId;
            card.classList.toggle('ring-2', selected);
            card.classList.toggle('ring-amber-500', selected);
            card.classList.toggle('scale-[1.03]', selected);
            card.classList.toggle('bg-[#fff1d4]', selected);
        });

        const plan = VIP_ACCESS_PLANS[this.selectedVipPlanId] || VIP_ACCESS_PLANS.vip_1m;
        const btnBuy = document.getElementById('btn-confirm-buy-vip');
        if (btnBuy) {
            const enough = (this.data.diamonds || 0) >= plan.diamonds;
            btnBuy.innerText = `👑 ${isVip ? 'Gia Hạn' : 'Kích Hoạt'} ${plan.label} — ${plan.diamonds.toLocaleString()} 💎${enough ? '' : ' (Thiếu 💎)'}`;
        }

        // Render Tab 2: 7-Day Daily Rewards
        const streak = Number(this.data.vipDailyStreak || 0);
        const claimedToday = isVip && this.data.vipLastGiftDate === this.getTodayDateKey();
        const activeDayIndex = claimedToday
            ? Math.max(0, Math.min(6, streak - 1))
            : (streak >= 7 ? 0 : Math.max(0, streak));
        const completedCount = claimedToday ? Math.min(7, streak) : (streak >= 7 ? 0 : streak);

        const streakBadge = document.getElementById('vip-daily-streak-badge');
        if (streakBadge) streakBadge.innerText = `Chuỗi: ${completedCount}/7 ngày`;

        const subEl = document.getElementById('vip-daily-subtitle');
        if (subEl) {
            if (!isVip) {
                subEl.innerText = 'Kích hoạt VIP Access để mở khóa chuỗi nhận Vàng miễn phí mỗi ngày!';
            } else if (completedCount >= 7) {
                subEl.innerText = '🎉 Đã hoàn thành chu kỳ 7 ngày nhận Vàng! Chu kỳ mới (+5 Vàng) bắt đầu vào ngày mai.';
            } else {
                const remain = Math.max(1, 7 - completedCount);
                subEl.innerText = `Nhận Vàng thêm ${remain} ngày để đạt mốc Ngày 7 (+35 Vàng)!`;
            }
        }

        const trackEl = document.getElementById('vip-daily-track');
        if (trackEl) {
            trackEl.innerHTML = VIP_DAILY_REWARDS.map((r, idx) => {
                const isDone = idx < completedCount;
                const isCurrent = !claimedToday && idx === activeDayIndex && isVip;
                const spanClass = r.day === 7 ? 'col-span-2' : '';
                return `
                    <div class="${spanClass} rounded-xl border-2 p-1.5 flex flex-col items-center justify-between text-center ${
                        isCurrent
                            ? 'bg-[#fff3d6] border-amber-600 ring-2 ring-amber-400'
                            : (isDone ? 'bg-[#c5e0b4] border-emerald-700 opacity-90' : 'bg-[#c68d53] border-[#6b3a14]')
                    }">
                        <span class="px-1.5 py-0.5 rounded text-[8.5px] font-black ${
                            isCurrent ? 'bg-sky-600 text-white' : (isDone ? 'bg-emerald-700 text-white' : 'bg-[#efd3a3] text-[#4a260a]')
                        }">${r.title}</span>
                        <div class="text-xl my-0.5">${isDone ? '✅' : r.icon}</div>
                        <div class="text-[8px] font-black leading-tight">${r.label}</div>
                        <div class="text-[8px] font-bold text-[#5c3010] mt-0.5">👑 Quà VIP</div>
                    </div>
                `;
            }).join('');
        }

        const progBar = document.getElementById('vip-daily-progress-bar');
        if (progBar) progBar.style.width = `${Math.max(10, Math.round((completedCount / 7) * 100))}%`;

        const btnClaim = document.getElementById('btn-claim-vip-daily');
        if (btnClaim) {
            if (!isVip) {
                btnClaim.innerText = '🔒 Cần Kích Hoạt VIP Để Nhận Quà Ngày';
                btnClaim.className = 'w-full py-2.5 rounded-xl bg-amber-300 border-2 border-[#5c3010] text-[#4a260a] font-black text-xs shadow active:scale-95';
            } else if (claimedToday) {
                btnClaim.innerText = '✅ Đã Nhận Hôm Nay — Quay Lại Ngày Mai';
                btnClaim.className = 'w-full py-2.5 rounded-xl bg-emerald-200 border-2 border-emerald-700 text-emerald-950 font-black text-xs opacity-80';
            } else {
                const todayGift = VIP_DAILY_REWARDS[activeDayIndex] || VIP_DAILY_REWARDS[0];
                btnClaim.innerText = `🎁 Nhận ${todayGift.title}: ${todayGift.label}`;
                btnClaim.className = 'w-full py-2.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 border-2 border-[#5c3010] text-[#4a260a] font-black text-xs shadow active:scale-95';
            }
        }
    }

    async buyVipPass(planId = this.selectedVipPlanId) {
        const plan = VIP_ACCESS_PLANS[planId];
        if (!plan || this.isVipPurchaseBusy) return;

        const owned = Number(this.data.diamonds || 0);
        if (owned < plan.diamonds) {
            window.adsgramManager.showToast(
                `Bạn cần ${plan.diamonds.toLocaleString()} 💎 Kim Cương để mua VIP ${plan.label} (Hiện có ${owned.toLocaleString()} 💎). Hãy nạp thêm hoặc mở Kho Báu!`,
                'warning'
            );
            return;
        }

        this.isVipPurchaseBusy = true;
        try {
            const res = await fetch('/api/vip/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.getPlayerId(),
                    playerName: this.playerName,
                    planId: plan.id
                })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                window.adsgramManager.showToast(data.error || 'Không thể kích hoạt VIP!', 'error');
                return;
            }

            this.data.diamonds = owned - plan.diamonds;
            this.data.vipAccessUntil = Number(data.vipUntil);
            this.data.vipPlanId = plan.id;
            if (!this.data.vipStats) this.data.vipStats = this.createDefaultData().vipStats;

            this.save();
            window.sound.playFanfare();
            window.adsgramManager.showToast(
                `👑 CHÚC MỪNG! Kích hoạt VIP ${plan.label} thành công — Phí Chợ P2P giảm còn 12,5% & mở nhận Vàng mỗi ngày!`,
                'success'
            );
            this.renderAll();
            this.refreshP2PMarket(false);
        } catch (err) {
            window.adsgramManager.showToast('Lỗi kết nối máy chủ VIP!', 'error');
        } finally {
            this.isVipPurchaseBusy = false;
        }
    }

    claimVipDailyGift() {
        if (!this.hasVipPass()) {
            window.adsgramManager.showToast('Hãy kích hoạt VIP Access trước để nhận Quà Hàng Ngày!', 'warning');
            this.switchVipTab('buy');
            return;
        }
        if (!this.canClaimVipDailyGift()) {
            window.adsgramManager.showToast('Bạn đã nhận Quà VIP hôm nay rồi! Quay lại ngày mai nhé.', 'info');
            return;
        }

        const prevStreak = Number(this.data.vipDailyStreak || 0);
        const dayIdx = prevStreak >= 7 ? 0 : Math.max(0, prevStreak);
        const gift = VIP_DAILY_REWARDS[dayIdx] || VIP_DAILY_REWARDS[0];
        const goldGain = Number(gift.gold || 0);

        if (goldGain > 0) this.data.gold = (this.data.gold || 0) + goldGain;

        this.data.vipDailyStreak = dayIdx + 1;
        this.data.vipLastGiftDate = this.getTodayDateKey();
        if (!this.data.vipStats) this.data.vipStats = this.createDefaultData().vipStats;
        this.data.vipStats.dailyGiftsClaimed = (this.data.vipStats.dailyGiftsClaimed || 0) + 1;
        this.data.vipStats.dailyGoldClaimed = (this.data.vipStats.dailyGoldClaimed || 0) + goldGain;

        window.sound.playFanfare();
        window.adsgramManager.showToast(`💰 Nhận Vàng VIP ${gift.title}: +${goldGain.toLocaleString('vi-VN')} Vàng!`, 'success');
        this.save();
        this.renderAll();
    }

    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetViewId = tab.getAttribute('data-target');
                this.switchMainView(targetViewId);
                window.sound.playClick();
                this.renderAll();
            });
        });

        // Bật/tắt âm thanh
        const btnSound = document.getElementById('btn-sound');
        btnSound.addEventListener('click', () => {
            const enabled = window.sound.toggle();
            btnSound.innerText = enabled ? '🔊' : '🔇';
            window.adsgramManager.showToast(enabled ? "Đã bật âm thanh" : "Đã tắt âm thanh", "info");
        });

        document.querySelectorAll('.land-tier-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tier = parseInt(tab.getAttribute('data-tier'), 10);
                if (tier) this.setLandTier(tier);
            });
        });

        const btnChooseSeed = document.getElementById('btn-choose-seed');
        if (btnChooseSeed) btnChooseSeed.addEventListener('click', () => this.openSeedSelectModal());

        const btnCloseSelectSeed = document.getElementById('btn-close-select-seed');
        if (btnCloseSelectSeed) {
            btnCloseSelectSeed.addEventListener('click', () => {
                const modal = document.getElementById('modal-select-seed');
                if (modal) modal.classList.add('hidden');
            });
        }

        const btnWaterAll = document.getElementById('btn-water-all');
        if (btnWaterAll) btnWaterAll.addEventListener('click', () => this.waterAllPlotsWith2Ads());

        const btnPlantAll = document.getElementById('btn-plant-all');
        if (btnPlantAll) btnPlantAll.addEventListener('click', () => this.plantAllEmptyPlots());

        const btnHarvestAll = document.getElementById('btn-harvest-all');
        if (btnHarvestAll) btnHarvestAll.addEventListener('click', () => this.harvestAllReadyPlots());

        document.querySelectorAll('.seed-select-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.getAttribute('data-filter') || 'all';
                this.renderSeedSelectList(filter);
            });
        });

        // Modal mở ô đất / nâng cấp cấp đất (Phú Nông)
        const modalUnlockPlot = document.getElementById('modal-unlock-plot');
        const closeUnlockBtn = document.getElementById('btn-close-unlock-plot');
        const confirmUnlockBtn = document.getElementById('btn-confirm-unlock-plot');
        if (closeUnlockBtn && modalUnlockPlot) {
            closeUnlockBtn.addEventListener('click', () => modalUnlockPlot.classList.add('hidden'));
        }
        if (confirmUnlockBtn) {
            confirmUnlockBtn.addEventListener('click', () => this.confirmUnlockPlot());
        }

        const btnHarvestAllResources = document.getElementById('btn-harvest-all-resources');
        if (btnHarvestAllResources) {
            btnHarvestAllResources.addEventListener('click', () => this.harvestAllReadyResourceNodes());
        }

        // Xưởng Thợ Rèn (Chế tạo Rìu, Cuốc Gỗ, Cuốc Đá, Cuốc Sắt) & Đặt Lại Tài Nguyên
        const modalSmith = document.getElementById('modal-blacksmith');
        const btnOpenSmith = document.getElementById('btn-open-blacksmith');
        const btnCloseSmith = document.getElementById('btn-close-blacksmith');
        const btnCraft1 = document.getElementById('btn-craft-tool-1');
        const btnCraft10 = document.getElementById('btn-craft-tool-10');
        if (btnOpenSmith) btnOpenSmith.addEventListener('click', () => this.openBlacksmithModal());
        if (btnCloseSmith && modalSmith) btnCloseSmith.addEventListener('click', () => modalSmith.classList.add('hidden'));
        if (btnCraft1) btnCraft1.addEventListener('click', () => this.craftTool(1));
        if (btnCraft10) btnCraft10.addEventListener('click', () => this.craftTool(10));
        const btnResetAllResources = document.getElementById('btn-reset-all-resources');
        if (btnResetAllResources) btnResetAllResources.addEventListener('click', () => this.resetAllResourcesWithDiamonds());

        // Rương Đồ Tổng Hợp
        document.querySelectorAll('.warehouse-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setWarehouseCategory(btn.getAttribute('data-warehouse-cat'));
            });
        });
        document.querySelectorAll('.smith-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.sound.playClick();
                this.switchSmithTab(btn.getAttribute('data-smith-tab'));
            });
        });

        // Trang trại gà: Cho ăn, Nhặt trứng, Boost Ads, Mượn Phượng Hoàng
        document.getElementById('btn-feed-chickens').addEventListener('click', () => {
            this.feedChickens();
        });
        document.getElementById('btn-collect-eggs').addEventListener('click', () => {
            this.collectAllEggs();
        });
        document.getElementById('btn-chicken-boost').addEventListener('click', () => {
            this.activateChickenBoostWithAd();
        });
        document.getElementById('btn-phoenix-ad').addEventListener('click', () => {
            this.summonPhoenixWithAd();
        });

        // Thả cần câu
        document.getElementById('btn-cast-fishing').addEventListener('click', () => {
            // Random nhẹ vị trí phao nếu bấm nút Quăng Cần trực tiếp
            this.playerBobber = { x: 0.42 + Math.random() * 0.16, y: 0.44 + Math.random() * 0.18 };
            this.startFishing();
        });

        // Kéo cần câu (Giữ nút để minigame nâng thanh lực)
        const btnReel = document.getElementById('btn-reel-in');
        const startReel = (e) => {
            e.preventDefault();
            this.isReeling = true;
        };
        const stopReel = (e) => {
            e.preventDefault();
            this.isReeling = false;
        };

        btnReel.addEventListener('mousedown', startReel);
        btnReel.addEventListener('mouseup', stopReel);
        btnReel.addEventListener('touchstart', startReel);
        btnReel.addEventListener('touchend', stopReel);

        // Xem Ads x2 thưởng cá
        document.getElementById('btn-catch-double').addEventListener('click', () => {
            window.adsgramManager.showRewardAd('fish_double').then(success => {
                this.claimCatch(success);
            });
        });
        document.getElementById('btn-catch-claim').addEventListener('click', () => {
            this.claimCatch(false);
        });

        // Sổ Cá & Bảng Giá HỒ CÁ
        document.getElementById('btn-fish-report').addEventListener('click', () => {
            window.sound.playClick();
            this.openReportModal();
        });
        document.getElementById('btn-close-report').addEventListener('click', () => {
            document.getElementById('modal-report').classList.add('hidden');
        });
        document.getElementById('btn-close-report-bottom').addEventListener('click', () => {
            document.getElementById('modal-report').classList.add('hidden');
        });

        // Mua Vé VIP (Hồ Câu)
        const modalTicket = document.getElementById('modal-ticket');
        document.getElementById('btn-buy-ticket').addEventListener('click', () => {
            window.sound.playClick();
            modalTicket.classList.remove('hidden');
        });
        document.getElementById('btn-close-ticket').addEventListener('click', () => {
            modalTicket.classList.add('hidden');
        });
        document.getElementById('btn-ticket-gold').addEventListener('click', () => {
            if (this.data.gold < 250) {
                window.adsgramManager.showToast("Bạn cần 250 💰 Vàng để mua Vé VIP!", "warning");
                return;
            }
            this.data.gold -= 250;
            this.data.vipTicketUntil = Date.now() + 5 * 60 * 1000;
            modalTicket.classList.add('hidden');
            window.sound.playFanfare();
            window.adsgramManager.showToast("🎫 Kích hoạt Vé Câu Hồ VIP 5 phút! Dù Vàng đã mở!", "success");
            this.save();
            this.updateHeaderUI();
        });
        document.getElementById('btn-ticket-ads').addEventListener('click', () => {
            modalTicket.classList.add('hidden');
            window.adsgramManager.showRewardAd('vip_ticket').then(success => {
                if (success) {
                    this.data.vipTicketUntil = Date.now() + 5 * 60 * 1000;
                    window.sound.playFanfare();
                    window.adsgramManager.showToast("🎫 Đã nhận Vé VIP 5 phút miễn phí!", "success");
                    this.save();
                    this.updateHeaderUI();
                }
            });
        });

        // Xem Quảng Cáo Nhận Vàng (Ảnh số 2: cách nhau 2h, không cộng dồn, tối đa 12 lần/ngày)
        const btnAdGold = document.getElementById('btn-ad-gold-claim');
        if (btnAdGold) {
            btnAdGold.addEventListener('click', () => this.claimAdGold2h());
        }

        // Đóng popup thông báo nhận Vàng
        const btnCloseAdGoldReward = document.getElementById('btn-close-ad-gold-reward');
        if (btnCloseAdGoldReward) {
            btnCloseAdGoldReward.addEventListener('click', () => {
                const modal = document.getElementById('modal-ad-gold-reward');
                if (modal) modal.classList.add('hidden');
            });
        }

        // NPC Phú Nông (Mua & Bán trực tiếp với game bằng Vàng)
        const modalNpcShop = document.getElementById('modal-npc-shop');
        const btnNpcBuy = document.getElementById('btn-npc-open-buy');
        const btnNpcSell = document.getElementById('btn-npc-open-sell');
        const btnCloseNpc = document.getElementById('btn-close-npc-shop');
        if (btnNpcBuy) btnNpcBuy.addEventListener('click', () => this.openNpcShop('buy'));
        if (btnNpcSell) btnNpcSell.addEventListener('click', () => this.openNpcShop('sell'));
        if (btnCloseNpc && modalNpcShop) {
            btnCloseNpc.addEventListener('click', () => modalNpcShop.classList.add('hidden'));
        }
        document.querySelectorAll('.npc-shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                window.sound.playClick();
                this.switchNpcTab(tab.getAttribute('data-npc-tab'));
            });
        });
        document.querySelectorAll('.npc-seed-tier-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setNpcSeedTierFilter(btn.getAttribute('data-npc-seed-tier'));
            });
        });
        const btnResetAllSeeds = document.getElementById('btn-npc-reset-all-seeds');
        if (btnResetAllSeeds) btnResetAllSeeds.addEventListener('click', () => this.resetAllSeedsWithDiamonds());
        const btnBuy1 = document.getElementById('btn-npc-buy-1');
        const btnBuy5 = document.getElementById('btn-npc-buy-5');
        const btnBuy10 = document.getElementById('btn-npc-buy-10');
        if (btnBuy1) btnBuy1.addEventListener('click', () => this.buyFromNpc(1));
        if (btnBuy5) btnBuy5.addEventListener('click', () => this.buyFromNpc(5));
        if (btnBuy10) btnBuy10.addEventListener('click', () => this.buyFromNpc(10));

        const btnSell1 = document.getElementById('btn-npc-sell-1');
        const btnSell10 = document.getElementById('btn-npc-sell-10');
        const btnSellAll = document.getElementById('btn-npc-sell-all');
        if (btnSell1) btnSell1.addEventListener('click', () => this.sellToNpc(1));
        if (btnSell10) btnSell10.addEventListener('click', () => this.sellToNpc(10));
        if (btnSellAll) btnSellAll.addEventListener('click', () => this.sellToNpc('all'));

        // Nhiệm Vụ Hàng Ngày Modal
        const modalQuests = document.getElementById('modal-quests');
        document.getElementById('btn-daily-quests').addEventListener('click', () => {
            window.sound.playClick();
            this.renderQuestsUI();
            modalQuests.classList.remove('hidden');
        });
        document.getElementById('btn-close-quests').addEventListener('click', () => {
            modalQuests.classList.add('hidden');
        });
        document.getElementById('btn-close-quests-bottom').addEventListener('click', () => {
            modalQuests.classList.add('hidden');
        });

        // Cần Câu VIP Modal (Mua bằng Vàng để câu Cá To hoặc Dùng Thử Adsgram)
        const modalVipRod = document.getElementById('modal-vip-rod');
        document.getElementById('btn-buff-rod').addEventListener('click', () => {
            window.sound.playClick();
            this.openVipRodModal();
        });
        const btnCloseVipRod = document.getElementById('btn-close-vip-rod');
        if (btnCloseVipRod && modalVipRod) {
            btnCloseVipRod.addEventListener('click', () => modalVipRod.classList.add('hidden'));
        }
        const btnBuyVipRodGold = document.getElementById('btn-buy-vip-rod-gold');
        if (btnBuyVipRodGold) {
            btnBuyVipRodGold.addEventListener('click', () => {
                if (this.buyVipRodWithGold() && modalVipRod) {
                    modalVipRod.classList.add('hidden');
                }
            });
        }
        const btnTryVipRodAd = document.getElementById('btn-try-vip-rod-ad');
        if (btnTryVipRodAd) {
            btnTryVipRodAd.addEventListener('click', () => {
                if (modalVipRod) modalVipRod.classList.add('hidden');
                window.adsgramManager.showRewardAd('rod_buff').then(success => {
                    if (success) {
                        this.data.isVipRod = true;
                        this.data.vipRodUntil = Date.now() + 10 * 60 * 1000;
                        window.sound.playFanfare();
                        window.adsgramManager.showToast("👑 Dùng thử Cần Câu VIP 10 phút! Đã mở khóa câu Cá To!", "success");
                        this.save();
                        this.updateHeaderUI();
                    }
                });
            });
        }

        // Chợ P2P Người Chơi: Làm mới, Lọc sạp & Modal đăng bán
        const btnRefreshMarket = document.getElementById('btn-refresh-market');
        if (btnRefreshMarket) {
            btnRefreshMarket.addEventListener('click', () => {
                window.sound.playClick();
                this.refreshP2PMarket(true);
            });
        }

        document.querySelectorAll('.market-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.marketFilter = btn.getAttribute('data-filter') === 'mine' ? 'mine' : 'all';
                document.querySelectorAll('.market-filter-btn').forEach(b => {
                    const active = b.getAttribute('data-filter') === this.marketFilter;
                    b.classList.toggle('bg-[#5c3010]', active);
                    b.classList.toggle('text-amber-100', active);
                    b.classList.toggle('border-[#3b1c06]', active);
                    b.classList.toggle('bg-[#f7e7c8]', !active);
                    b.classList.toggle('text-[#4a260a]', !active);
                    b.classList.toggle('border-[#784319]', !active);
                });
                this.renderP2PMarketListings();
            });
        });

        document.querySelectorAll('.market-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-market-cat');
                this.marketCategory = ['crops', 'eggs', 'resources'].includes(cat) ? cat : 'all';
                document.querySelectorAll('.market-cat-btn').forEach(b => {
                    const active = b.getAttribute('data-market-cat') === this.marketCategory;
                    b.classList.toggle('bg-[#5c3010]', active);
                    b.classList.toggle('text-amber-100', active);
                    b.classList.toggle('border-[#3b1c06]', active);
                    b.classList.toggle('bg-[#f7e7c8]', !active);
                    b.classList.toggle('text-[#4a260a]', !active);
                    b.classList.toggle('border-[#784319]', !active);
                });
                this.renderP2PMarketListings();
            });
        });

        const modalListItem = document.getElementById('modal-list-item');
        const btnCloseList = document.getElementById('btn-close-list-item');
        const btnCancelList = document.getElementById('btn-cancel-list-item');
        const btnConfirmList = document.getElementById('btn-confirm-list-item');
        const listQtyInput = document.getElementById('list-item-qty');
        const listPriceInput = document.getElementById('list-item-price');
        if (btnCloseList && modalListItem) btnCloseList.addEventListener('click', () => modalListItem.classList.add('hidden'));
        if (btnCancelList && modalListItem) btnCancelList.addEventListener('click', () => modalListItem.classList.add('hidden'));
        if (btnConfirmList) btnConfirmList.addEventListener('click', () => this.confirmListItem());
        const btnListOpenVip = document.getElementById('btn-list-open-vip');
        if (btnListOpenVip && modalListItem) {
            btnListOpenVip.addEventListener('click', () => {
                modalListItem.classList.add('hidden');
                this.openVipCenterModal('buy');
            });
        }

        // VIP Access Center Modal
        const modalVipCenter = document.getElementById('modal-vip-center');
        const btnOpenVip = document.getElementById('btn-open-vip');
        const btnCloseVip = document.getElementById('btn-close-vip-center');
        const btnConfirmBuyVip = document.getElementById('btn-confirm-buy-vip');
        const btnClaimVipDaily = document.getElementById('btn-claim-vip-daily');
        if (btnOpenVip) btnOpenVip.addEventListener('click', () => this.openVipCenterModal());
        if (btnCloseVip && modalVipCenter) btnCloseVip.addEventListener('click', () => modalVipCenter.classList.add('hidden'));
        if (btnConfirmBuyVip) btnConfirmBuyVip.addEventListener('click', () => this.buyVipPass(this.selectedVipPlanId));
        if (btnClaimVipDaily) btnClaimVipDaily.addEventListener('click', () => this.claimVipDailyGift());
        document.querySelectorAll('.vip-center-tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                window.sound.playClick();
                this.switchVipTab(tabBtn.getAttribute('data-vip-tab'));
            });
        });
        document.querySelectorAll('.vip-plan-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectVipPlan(card.getAttribute('data-vip-plan'));
            });
        });
        if (listPriceInput) listPriceInput.addEventListener('input', () => this.updateListModalPreview());
        if (listQtyInput) {
            listQtyInput.addEventListener('input', () => {
                const itemId = this.pendingListItemId;
                const meta = this.getAllItemsMeta()[itemId];
                const q = Math.max(1, Math.floor(Number(listQtyInput.value || 1)));
                if (meta && listPriceInput) {
                    const isCrop = !!P2P_CROP_FLOOR_PRICES[itemId];
                    const floor = isCrop ? P2P_CROP_FLOOR_PRICES[itemId] : (meta.sellVnd || 20);
                    const minTotal = Math.round(q * floor * 10) / 10;
                    const maxTotal = isCrop ? Math.floor(q * floor * (1 + P2P_MAX_PRICE_SURCHARGE_RATE) * 10) / 10 : Infinity;
                    listPriceInput.min = minTotal;
                    if (isCrop) {
                        listPriceInput.max = maxTotal;
                        listPriceInput.step = '0.1';
                    } else {
                        listPriceInput.removeAttribute('max');
                        listPriceInput.step = '1';
                    }
                    listPriceInput.value = minTotal;
                    this.updateListModalPreview();
                }
            });
        }

        // Quy đổi VND sang Kim Cương (100 VND = 10 Kim Cương)
        const vndDiamondInput = document.getElementById('vnd-to-diamond-input');
        const vndDiamondPreview = document.getElementById('vnd-to-diamond-preview');
        const updateVndDiamondPreview = () => {
            if (!vndDiamondInput || !vndDiamondPreview) return;
            const raw = Math.max(0, Math.floor(Number(vndDiamondInput.value || 0)));
            const diamondEst = Math.floor(raw * 0.1); // Tỉ lệ 100 VND = 10 Kim Cương
            vndDiamondPreview.innerText = `= ${diamondEst.toLocaleString('vi-VN')} 💎`;
        };
        if (vndDiamondInput) {
            vndDiamondInput.addEventListener('input', updateVndDiamondPreview);
            updateVndDiamondPreview();
        }

        const btnVndDiamond = document.getElementById('btn-vnd-to-diamond');
        if (btnVndDiamond) {
            btnVndDiamond.addEventListener('click', () => {
                const vndAmount = Math.floor(Number((vndDiamondInput ? vndDiamondInput.value : 100) || 0));
                if (!vndAmount || vndAmount < 10) {
                    window.adsgramManager.showToast('Vui lòng nhập số VND hợp lệ (tối thiểu 10 VND = 1 💎, 100 VND = 10 💎)!', 'warning');
                    return;
                }
                const diamondGain = Math.floor(vndAmount * 0.1);
                if (diamondGain < 1) {
                    window.adsgramManager.showToast('Số VND quá nhỏ, cần tối thiểu 10 VND để đổi 1 Kim Cương!', 'warning');
                    return;
                }
                this.convertVndToDiamond(vndAmount, diamondGain);
            });
        }

        const vndGoldInput = document.getElementById('vnd-to-gold-input');
        const vndGoldPreview = document.getElementById('vnd-to-gold-preview');
        const updateVndGoldPreview = () => {
            if (!vndGoldInput || !vndGoldPreview) return;
            const raw = Math.max(0, Math.floor(Number(vndGoldInput.value || 0)));
            const goldEst = Math.floor(raw * 0.1);
            vndGoldPreview.innerText = `= ${goldEst.toLocaleString('vi-VN')} Vàng`;
        };
        if (vndGoldInput) {
            vndGoldInput.addEventListener('input', updateVndGoldPreview);
            updateVndGoldPreview();
        }

        const btnVndGold = document.getElementById('btn-vnd-to-gold');
        if (btnVndGold) {
            btnVndGold.addEventListener('click', () => {
                const vndAmount = Math.floor(Number((vndGoldInput ? vndGoldInput.value : 100) || 0));
                if (!vndAmount || vndAmount < 10) {
                    window.adsgramManager.showToast('Vui lòng nhập số VND hợp lệ (tối thiểu 10đ: 100 VND = 10 Vàng)!', 'warning');
                    return;
                }
                const goldGain = Math.floor(vndAmount * 0.1);
                if (goldGain <= 0) {
                    window.adsgramManager.showToast('Số VND quá nhỏ để quy đổi Vàng!', 'warning');
                    return;
                }
                this.convertVndToGold(vndAmount, goldGain);
            });
        }

        // Bếp Nấu Bánh (Bộ Lọc Công Thức Bánh)
        document.querySelectorAll('.bakery-filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.getAttribute('data-filter');
                this.setBakeryFilter(filter);
                window.sound && window.sound.playClick();
            });
        });

        // Rút thưởng
        document.getElementById('btn-request-withdraw').addEventListener('click', () => {
            this.requestWithdraw();
        });

        // Các mốc rút thưởng VND & Ô nhập số tiền tùy chọn
        document.querySelectorAll('.withdraw-amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.withdraw-amount-btn').forEach(b => {
                    b.classList.remove('bg-emerald-100', 'border-emerald-500');
                    b.classList.add('bg-slate-50', 'border-slate-300');
                });
                btn.classList.remove('bg-slate-50', 'border-slate-300');
                btn.classList.add('bg-emerald-100', 'border-emerald-500');
                const customInput = document.getElementById('withdraw-custom-vnd');
                if (customInput) customInput.value = '';
            });
        });

        const customVndInput = document.getElementById('withdraw-custom-vnd');
        if (customVndInput) {
            customVndInput.addEventListener('input', () => {
                if (customVndInput.value && parseInt(customVndInput.value) > 0) {
                    document.querySelectorAll('.withdraw-amount-btn').forEach(b => {
                        b.classList.remove('bg-emerald-100', 'border-emerald-500');
                        b.classList.add('bg-slate-50', 'border-slate-300');
                    });
                }
            });
        }

        // Phương thức rút tiền tabs (Ngân Hàng / MoMo / ZaloPay)
        this.withdrawMethod = 'bank';
        document.querySelectorAll('.withdraw-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.withdraw-tab').forEach(t => {
                    t.classList.remove('active', 'border-emerald-500', 'bg-emerald-50', 'text-emerald-800');
                    t.classList.add('border-slate-200', 'bg-white', 'text-slate-600');
                });
                tab.classList.add('active', 'border-emerald-500', 'bg-emerald-50', 'text-emerald-800');

                const method = tab.getAttribute('data-method') || 'bank';
                this.withdrawMethod = method;
                const fieldsBank = document.getElementById('withdraw-fields-bank');
                const fieldsWallet = document.getElementById('withdraw-fields-wallet');
                const phoneLabel = document.getElementById('withdraw-wallet-phone-label');
                const phoneInput = document.getElementById('withdraw-wallet-phone');
                const nameLabel = document.getElementById('withdraw-wallet-name-label');

                if (method === 'bank') {
                    if (fieldsBank) fieldsBank.classList.remove('hidden');
                    if (fieldsWallet) fieldsWallet.classList.add('hidden');
                } else if (method === 'momo') {
                    if (fieldsBank) fieldsBank.classList.add('hidden');
                    if (fieldsWallet) fieldsWallet.classList.remove('hidden');
                    if (phoneLabel) phoneLabel.innerText = '📱 1. Số Điện Thoại Ví MoMo:';
                    if (phoneInput) phoneInput.placeholder = 'Nhập SĐT đăng ký ví MoMo...';
                    if (nameLabel) nameLabel.innerText = '👤 2. Tên Chủ Ví MoMo:';
                } else if (method === 'zalopay') {
                    if (fieldsBank) fieldsBank.classList.add('hidden');
                    if (fieldsWallet) fieldsWallet.classList.remove('hidden');
                    if (phoneLabel) phoneLabel.innerText = '📱 1. Số Điện Thoại Ví ZaloPay:';
                    if (phoneInput) phoneInput.placeholder = 'Nhập SĐT đăng ký ví ZaloPay...';
                    if (nameLabel) nameLabel.innerText = '👤 2. Tên Chủ Ví ZaloPay:';
                }
            });
        });

        // Cài đặt Adsgram (CHỈ CHỦ GAME ĐÃ XÁC THỰC MỚI ĐƯỢC MỞ)
        const modalSettings = document.getElementById('modal-settings');
        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                if (!this.isOwnerAdmin) {
                    window.adsgramManager.showToast("Chỉ Chủ Game mới có quyền truy cập Cài Đặt!", "error");
                    return;
                }
                const monetagMgr = window.monetagManager || window.adsgramManager;
                const zoneInput = document.getElementById('setting-monetag-zone-id') || document.getElementById('setting-adsgram-id');
                const badgeEl = document.getElementById('monetag-status-badge') || document.getElementById('adsgram-status-badge');
                if (zoneInput) zoneInput.value = monetagMgr.zoneId || '';
                if (badgeEl) badgeEl.innerText = monetagMgr.getStatusText();
                modalSettings.classList.remove('hidden');
            });
        }
        const btnCloseSettings = document.getElementById('btn-close-settings');
        if (btnCloseSettings) {
            btnCloseSettings.addEventListener('click', () => {
                modalSettings.classList.add('hidden');
            });
        }
        const btnSaveSettings = document.getElementById('btn-save-settings');
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener('click', () => {
                if (!this.isOwnerAdmin) return;
                const monetagMgr = window.monetagManager || window.adsgramManager;
                const zoneInput = document.getElementById('setting-monetag-zone-id') || document.getElementById('setting-adsgram-id');
                const newId = zoneInput ? zoneInput.value : '';
                monetagMgr.setZoneId(newId);
                modalSettings.classList.add('hidden');
                monetagMgr.showToast("Đã lưu Zone ID Monetag thành công!", "success");
            });
        }

        // Bấm vào hình LV góc trên trái -> Mở Tài Khoản & Đăng Xuất
        const btnPlayerAvatar = document.getElementById('btn-player-avatar');
        if (btnPlayerAvatar) {
            btnPlayerAvatar.addEventListener('click', () => this.openAccountMenu());
        }
        const btnCloseAccountMenu = document.getElementById('btn-close-account-menu');
        if (btnCloseAccountMenu) {
            btnCloseAccountMenu.addEventListener('click', () => {
                const m = document.getElementById('modal-account-menu');
                if (m) m.classList.add('hidden');
            });
        }
        const btnLogoutAccount = document.getElementById('btn-logout-account');
        if (btnLogoutAccount) {
            btnLogoutAccount.addEventListener('click', () => this.logoutAccount());
        }

        // Cổng xác minh cộng đồng Telegram (Kênh thông báo & Nhóm chat)
        const btnJoinChannel = document.getElementById('btn-gate-join-channel');
        if (btnJoinChannel) {
            btnJoinChannel.addEventListener('click', () => {
                const url = 'https://t.me/thongbaofarmhappy';
                if (window.Telegram?.WebApp?.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(url);
                } else {
                    window.open(url, '_blank');
                }
                this.channelGateOpened = true;
                btnJoinChannel.classList.remove('bg-[#24A1DE]', 'hover:bg-[#1f8ec4]');
                btnJoinChannel.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
                btnJoinChannel.innerHTML = '<span>✓ Đã mở</span>';
                const item = document.getElementById('gate-item-channel');
                if (item) {
                    item.classList.add('border-emerald-500', 'bg-emerald-50/60');
                    item.classList.remove('border-rose-400', 'animate-pulse');
                }
                if (window.soundManager) window.soundManager.play('click');
            });
        }

        const btnJoinGroup = document.getElementById('btn-gate-join-group');
        if (btnJoinGroup) {
            btnJoinGroup.addEventListener('click', () => {
                const url = 'https://t.me/nhomchatfarmhappy';
                if (window.Telegram?.WebApp?.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(url);
                } else {
                    window.open(url, '_blank');
                }
                this.groupGateOpened = true;
                btnJoinGroup.classList.remove('bg-[#24A1DE]', 'hover:bg-[#1f8ec4]');
                btnJoinGroup.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
                btnJoinGroup.innerHTML = '<span>✓ Đã mở</span>';
                const item = document.getElementById('gate-item-group');
                if (item) {
                    item.classList.add('border-emerald-500', 'bg-emerald-50/60');
                    item.classList.remove('border-rose-400', 'animate-pulse');
                }
                if (window.soundManager) window.soundManager.play('click');
            });
        }

        const btnGateConfirm = document.getElementById('btn-gate-confirm');
        if (btnGateConfirm) {
            btnGateConfirm.addEventListener('click', () => {
                if (!this.channelGateOpened || !this.groupGateOpened) {
                    if (!this.channelGateOpened) {
                        const item = document.getElementById('gate-item-channel');
                        if (item) item.classList.add('border-rose-400', 'animate-pulse');
                    }
                    if (!this.groupGateOpened) {
                        const item = document.getElementById('gate-item-group');
                        if (item) item.classList.add('border-rose-400', 'animate-pulse');
                    }
                    if (window.adsgramManager?.showToast) {
                        window.adsgramManager.showToast('⚠️ Bạn cần bấm "Tham gia" đầy đủ cả Kênh thông báo và Nhóm chat trước!', 'warning');
                    }
                    if (window.soundManager) window.soundManager.play('error');
                    return;
                }

                localStorage.setItem('lucky_farm_community_verified', 'true');
                this.hideCommunityGate();
                this.showAuthModal('register');
                if (window.adsgramManager?.showToast) {
                    window.adsgramManager.showToast('🎉 Xác nhận tham gia cộng đồng thành công! Hãy tạo tài khoản nông trại của bạn.', 'success');
                }
                if (window.soundManager) window.soundManager.play('complete');
            });
        }

        const btnGateSwitchLogin = document.getElementById('btn-gate-switch-login');
        if (btnGateSwitchLogin) {
            btnGateSwitchLogin.addEventListener('click', () => {
                this.hideCommunityGate();
                this.showAuthModal('login');
                if (window.soundManager) window.soundManager.play('click');
            });
        }

        // Đăng ký / Đăng nhập tài khoản người chơi
        const authTabReg = document.getElementById('auth-tab-register');
        if (authTabReg) authTabReg.addEventListener('click', () => this.switchAuthTab('register'));
        const authTabLogin = document.getElementById('auth-tab-login');
        if (authTabLogin) authTabLogin.addEventListener('click', () => this.switchAuthTab('login'));
        const btnAuthReg = document.getElementById('btn-auth-register');
        if (btnAuthReg) btnAuthReg.addEventListener('click', () => this.submitRegister());
        const btnAuthLogin = document.getElementById('btn-auth-login');
        if (btnAuthLogin) btnAuthLogin.addEventListener('click', () => this.submitLogin());

        const authRegPwd2 = document.getElementById('auth-reg-password2');
        if (authRegPwd2) {
            authRegPwd2.addEventListener('keydown', e => {
                if (e.key === 'Enter') this.submitRegister();
            });
        }
        const authLoginPwd = document.getElementById('auth-login-password');
        if (authLoginPwd) {
            authLoginPwd.addEventListener('keydown', e => {
                if (e.key === 'Enter') this.submitLogin();
            });
        }
    }
}

// Khởi chạy Game khi tài liệu đã tải xong
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
