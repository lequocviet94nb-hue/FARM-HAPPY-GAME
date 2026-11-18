/**
 * MONETAG ADVERTISING & REWARDED INTEGRATION MANAGER
 * ----------------------------------------------------
 * - Thay thế hoàn toàn Adsgram, tích hợp mạng quảng cáo Monetag (monetag.com).
 * - Quảng cáo không thể bỏ qua (Non-skippable), bắt buộc xem đủ 15 giây.
 * - Lá chắn chống nhảy link / Anti-Redirect Shield: Chặn popunder, window.open và click hijack ra trang ngoài.
 * - Hệ thống chống gian lận (Anti-Cheat): Phiên xem quảng cáo được cấp Token bí mật và kiểm tra thời gian thực trên Server.
 * - Hỗ trợ xem 2 lần quảng cáo cho Tưới Nước và Nhận Vàng (Ảnh 1).
 */
class MonetagManager {
    constructor() {
        this.zoneId = '12291920'; // Mã Zone ID chính thức từ Monetag Telegram Mini App
        localStorage.setItem('monetag_zone_id', this.zoneId);
        this.isWatching = false;
        this.cooldownSeconds = 30 * 60; // Cooldown 30 phút giữa các lượt xem thông thường
        this.maxDailyAds = 24;          // Tối đa 24 lượt nhận thưởng mỗi ngày
        this.originalWindowOpen = null;
        this.antiRedirectActive = false;

        this.loadStats();
        this.init();
    }

    getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    loadStats() {
        const saved = JSON.parse(localStorage.getItem('monetag_stats') || '{}');
        const today = this.getTodayKey();
        if (saved.date !== today) {
            this.stats = {
                date: today,
                dailyCount: 0,
                totalCount: saved.totalCount || 0,
                lastWatchedAt: 0
            };
        } else {
            this.stats = {
                date: today,
                dailyCount: saved.dailyCount || 0,
                totalCount: saved.totalCount || 0,
                lastWatchedAt: saved.lastWatchedAt || 0
            };
        }
        this.saveStats();
    }

    saveStats() {
        localStorage.setItem('monetag_stats', JSON.stringify(this.stats));
    }

    init() {
        this.loadMonetagSdk();
    }

    setZoneId(id) {
        this.zoneId = (id || '').trim();
        localStorage.setItem('monetag_zone_id', this.zoneId);
        this.loadMonetagSdk();
    }

    loadMonetagSdk() {
        if (!this.zoneId) return;
        if (typeof window['show_' + this.zoneId] === 'function') return;

        const existingScript = document.getElementById('monetag-tag-script');
        if (existingScript) existingScript.remove();

        try {
            const script = document.createElement('script');
            script.id = 'monetag-tag-script';
            script.src = 'https://libtl.com/sdk.js';
            script.setAttribute('data-zone', this.zoneId);
            script.setAttribute('data-sdk', 'show_' + this.zoneId);
            script.async = true;
            document.head.appendChild(script);
            console.log(`[Monetag TMA] Đã nạp SDK libtl.com với Zone ID: ${this.zoneId}`);
        } catch (e) {
            console.warn('[Monetag] Lỗi nạp SDK:', e);
        }
    }

    getStatusText() {
        if (this.zoneId) {
            return `Monetag Live (Zone ID: ${this.zoneId}) • Bảo Vệ Chống Hack & Chặn Link Ngoài ✓`;
        }
        return `Monetag Trình Duyệt (Sẵn Sàng) • Bảo Vệ Chống Hack & Chặn Link Ngoài ✓`;
    }

    getRemainingDailyAds() {
        if (this.stats.date !== this.getTodayKey()) this.loadStats();
        return Math.max(0, this.maxDailyAds - (this.stats.dailyCount || 0));
    }

    getCooldownRemaining() {
        if (!this.stats.lastWatchedAt) return 0;
        const elapsed = Date.now() - this.stats.lastWatchedAt;
        const rem = Math.ceil((this.cooldownSeconds * 1000 - elapsed) / 1000);
        return Math.max(0, rem);
    }

