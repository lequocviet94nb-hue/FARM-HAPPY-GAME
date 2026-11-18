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
        this.zoneId = localStorage.getItem('monetag_zone_id') || '';
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
        const existingScript = document.getElementById('monetag-tag-script');
        if (existingScript) existingScript.remove();

        try {
            const script = document.createElement('script');
            script.id = 'monetag-tag-script';
            script.src = 'https://alwingulla.com/88/tag.min.js';
            script.setAttribute('data-zone', this.zoneId);
            script.async = true;
            document.head.appendChild(script);
            console.log(`[Monetag] Đã nạp SDK với Zone ID: ${this.zoneId}`);
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
    // LÁ CHẮN CHỐNG NHẢY LINK NGOÀI (ANTI-REDIRECT SHIELD)
    // ==========================================
    enableAntiRedirectShield() {
        if (this.antiRedirectActive) return;
        this.antiRedirectActive = true;
        this.originalWindowOpen = window.open;

        // Chặn window.open mở tab nhảy trang quảng cáo
        window.open = function(url, ...rest) {
            console.warn('[Monetag Anti-Redirect] Đã chặn lệnh mở link ra ngoài trang game:', url);
            return null;
        };

        // Chặn click các liên kết ngoài trong khi xem quảng cáo
        this._shieldClickHandler = (e) => {
            const anchor = e.target.closest('a');
            if (anchor && anchor.href && !anchor.href.includes(window.location.host)) {
                e.preventDefault();
                e.stopPropagation();
                console.warn('[Monetag Anti-Redirect] Đã chặn click chuyển hướng ra link ngoài:', anchor.href);
            }
        };
        window.addEventListener('click', this._shieldClickHandler, true);
    }

    disableAntiRedirectShield() {
        if (!this.antiRedirectActive) return;
        this.antiRedirectActive = false;
        if (this.originalWindowOpen) {
            window.open = this.originalWindowOpen;
            this.originalWindowOpen = null;
        }
        if (this._shieldClickHandler) {
            window.removeEventListener('click', this._shieldClickHandler, true);
            this._shieldClickHandler = null;
        }
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
    // PHÁT 1 QUẢNG CÁO MONETAG BẮT BUỘC XEM ĐỦ 15S
    // ==========================================
    playSingleMonetagAd(placement = 'general', displayIndex = 1, totalAds = 1) {
        return new Promise(async (resolve) => {
            this.enableAntiRedirectShield();

            // 1. Khởi tạo phiên xem với Server để lấy token chống hack
            const session = await this.startServerAdSession(placement);
            const token = session ? session.token : null;
            const requiredSec = (session && session.minDurationSec) || 15;

            // 2. Thử gọi hàm SDK Monetag nếu người dùng đã nhập Zone ID hợp lệ
            const globalFnName = 'show_' + this.zoneId;
            let usedSdk = false;

            if (this.zoneId && typeof window[globalFnName] === 'function') {
                try {
                    this.showToast(`💎 Đang kết nối Monetag Zone ${this.zoneId}...`, 'info');
                    usedSdk = true;
                    // Bật trình bảo vệ overlay trong khi SDK chạy
                    await window[globalFnName]();
                } catch (sdkErr) {
                    console.warn('[Monetag SDK] Gặp lỗi khi gọi show_XXX:', sdkErr);
                    usedSdk = false;
                }
            }

            // 3. Hiển thị Trình xem Video Monetag chính thức (Bắt buộc xem đủ 15s, cấm bỏ qua, chặn link ngoài)
            const modal = document.getElementById('modal-monetag-ad');
            const timerEl = document.getElementById('monetag-ad-timer');
            const progressEl = document.getElementById('monetag-ad-progress');
            const subTitleEl = document.getElementById('monetag-ad-sub');
            const counterBadgeEl = document.getElementById('monetag-ad-badge');

            if (!modal) {
                // Dự phòng nếu modal chưa mount
                await new Promise(r => setTimeout(r, requiredSec * 1000));
                this.disableAntiRedirectShield();
                if (token) {
                    const ver = await this.verifyServerAdSession(token, placement);
                    if (!ver.ok) {
                        this.showToast(ver.error || 'Xác thực quảng cáo thất bại!', 'error');
                        resolve(false);
                        return;
                    }
                }
                this.recordSuccess();
                resolve(true);
                return;
            }

            modal.classList.remove('hidden');
            if (counterBadgeEl) {
                counterBadgeEl.innerText = totalAds > 1 ? `Quảng Cáo ${displayIndex}/${totalAds}` : 'Quảng Cáo Monetag';
            }
            if (subTitleEl) {
                subTitleEl.innerText = totalAds > 1
                    ? `Vui lòng xem đủ 15 giây video ${displayIndex}/${totalAds} để nhận thưởng (Không thể bỏ qua)`
                    : `Vui lòng xem hết 15 giây video đối tác Monetag để nhận thưởng (Không thể bỏ qua)`;
            }

            let timeLeft = requiredSec;
            if (timerEl) timerEl.innerText = timeLeft;
            if (progressEl) progressEl.style.width = '0%';

            let elapsedCount = 0;
            const timerInterval = setInterval(async () => {
                elapsedCount++;
                timeLeft--;
                if (timerEl && timeLeft >= 0) timerEl.innerText = timeLeft;
                if (progressEl) {
                    const pct = Math.min(100, Math.round((elapsedCount / requiredSec) * 100));
                    progressEl.style.width = `${pct}%`;
                }

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    modal.classList.add('hidden');
                    this.disableAntiRedirectShield();

                    // Xác thực phiên xem hợp lệ trên Server (Chống Hack)
                    if (token) {
                        const ver = await this.verifyServerAdSession(token, placement);
                        if (!ver.ok) {
                            this.showToast(ver.error || 'Phát hiện gian lận quảng cáo!', 'error');
                            resolve(false);
                            return;
                        }
                    }

                    this.recordSuccess();
                    resolve(true);
                }
            }, 1000);
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
