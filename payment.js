/**
 * Hệ thống Nạp Tiền MoMo / ZaloPay & Bảng Quản Trị Chủ Game
 * Kết nối trực tiếp API Backend (server.js) - chống giả mạo phía client.
 */

class PaymentManager {
    constructor() {
        this.playerId = this.getOrCreatePlayerId();
        this.selectedMethod = 'momo';
        this.publicInfo = null;
        this.currentOrder = null;
        this.pollTimer = null;
        this.claimingIds = new Set();

        this.adminPin = '';
        this.adminToken = sessionStorage.getItem('lucky_farm_admin_token') || '';
        this.tempMomoQr = '';
        this.tempZaloQr = '';
        this.tempBankQr = '';

        this.bindEvents();
        setTimeout(() => {
            this.loadPublicInfo();
            this.checkAndClaimApprovedOrders();
            if (window.location.hash === '#admin') {
                this.openAdminModal();
            }
        }, 500);
    }

    syncPlayerId(id) {
        if (id) {
            this.playerId = id;
            localStorage.setItem('lucky_farm_player_id', id);
        }
    }

    getAdminHeaders(extra = {}) {
        const headers = { ...extra };
        if (this.adminToken) headers['x-admin-token'] = this.adminToken;
        if (this.adminPin) headers['x-admin-pin'] = this.adminPin;
        const authToken = localStorage.getItem('lucky_farm_auth_token');
        if (authToken) headers['x-auth-token'] = authToken;
        return headers;
    }

    logoutAdminSession() {
        this.adminToken = '';
        this.adminPin = '';
        sessionStorage.removeItem('lucky_farm_admin_token');
        if (window.game && typeof window.game.setOwnerAdminState === 'function') {
            window.game.setOwnerAdminState(false);
        }
        const modal = document.getElementById('modal-admin-topup');
        if (modal) modal.classList.add('hidden');
        const settingsModal = document.getElementById('modal-settings');
        if (settingsModal) settingsModal.classList.add('hidden');
    }