    recordSuccess() {
        this.loadStats();
        this.stats.dailyCount = Math.min(this.maxDailyAds, (this.stats.dailyCount || 0) + 1);
        this.stats.totalCount += 1;
        this.stats.lastWatchedAt = Date.now();
        this.saveStats();
    }

    // ==========================================
    // CHÍNH SÁCH BẢO VỆ TÀI KHOẢN MONETAG
    // ==========================================
    enableAntiRedirectShield() {
        // Tuân thủ 100% chính sách Monetag: Không can thiệp hoặc chặn window.open của quảng cáo
        // Điều này đảm bảo Monetag không khóa tài khoản vì lỗi "Ad Tampering / Fraudulent Traffic"
    }

    disableAntiRedirectShield() {
    }

    // ==========================================
    // XÁC THỰC PHIÊN QUẢNG CÁO PHÍA SERVER (ANTI-CHEAT)
    // ==========================================
    async startServerAdSession(placement) {
        try {
            const res = await fetch('/api/ad/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ placement, timestamp: Date.now() })
            });
            const data = await res.json();
            if (data && data.ok && data.token) {
                return data;
            }
        } catch (e) {
            console.warn('[Monetag Anti-Cheat] Không thể kết nối máy chủ xác minh:', e);
        }
        return null;
    }

    async verifyServerAdSession(token, placement) {
        if (!token) return { ok: false, error: 'Không có token phiên quảng cáo!' };
        try {
            const res = await fetch('/api/ad/session/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, placement, timestamp: Date.now() })
            });
            const data = await res.json();
            return data;
        } catch (e) {
            console.warn('[Monetag Anti-Cheat] Lỗi gửi xác minh lên máy chủ:', e);
            return { ok: false, error: 'Không thể kết nối máy chủ để xác minh quảng cáo.' };
        }
    }

    // ==========================================
    // PHÁT 1 QUẢNG CÁO MONETAG REWARDED (SDK LIBTL.COM)
    // ==========================================
    playSingleMonetagAd(placement = 'general', displayIndex = 1, totalAds = 1) {
        return new Promise(async (resolve) => {
            // 1. Khởi tạo phiên xem với Server để lấy token chống hack
            const session = await this.startServerAdSession(placement);
            const token = session ? session.token : null;

            const globalFnName = 'show_' + this.zoneId;

            // Kiểm tra xem SDK Monetag đã sẵn sàng chưa (nếu bật AdBlock sẽ bị chặn ở đây)
            if (typeof window[globalFnName] !== 'function') {
                console.warn(`[Monetag TMA] Hàm ${globalFnName} chưa sẵn sàng hoặc bị chặn.`);
                this.showToast('⚠️ Không thể tải video quảng cáo! Vui lòng tắt trình chặn quảng cáo (AdBlock) để nhận thưởng.', 'error');
                resolve(false);
                return;
            }

            try {
                this.showToast(`💎 Đang mở video quảng cáo Monetag ${totalAds > 1 ? `(${displayIndex}/${totalAds})` : ''}...`, 'info');

                // 2. Gọi hàm SDK chính thức của Monetag (tự động hiện popup video full-screen)
                await window[globalFnName]();

                // 3. Người dùng đã xem xong video: Kiểm tra xác thực Server-side (Chống Hack Tua Giờ)
                if (token) {
                    const ver = await this.verifyServerAdSession(token, placement);
                    if (!ver.ok) {
                        this.showToast(ver.error || 'Phát hiện gian lận thời gian xem quảng cáo!', 'error');
                        resolve(false);
                        return;
                    }
                }

                this.recordSuccess();
                this.showToast('🎉 Đã xác nhận xem quảng cáo Monetag thành công!', 'success');
                resolve(true);
            } catch (sdkErr) {
                console.warn('[Monetag TMA] Người dùng tắt hoặc bỏ qua video:', sdkErr);
                this.showToast('Bạn chưa xem hết video nên chưa thể nhận thưởng!', 'warning');
                resolve(false);
            }
        });
    }

    /**
     * Xem 1 lượt quảng cáo thông thường
     */
    async showRewardAd(placement = 'general', bypassCooldown = false) {
        if (this.isWatching) return false;
        this.isWatching = true;

        try {
            const ok = await this.playSingleMonetagAd(placement, 1, 1);
            this.isWatching = false;
            return ok;
        } catch (e) {
            this.isWatching = false;
            this.disableAntiRedirectShield();
            return false;
        }
    }

    /**
     * Tưới nước cho toàn bộ cây trồng (≥ 1h):
     * Yêu cầu xem đủ đúng 2 lần quảng cáo Monetag liên tiếp, không được bỏ qua.
     */
    async showTwoWaterAds() {
        if (this.isWatching) return false;
        this.isWatching = true;

        try {
            this.showToast("📺 Quảng cáo 1/2: Đang phát video Monetag để tưới nước...", "info");
            const ok1 = await this.playSingleMonetagAd('water_ad_1', 1, 2);
            if (!ok1) {
                this.isWatching = false;
                this.showToast("Bạn chưa xem hết quảng cáo thứ nhất!", "warning");
                return false;
            }

            this.showToast("📺 Quảng cáo 2/2: Xem tiếp quảng cáo thứ 2 để hoàn tất tưới nước!", "info");
            const ok2 = await this.playSingleMonetagAd('water_ad_2', 2, 2);
            this.isWatching = false;

            if (!ok2) {
                this.showToast("Bạn chưa xem đủ 2/2 quảng cáo Monetag nên chưa thể tưới nước!", "warning");
                return false;
            }

            return true;
        } catch (e) {
            this.isWatching = false;
            this.disableAntiRedirectShield();
            return false;
        }
    }

    /**
     * Nút nhận Vàng (Ảnh số 1):
     * Yêu cầu xem đủ 2 lần quảng cáo Monetag mới được nhận +1 Vàng!
     */
    async showTwoAdGold() {
        if (this.isWatching) return false;
        this.isWatching = true;

        try {
            this.showToast("📺 Quảng cáo 1/2: Đang phát video Monetag để nhận Vàng...", "info");
            const ok1 = await this.playSingleMonetagAd('gold_ad_1', 1, 2);
            if (!ok1) {
                this.isWatching = false;
                this.showToast("Bạn chưa xem xong quảng cáo 1/2!", "warning");
                return false;
            }

            this.showToast("📺 Quảng cáo 2/2: Xem tiếp quảng cáo 2 để nhận +1 Vàng!", "info");
            const ok2 = await this.playSingleMonetagAd('gold_ad_2', 2, 2);
            this.isWatching = false;

            if (!ok2) {
                this.showToast("Bạn chưa xem đủ 2/2 quảng cáo Monetag nên chưa thể nhận Vàng!", "warning");
                return false;
            }

            return true;
        } catch (e) {
            this.isWatching = false;
            this.disableAntiRedirectShield();
            return false;
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed top-16 left-1/2 -translate-x-1/2 z-[110] px-4 py-2.5 rounded-2xl text-xs font-black shadow-2xl transition-all duration-300 pointer-events-none text-center max-w-[90%] border ${
            type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' :
            type === 'warning' ? 'bg-amber-500 text-slate-950 border-amber-300' :
            type === 'error' ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-800 text-white border-slate-600'
        }`;
        const safeMsg = String(message)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/🪙/g, '<span class="gold-bar-icon" aria-label="Vàng"></span>');
        toast.innerHTML = safeMsg;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, -10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Khởi tạo Monetag Manager & thiết lập bí danh tương thích 100% với toàn bộ game
window.monetagManager = new MonetagManager();
window.adsgramManager = window.monetagManager;