    getOrCreatePlayerId() {
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

    getPlayerName() {
        return (window.game && window.game.playerName) ? window.game.playerName : 'Nông Dân';
    }

    async apiJson(url, options = {}) {
        const res = await fetch(url, options);
        const data = await res.json();
        if (!res.ok) {
            const err = new Error(data.error || `HTTP ${res.status}`);
            err.code = data.code;
            throw err;
        }
        return data;
    }

    bindEvents() {
        // Nút mở shop nạp tiền từ Header & từ tab Chợ
        const btnOpen = document.getElementById('btn-open-topup');
        const btnMarket = document.getElementById('btn-market-topup');
        const btnClose = document.getElementById('btn-close-topup');

        if (btnOpen) btnOpen.addEventListener('click', () => this.openTopupModal());
        if (btnMarket) btnMarket.addEventListener('click', () => this.openTopupModal());
        if (btnClose) btnClose.addEventListener('click', () => this.closeTopupModal());

        // Chọn hình thức nạp MoMo / ZaloPay / Ngân Hàng
        document.querySelectorAll('.topup-method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setMethod(btn.getAttribute('data-method'));
            });
        });

        const customAmtInput = document.getElementById('topup-custom-amount');
        if (customAmtInput) {
            customAmtInput.addEventListener('input', () => this.updateCustomPreview());
            this.updateCustomPreview();
        }
        const btnCustomTopup = document.getElementById('btn-topup-custom');
        if (btnCustomTopup) {
            btnCustomTopup.addEventListener('click', () => this.createCustomTopupOrder());
        }

        const btnBack = document.getElementById('btn-topup-back');
        if (btnBack) btnBack.addEventListener('click', () => this.showSelectStep());

        const btnRefreshHistory = document.getElementById('btn-topup-refresh-history');
        if (btnRefreshHistory) {
            btnRefreshHistory.addEventListener('click', () => this.checkAndClaimApprovedOrders(true));
        }

        const btnTransferred = document.getElementById('btn-topup-transferred');
        if (btnTransferred) btnTransferred.addEventListener('click', () => this.markTransferred());

        const btnCheckStatus = document.getElementById('btn-topup-check-status');
        if (btnCheckStatus) {
            btnCheckStatus.addEventListener('click', () => this.checkAndClaimApprovedOrders(true));
        }

        // Copy buttons trong màn hình thanh toán
        this.bindCopyBtn('btn-copy-phone', 'checkout-receiver-phone', 'Đã copy số tài khoản nhận!');
        this.bindCopyBtn('btn-copy-amount', 'checkout-copy-amount-val', 'Đã copy số tiền!');
        this.bindCopyBtn('btn-copy-note', 'checkout-transfer-note', 'Đã copy nội dung chuyển khoản!');

        // Admin modal events
        const btnOpenAdmin = document.getElementById('btn-open-admin-topup');
        const btnCloseAdmin = document.getElementById('btn-close-admin-topup');
        if (btnOpenAdmin) {
            btnOpenAdmin.addEventListener('click', () => {
                const modalSettings = document.getElementById('modal-settings');
                if (modalSettings) modalSettings.classList.add('hidden');
                this.openAdminModal();
            });
        }
        if (btnCloseAdmin) {
            btnCloseAdmin.addEventListener('click', () => {
                document.getElementById('modal-admin-topup').classList.add('hidden');
            });
        }

        const btnAdminLogin = document.getElementById('btn-admin-login');
        if (btnAdminLogin) btnAdminLogin.addEventListener('click', () => this.adminLogin());

        const pinInput = document.getElementById('admin-pin-input');
        if (pinInput) {
            pinInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') this.adminLogin();
            });
        }

        document.querySelectorAll('.admin-tab-btn').forEach(tab => {
            tab.addEventListener('click', () => this.switchAdminTab(tab.getAttribute('data-admin-tab')));
        });

        const btnAdminRefresh = document.getElementById('btn-admin-refresh-orders');
        if (btnAdminRefresh) btnAdminRefresh.addEventListener('click', () => this.loadAdminDashboard());

        const btnAdminSave = document.getElementById('btn-admin-save-config');
        if (btnAdminSave) btnAdminSave.addEventListener('click', () => this.saveAdminConfig());

        const btnBindOwner = document.getElementById('btn-admin-bind-owner');
        if (btnBindOwner) btnBindOwner.addEventListener('click', () => this.bindOwnerAccount());

        // Upload & nén ảnh QR MoMo / ZaloPay / Ngân Hàng cá nhân
        this.bindQrUpload('admin-momo-qr-file', 'admin-momo-qr-preview', 'btn-clear-momo-qr', dataUrl => {
            this.tempMomoQr = dataUrl;
        });
        this.bindQrUpload('admin-zalopay-qr-file', 'admin-zalopay-qr-preview', 'btn-clear-zalopay-qr', dataUrl => {
            this.tempZaloQr = dataUrl;
        });
        this.bindQrUpload('admin-bank-qr-file', 'admin-bank-qr-preview', 'btn-clear-bank-qr', dataUrl => {
            this.tempBankQr = dataUrl;
        });
    }

    bindCopyBtn(btnId, sourceId, toastMsg) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const el = document.getElementById(sourceId);
            const text = el ? el.innerText.trim() : '';
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                window.adsgramManager.showToast(toastMsg, 'success');
            } catch (e) {
                window.adsgramManager.showToast(`Giá trị cần copy: ${text}`, 'info');
            }
        });
    }

    bindQrUpload(inputId, previewId, clearBtnId, onUpdate) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const clearBtn = document.getElementById(clearBtnId);

        if (input) {
            input.addEventListener('change', async () => {
                const file = input.files && input.files[0];
                if (!file) return;
                try {
                    const dataUrl = await this.resizeImageToDataUrl(file, 360);
                    onUpdate(dataUrl);
                    if (preview) {
                        preview.src = dataUrl;
                        preview.classList.remove('hidden');
                    }
                    if (clearBtn) clearBtn.classList.remove('hidden');
                    window.adsgramManager.showToast('Đã tải ảnh QR! Nhấn Lưu Thông Tin Ví để áp dụng.', 'info');
                } catch (err) {
                    window.adsgramManager.showToast('Không đọc được file ảnh QR!', 'error');
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                onUpdate('');
                if (input) input.value = '';
                if (preview) {
                    preview.src = '';
                    preview.classList.add('hidden');
                }
                clearBtn.classList.add('hidden');
            });
        }
    }

    resizeImageToDataUrl(file, maxSize = 360) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
                    const w = Math.max(1, Math.round(img.width * ratio));
                    const h = Math.max(1, Math.round(img.height * ratio));
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async loadPublicInfo() {
        try {
            const data = await this.apiJson('/api/payment/public-info');
            this.publicInfo = data;
            this.renderMethodHint();
            this.renderTopupPacks();
        } catch (err) {
            const hint = document.getElementById('topup-method-hint');
            if (hint) hint.innerText = 'Không kết nối được máy chủ thanh toán.';
        }
    }

    calcVndReward(amountVnd) {
        const amt = Math.max(0, Math.floor(Number(amountVnd) || 0));
        return amt > 100000 ? Math.round(amt * 1.1) : amt;
    }

    getMethodLabel(method) {
        if (method === 'momo') return 'MoMo';
        if (method === 'zalopay') return 'ZaloPay';
        if (method === 'bank') return 'Ngân Hàng';
        return String(method || '');
    }

    updateCustomPreview() {
        const input = document.getElementById('topup-custom-amount');
        const preview = document.getElementById('topup-custom-preview');
        if (!input || !preview) return;
        const amt = Math.max(0, Math.floor(Number(input.value || 0)));
        const reward = this.calcVndReward(amt);
        const rateTag = amt > 100000 ? '1:1,1' : '1:1';
        preview.innerText = `+${reward.toLocaleString()}đ VND (${rateTag})`;
    }

    setMethod(method) {
        const valid = ['momo', 'zalopay', 'bank'];
        this.selectedMethod = valid.includes(method) ? method : 'momo';
        document.querySelectorAll('.topup-method-btn').forEach(btn => {
            const m = btn.getAttribute('data-method');
            const active = m === this.selectedMethod;
            btn.classList.remove(
                'border-pink-500', 'bg-pink-50', 'text-pink-900',
                'border-sky-500', 'bg-sky-50', 'text-sky-900',
                'border-emerald-500', 'bg-emerald-50', 'text-emerald-900',
                'border-slate-200', 'bg-white', 'text-slate-700'
            );
            if (active && m === 'momo') {
                btn.classList.add('border-pink-500', 'bg-pink-50', 'text-pink-900');
            } else if (active && m === 'zalopay') {
                btn.classList.add('border-sky-500', 'bg-sky-50', 'text-sky-900');
            } else if (active && m === 'bank') {
                btn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-900');
            } else {
                btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
            }
        });
        window.sound && window.sound.playClick();
        this.renderMethodHint();
    }

    renderMethodHint() {
        const hint = document.getElementById('topup-method-hint');
        if (!hint || !this.publicInfo) return;
        const info = this.publicInfo[this.selectedMethod] || {};
        const label = this.getMethodLabel(this.selectedMethod);

        if (!info.configured) {
            hint.innerHTML = `<span class="text-rose-600 font-black">⚠️ Chủ game chưa cấu hình ${label}.</span> Mở <b>⚙️ Cài Đặt ➔ Quản Trị MoMo / ZaloPay / Ngân Hàng</b> để điền thông tin nhận tiền!`;
        } else if (info.gatewayEnabled) {
            hint.innerHTML = `<span class="text-emerald-700 font-black">⚡ Cổng ${label} Tự Động đã sẵn sàng!</span> Thanh toán xong VND cộng tự động ngay lập tức.`;
        } else {
            const bankPrefix = (this.selectedMethod === 'bank' && info.bankName) ? `${this.escapeHtml(info.bankName)} - ` : '';
            const nameDisplay = info.name ? ` (${bankPrefix}${this.escapeHtml(info.name)})` : (bankPrefix ? ` (${this.escapeHtml(info.bankName)})` : '');
            hint.innerHTML = `<span class="text-emerald-700 font-black">✅ Nhận trực tiếp qua ${label}${nameDisplay}.</span> Quét QR / chuyển khoản theo mã đơn.`;
        }
    }

    renderTopupPacks() {
        const container = document.getElementById('topup-packs-list');
        if (!container || !this.publicInfo) return;

        container.innerHTML = this.publicInfo.packs.map(p => `
            <div class="bg-white rounded-2xl p-2.5 border-2 border-amber-200 hover:border-pink-400 shadow-sm flex justify-between items-center gap-2 transition">
                <div>
                    <div class="flex items-center gap-1.5">
                        <span class="font-black text-slate-900 text-xs">${this.escapeHtml(p.name)}</span>
                        <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full ${p.priceVnd > 100000 ? 'bg-amber-100 text-amber-800' : 'bg-pink-100 text-pink-800'}">${this.escapeHtml(p.badge)}</span>
                    </div>
                    <div class="text-[11px] font-extrabold text-emerald-700 mt-0.5">
                        💵 Nhận ngay: +${Number(p.vnd || 0).toLocaleString()}đ VND Chợ
                    </div>
                </div>
                <button class="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-105 text-white font-black rounded-xl text-[11px] shadow border-b-2 border-rose-900 active:scale-95 flex-shrink-0" onclick="window.paymentManager.createTopupOrder('${p.id}')">
                    ${p.priceVnd.toLocaleString()}đ
                </button>
            </div>
        `).join('');
    }

    async openTopupModal() {
        window.sound && window.sound.playClick();
        document.getElementById('modal-topup').classList.remove('hidden');
        this.showSelectStep();
        await this.loadPublicInfo();
        await this.checkAndClaimApprovedOrders(false);
        this.startPolling();
    }

    closeTopupModal() {
        document.getElementById('modal-topup').classList.add('hidden');
        this.stopPolling();
    }

    showSelectStep() {
        document.getElementById('topup-step-select').classList.remove('hidden');
        document.getElementById('topup-step-checkout').classList.add('hidden');
    }

    showCheckoutStep() {
        document.getElementById('topup-step-select').classList.add('hidden');
        document.getElementById('topup-step-checkout').classList.remove('hidden');
    }

    startPolling() {
        this.stopPolling();
        this.pollTimer = setInterval(() => {
            this.checkAndClaimApprovedOrders(false);
        }, 4000);
    }

    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    async createTopupOrder(packId) {
        return this._submitTopupOrder({ packId });
    }

    async createCustomTopupOrder() {
        const input = document.getElementById('topup-custom-amount');
        const amountVnd = Math.floor(Number((input ? input.value : 0) || 0));
        if (!amountVnd || amountVnd < 10000) {
            window.adsgramManager.showToast('Số tiền nạp tùy chọn tối thiểu là 10.000đ!', 'warning');
            return;
        }
        return this._submitTopupOrder({ amountVnd });
    }

    async _submitTopupOrder(extraPayload) {
        try {
            const data = await this.apiJson('/api/topup/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...extraPayload,
                    method: this.selectedMethod,
                    playerId: this.playerId,
                    playerName: this.getPlayerName()
                })
            });

            this.currentOrder = data.order;
            this.renderCheckout(data.order, data.receiver || {});
            this.showCheckoutStep();
            this.checkAndClaimApprovedOrders(false);
        } catch (err) {
            window.adsgramManager.showToast(err.message, 'warning');
        }
    }

    renderCheckout(order, receiver) {
        document.getElementById('checkout-order-id').innerText = order.id;
        document.getElementById('checkout-pack-name').innerText = `${order.packName} (+${Number(order.vndReward || 0).toLocaleString()}đ VND)`;
        document.getElementById('checkout-amount').innerText = `${Number(order.amountVnd).toLocaleString()}đ`;
        const methodBadgeMap = {
            momo: '🟣 Ví MoMo',
            zalopay: '🔵 ZaloPay',
            bank: '🏦 Ngân Hàng'
        };
        document.getElementById('checkout-method-badge').innerText = methodBadgeMap[order.method] || order.method;

        const gwBox = document.getElementById('checkout-gateway-box');
        const persBox = document.getElementById('checkout-personal-box');
        const btnTransferred = document.getElementById('btn-topup-transferred');

        if (order.mode === 'gateway' && order.gatewayPayUrl) {
            gwBox.classList.remove('hidden');
            persBox.classList.add('hidden');
            btnTransferred.classList.add('hidden');
            document.getElementById('btn-open-gateway-pay').href = order.gatewayPayUrl;
            return;
        }

        gwBox.classList.add('hidden');
        persBox.classList.remove('hidden');
        btnTransferred.classList.remove('hidden');

        const phone = receiver.phone || '';
        const name = receiver.name || 'CHỦ GAME';
        const bankRow = document.getElementById('checkout-receiver-bank-row');
        const bankVal = document.getElementById('checkout-receiver-bank');
        if (bankRow && bankVal) {
            if (order.method === 'bank') {
                bankRow.classList.remove('hidden');
                bankVal.innerText = receiver.bankName || 'Ngân Hàng';
            } else {
                bankRow.classList.add('hidden');
            }
        }
        document.getElementById('checkout-receiver-phone').innerText = phone || '(Quét mã QR ở trên)';
        document.getElementById('checkout-receiver-name').innerText = name;
        document.getElementById('checkout-copy-amount-val').innerText = String(order.amountVnd);
        document.getElementById('checkout-transfer-note').innerText = order.transferNote;

        const qrImg = document.getElementById('checkout-qr-img');
        const qrFallback = document.getElementById('checkout-qr-fallback');
        const btnMomoApp = document.getElementById('btn-open-momo-app');
        const instructions = document.getElementById('checkout-instructions');

        if (order.method === 'momo') {
            if (phone) {
                btnMomoApp.href = `https://nhantien.momo.vn/${encodeURIComponent(phone)}/${order.amountVnd}`;
                btnMomoApp.classList.remove('hidden');
            } else {
                btnMomoApp.classList.add('hidden');
            }

            if (receiver.qrDataUrl) {
                qrImg.src = receiver.qrDataUrl;
                qrImg.classList.remove('hidden');
                qrFallback.classList.add('hidden');
            } else if (phone) {
                // BIN chính thức của Ví MoMo trên VietQR là 971025
                const vietQrUrl = `https://img.vietqr.io/image/971025-${encodeURIComponent(phone)}-compact2.png?amount=${order.amountVnd}&addInfo=${encodeURIComponent(order.transferNote)}&accountName=${encodeURIComponent(name)}`;
                qrImg.src = vietQrUrl;
                qrImg.onerror = () => {
                    qrImg.classList.add('hidden');
                    qrFallback.classList.remove('hidden');
                };
                qrImg.classList.remove('hidden');
                qrFallback.classList.add('hidden');
            } else {
                qrImg.classList.add('hidden');
                qrFallback.classList.remove('hidden');
            }

            instructions.innerText = 'Quét QR bằng App MoMo/Ngân Hàng hoặc bấm "Mở App MoMo", nhập đúng Lời nhắn/Nội dung mã đơn rồi nhấn "Đã Chuyển Tiền".';
        } else if (order.method === 'bank') {
            btnMomoApp.classList.add('hidden');
            if (receiver.qrDataUrl) {
                qrImg.src = receiver.qrDataUrl;
                qrImg.classList.remove('hidden');
                qrFallback.classList.add('hidden');
            } else {
                qrImg.classList.add('hidden');
                qrFallback.classList.remove('hidden');
                qrFallback.innerText = 'Mở App Ngân Hàng -> Chuyển khoản nhanh 24/7 theo Số Tài Khoản, Số Tiền & Nội dung mã đơn bên dưới:';
            }

            instructions.innerText = 'Chuyển khoản Ngân Hàng đúng số tiền & nội dung mã đơn, sau đó nhấn "Đã Chuyển Tiền" để chủ game xác nhận cộng VND.';
        } else {
            // ZaloPay
            btnMomoApp.classList.add('hidden');
            if (receiver.qrDataUrl) {
                qrImg.src = receiver.qrDataUrl;
                qrImg.classList.remove('hidden');
                qrFallback.classList.add('hidden');
            } else {
                qrImg.classList.add('hidden');
                qrFallback.classList.remove('hidden');
                qrFallback.innerText = 'Mở App ZaloPay -> Chọn Chuyển Tiền -> Nhập SĐT ví nhận, Số tiền & Lời nhắn mã đơn bên dưới:';
            }

            instructions.innerText = 'Mở ZaloPay -> Quét QR hoặc Chuyển tiền đến SĐT nhận với đúng số tiền & lời nhắn mã đơn, sau đó nhấn "Đã Chuyển Tiền".';
        }
    }

    async markTransferred() {
        if (!this.currentOrder) return;
        try {
            await this.apiJson('/api/topup/mark-transferred', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: this.currentOrder.id,
                    playerId: this.playerId
                })
            });
            window.adsgramManager.showToast(`Đã gửi báo chuyển khoản đơn ${this.currentOrder.id}! Chờ Chủ game đối chiếu & cộng quà.`, 'success');
            this.showSelectStep();
            this.checkAndClaimApprovedOrders(false);
        } catch (err) {
            window.adsgramManager.showToast(err.message, 'error');
        }
    }

    async checkAndClaimApprovedOrders(showManualFeedback = false) {
        try {
            const data = await this.apiJson(`/api/topup/my-orders?playerId=${encodeURIComponent(this.playerId)}`);
            const orders = data.orders || [];

            let newlyClaimed = 0;
            for (const o of orders) {
                if (o.status === 'approved' && !o.claimed && !this.claimingIds.has(o.id)) {
                    this.claimingIds.add(o.id);
                    try {
                        const claimRes = await this.apiJson('/api/topup/claim', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: o.id, playerId: this.playerId })
                        });
                        if (claimRes.ok && claimRes.rewards) {
                            this.applyTopupRewards(claimRes.rewards);
                            o.claimed = true;
                            newlyClaimed++;
                        }
                    } finally {
                        this.claimingIds.delete(o.id);
                    }
                }
            }

            this.renderMyOrders(orders);
            if (showManualFeedback && newlyClaimed === 0) {
                const pending = orders.some(o => o.status === 'pending_review');
                window.adsgramManager.showToast(
                    pending ? 'Đơn của bạn đang chờ Chủ game xác nhận nhận tiền!' : 'Chưa có đơn mới được duyệt.',
                    'info'
                );
            }
        } catch (err) {
            if (showManualFeedback) {
                window.adsgramManager.showToast('Không kiểm tra được trạng thái đơn nạp.', 'error');
            }
        }
    }

    applyTopupRewards(rewards) {
        if (!window.game || !window.game.data) return;
        const g = window.game;

        const vndAdded = Number(rewards.vnd || 0);
        g.data.vnd += vndAdded;
        if (Number(rewards.gold || 0) > 0) g.data.gold += Number(rewards.gold || 0);
        if (Number(rewards.diamonds || 0) > 0) g.data.diamonds += Number(rewards.diamonds || 0);

        g.save();
        g.renderAll();
        window.sound && window.sound.playFanfare();
        window.adsgramManager.showToast(
            `🎉 Nạp thành công ${rewards.packName}! +${vndAdded.toLocaleString()}đ VND Chợ!`,
            'success'
        );
    }

    renderMyOrders(orders) {
        const container = document.getElementById('topup-my-orders');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-400 py-2 text-[10.5px]">Bạn chưa có giao dịch nạp tiền nào.</div>`;
            return;
        }

        const badgeMap = {
            awaiting_payment: '<span class="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-black">Chờ thanh toán</span>',
            pending_review: '<span class="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[9px] font-black">⏳ Chờ duyệt</span>',
            approved: '<span class="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[9px] font-black">✅ Đã cộng VND</span>',
            rejected: '<span class="px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded text-[9px] font-black">❌ Từ chối</span>'
        };

        container.innerHTML = orders.map(o => `
            <div class="bg-white rounded-xl p-2 border border-slate-200 flex justify-between items-center text-[10.5px]">
                <div>
                    <div class="font-black text-slate-800">${this.escapeHtml(o.id)} • ${this.getMethodLabel(o.method)}</div>
                    <div class="text-[9.5px] text-slate-500">${this.escapeHtml(o.packName)} (${Number(o.amountVnd).toLocaleString()}đ ➔ +${Number(o.vndReward || 0).toLocaleString()}đ)</div>
                </div>
                <div class="text-right">
                    ${badgeMap[o.status] || o.status}
                    ${o.rejectReason ? `<div class="text-[9px] text-rose-600 mt-0.5">${this.escapeHtml(o.rejectReason)}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    // =====================================================
    // ADMIN QUẢN TRỊ VÍ & DUYỆT ĐƠN NẠP CHO CHỦ GAME
    // =====================================================
    openAdminModal() {
        document.getElementById('modal-admin-topup').classList.remove('hidden');
        if (this.adminToken || this.adminPin) {
            this.loadAdminDashboard();
        } else {
            document.getElementById('admin-auth-box').classList.remove('hidden');
            document.getElementById('admin-dashboard-box').classList.add('hidden');
            document.getElementById('admin-pin-input').value = '';
        }
    }

    async adminLogin() {
        const pin = document.getElementById('admin-pin-input').value.trim();
        if (!pin) {
            window.adsgramManager.showToast('Vui lòng nhập mã PIN!', 'warning');
            return;
        }
        try {
            const res = await this.apiJson('/api/admin/login', {
                method: 'POST',
                headers: this.getAdminHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ pin })
            });
            this.adminToken = res.adminToken || '';
            this.adminPin = '';
            if (this.adminToken) {
                sessionStorage.setItem('lucky_farm_admin_token', this.adminToken);
            }
            if (window.game && typeof window.game.setOwnerAdminState === 'function') {
                window.game.setOwnerAdminState(true);
            }
            await this.loadAdminDashboard();
        } catch (err) {
            this.adminToken = '';
            this.adminPin = '';
            sessionStorage.removeItem('lucky_farm_admin_token');
            window.adsgramManager.showToast(err.message || 'Sai mã PIN Quản Trị!', 'error');
        }
    }

    async bindOwnerAccount() {
        try {
            const res = await this.apiJson('/api/admin/bind-owner', {
                method: 'POST',
                headers: this.getAdminHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({})
            });
            if (window.game && typeof window.game.setOwnerAdminState === 'function') {
                window.game.setOwnerAdminState(true);
            }
            window.adsgramManager.showToast(`👑 Đã khóa quyền Chủ Game cho tài khoản @${res.ownerUsername}!`, 'success');
            await this.loadAdminDashboard();
        } catch (err) {
            window.adsgramManager.showToast(err.message || 'Không thể gắn tài khoản chủ.', 'error');
        }
    }

    switchAdminTab(tabName) {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            const active = btn.getAttribute('data-admin-tab') === tabName;
            btn.classList.toggle('bg-white', active);
            btn.classList.toggle('text-slate-900', active);
            btn.classList.toggle('shadow-sm', active);
            btn.classList.toggle('text-slate-600', !active);
        });
        document.getElementById('admin-tab-orders').classList.toggle('hidden', tabName !== 'orders');
        document.getElementById('admin-tab-config').classList.toggle('hidden', tabName !== 'config');
    }

    async loadAdminDashboard() {
        try {
            const data = await this.apiJson('/api/admin/dashboard', {
                headers: this.getAdminHeaders()
            });

            document.getElementById('admin-auth-box').classList.add('hidden');
            document.getElementById('admin-dashboard-box').classList.remove('hidden');
            document.getElementById('admin-pin-warning').classList.toggle('hidden', !data.config.usingDefaultPin);

            document.getElementById('admin-stat-revenue').innerText = `${Number(data.stats.totalRevenueVnd).toLocaleString()}đ`;
            document.getElementById('admin-stat-pending').innerText = `${data.stats.pendingCount} đơn`;
            document.getElementById('admin-stat-approved').innerText = `${data.stats.approvedCount} đơn`;

            const mt = data.marketTreasury || {};
            const elFee = document.getElementById('admin-stat-market-fee');
            const elVol = document.getElementById('admin-stat-market-volume');
            const elTrd = document.getElementById('admin-stat-market-trades');
            if (elFee) elFee.innerText = `${Number(mt.totalFeeVnd || 0).toLocaleString()}đ`;
            if (elVol) elVol.innerText = `${Number(mt.totalVolumeVnd || 0).toLocaleString()}đ`;
            if (elTrd) elTrd.innerText = Number(mt.totalTrades || 0).toLocaleString();

            this.fillAdminConfigForm(data.config);
            this.renderAdminOrders(data.topups || []);
            return true;
        } catch (err) {
            this.adminToken = '';
            this.adminPin = '';
            sessionStorage.removeItem('lucky_farm_admin_token');
            document.getElementById('admin-auth-box').classList.remove('hidden');
            document.getElementById('admin-dashboard-box').classList.add('hidden');
            window.adsgramManager.showToast(err.message || 'Phiên quản trị hết hạn, vui lòng nhập mã PIN!', 'error');
            return false;
        }
    }

    fillAdminConfigForm(cfg) {
        const m = cfg.momo || {};
        const z = cfg.zalopay || {};
        const b = cfg.bank || {};

        document.getElementById('admin-momo-phone').value = m.phone || '';
        document.getElementById('admin-momo-name').value = m.name || '';
        this.tempMomoQr = m.qrDataUrl || '';
        const momoPrev = document.getElementById('admin-momo-qr-preview');
        const momoClear = document.getElementById('btn-clear-momo-qr');
        if (this.tempMomoQr) {
            momoPrev.src = this.tempMomoQr;
            momoPrev.classList.remove('hidden');
            momoClear.classList.remove('hidden');
        } else {
            momoPrev.classList.add('hidden');
            momoClear.classList.add('hidden');
        }

        document.getElementById('admin-zalopay-phone').value = z.phone || '';
        document.getElementById('admin-zalopay-name').value = z.name || '';
        this.tempZaloQr = z.qrDataUrl || '';
        const zaloPrev = document.getElementById('admin-zalopay-qr-preview');
        const zaloClear = document.getElementById('btn-clear-zalopay-qr');
        if (this.tempZaloQr) {
            zaloPrev.src = this.tempZaloQr;
            zaloPrev.classList.remove('hidden');
            zaloClear.classList.remove('hidden');
        } else {
            zaloPrev.classList.add('hidden');
            zaloClear.classList.add('hidden');
        }

        const bankNameInput = document.getElementById('admin-bank-bankname');
        const bankPhoneInput = document.getElementById('admin-bank-phone');
        const bankOwnerInput = document.getElementById('admin-bank-name');
        if (bankNameInput) bankNameInput.value = b.bankName || '';
        if (bankPhoneInput) bankPhoneInput.value = b.phone || '';
        if (bankOwnerInput) bankOwnerInput.value = b.name || '';
        this.tempBankQr = b.qrDataUrl || '';
        const bankPrev = document.getElementById('admin-bank-qr-preview');
        const bankClear = document.getElementById('btn-clear-bank-qr');
        if (bankPrev && bankClear) {
            if (this.tempBankQr) {
                bankPrev.src = this.tempBankQr;
                bankPrev.classList.remove('hidden');
                bankClear.classList.remove('hidden');
            } else {
                bankPrev.classList.add('hidden');
                bankClear.classList.add('hidden');
            }
        }

        const ownerBadge = document.getElementById('admin-owner-account-badge');
        if (ownerBadge) {
            ownerBadge.innerText = cfg.ownerUsername
                ? `Chủ sở hữu: @${cfg.ownerUsername}`
                : 'Chủ sở hữu: Chưa gắn tài khoản';
        }

        document.getElementById('admin-public-url').value = cfg.publicBaseUrl || '';
        document.getElementById('admin-momo-gw-enabled').checked = !!m.gatewayEnabled;
        document.getElementById('admin-momo-sandbox').checked = m.sandbox !== false;
        document.getElementById('admin-momo-partner').value = m.partnerCode || '';
        document.getElementById('admin-momo-access').value = m.accessKey || '';
        document.getElementById('admin-momo-secret').value = m.secretKey || '';

        document.getElementById('admin-zalopay-gw-enabled').checked = !!z.gatewayEnabled;
        document.getElementById('admin-zalopay-sandbox').checked = z.sandbox !== false;
        document.getElementById('admin-zalopay-appid').value = z.appId || '';
        document.getElementById('admin-zalopay-key1').value = z.key1 || '';
        document.getElementById('admin-zalopay-key2').value = z.key2 || '';
    }

    async saveAdminConfig() {
        const oldPinEl = document.getElementById('admin-old-pin');
        const newPinEl = document.getElementById('admin-new-pin');
        const confirmPinEl = document.getElementById('admin-confirm-new-pin');

        const oldPin = oldPinEl ? oldPinEl.value.trim() : '';
        const newPin = newPinEl ? newPinEl.value.trim() : '';
        const confirmPin = confirmPinEl ? confirmPinEl.value.trim() : '';

        if (oldPin || newPin || confirmPin) {
            if (!oldPin) {
                window.adsgramManager.showToast('Bắt buộc nhập Mã PIN cũ hiện tại để đổi PIN mới!', 'warning');
                return;
            }
            if (!newPin || newPin.length < 4) {
                window.adsgramManager.showToast('Mã PIN mới phải có ít nhất 4 ký tự!', 'warning');
                return;
            }
            if (newPin !== confirmPin) {
                window.adsgramManager.showToast('Xác nhận Mã PIN mới lần 2 không khớp! Vui lòng nhập lại.', 'error');
                return;
            }
        }

        const payload = {
            oldAdminPin: oldPin || undefined,
            newAdminPin: newPin || undefined,
            confirmNewAdminPin: confirmPin || undefined,
            publicBaseUrl: document.getElementById('admin-public-url').value.trim(),
            momo: {
                phone: document.getElementById('admin-momo-phone').value.trim(),
                name: document.getElementById('admin-momo-name').value.trim(),
                qrDataUrl: this.tempMomoQr,
                gatewayEnabled: document.getElementById('admin-momo-gw-enabled').checked,
                sandbox: document.getElementById('admin-momo-sandbox').checked,
                partnerCode: document.getElementById('admin-momo-partner').value.trim(),
                accessKey: document.getElementById('admin-momo-access').value.trim(),
                secretKey: document.getElementById('admin-momo-secret').value.trim()
            },
            zalopay: {
                phone: document.getElementById('admin-zalopay-phone').value.trim(),
                name: document.getElementById('admin-zalopay-name').value.trim(),
                qrDataUrl: this.tempZaloQr,
                gatewayEnabled: document.getElementById('admin-zalopay-gw-enabled').checked,
                sandbox: document.getElementById('admin-zalopay-sandbox').checked,
                appId: document.getElementById('admin-zalopay-appid').value.trim(),
                key1: document.getElementById('admin-zalopay-key1').value.trim(),
                key2: document.getElementById('admin-zalopay-key2').value.trim()
            },
            bank: {
                bankName: (document.getElementById('admin-bank-bankname')?.value || '').trim(),
                phone: (document.getElementById('admin-bank-phone')?.value || '').trim(),
                name: (document.getElementById('admin-bank-name')?.value || '').trim(),
                qrDataUrl: this.tempBankQr
            }
        };

        try {
            await this.apiJson('/api/admin/config', {
                method: 'POST',
                headers: this.getAdminHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(payload)
            });

            if (oldPinEl) oldPinEl.value = '';
            if (newPinEl) newPinEl.value = '';
            if (confirmPinEl) confirmPinEl.value = '';

            window.adsgramManager.showToast('💾 Đã lưu cấu hình thành công!', 'success');
            await this.loadAdminDashboard();
            await this.loadPublicInfo();
        } catch (err) {
            window.adsgramManager.showToast('Lỗi lưu cấu hình: ' + err.message, 'error');
        }
    }

    renderAdminOrders(orders) {
        const container = document.getElementById('admin-orders-list');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = `<div class="text-center py-6 text-slate-400">Chưa có đơn nạp tiền nào từ người chơi.</div>`;
            return;
        }

        container.innerHTML = orders.map(o => {
            const canApprove = o.status === 'pending_review' || o.status === 'awaiting_payment';
            const statusText = o.status === 'pending_review'
                ? '<span class="text-amber-700 font-black">⏳ Khách báo đã CK</span>'
                : (o.status === 'approved'
                    ? (o.claimed ? '<span class="text-emerald-700 font-black">✅ Đã duyệt & nhận quà</span>' : '<span class="text-sky-700 font-black">✅ Đã duyệt (chờ nhận)</span>')
                    : (o.status === 'rejected' ? '<span class="text-rose-600 font-black">❌ Từ chối</span>' : '<span class="text-slate-500 font-bold">Chưa chuyển</span>'));

            return `
                <div class="bg-slate-50 border ${o.status === 'pending_review' ? 'border-amber-400 bg-amber-50/70' : 'border-slate-200'} rounded-2xl p-2.5 space-y-1.5">
                    <div class="flex justify-between items-start gap-2">
                        <div>
                            <div class="font-black text-slate-900">${this.escapeHtml(o.id)} • <span class="text-rose-600">${Number(o.amountVnd).toLocaleString()}đ</span></div>
                            <div class="text-[10px] text-slate-600">
                                Khách: <b>${this.escapeHtml(o.playerName)}</b> • Kênh: <b>${this.getMethodLabel(o.method)}</b>
                            </div>
                            <div class="text-[10px] text-slate-500">Gói: ${this.escapeHtml(o.packName)} (+${Number(o.vndReward || 0).toLocaleString()}đ VND)</div>
                        </div>
                        <div class="text-right text-[10px]">
                            ${statusText}
                            <div class="text-[9px] text-slate-400 mt-0.5">${new Date(o.createdAt).toLocaleTimeString('vi-VN')}</div>
                        </div>
                    </div>
                    ${canApprove ? `
                        <div class="flex gap-1.5 pt-1">
                            <button class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10.5px] active:scale-95" onclick="window.paymentManager.adminApproveOrder('${this.escapeHtml(o.id)}')">
                                ✅ Duyệt Cộng Quà
                            </button>
                            <button class="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black rounded-xl text-[10.5px] active:scale-95" onclick="window.paymentManager.adminRejectOrder('${this.escapeHtml(o.id)}')">
                                ❌ Từ chối
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    async adminApproveOrder(orderId) {
        try {
            await this.apiJson('/api/admin/topup/approve', {
                method: 'POST',
                headers: this.getAdminHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ orderId })
            });
            window.adsgramManager.showToast(`✅ Đã duyệt đơn ${orderId}! Quà sẽ được cộng cho người chơi.`, 'success');
            await this.loadAdminDashboard();
            await this.checkAndClaimApprovedOrders(false);
        } catch (err) {
            window.adsgramManager.showToast(err.message, 'error');
        }
    }

    async adminRejectOrder(orderId) {
        try {
            await this.apiJson('/api/admin/topup/reject', {
                method: 'POST',
                headers: this.getAdminHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ orderId, reason: 'Chưa nhận được giao dịch khớp mã đơn' })
            });
            window.adsgramManager.showToast(`Đã từ chối đơn ${orderId}.`, 'warning');
            await this.loadAdminDashboard();
        } catch (err) {
            window.adsgramManager.showToast(err.message, 'error');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.paymentManager = new PaymentManager();
});
