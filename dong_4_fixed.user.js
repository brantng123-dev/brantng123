// ==UserScript==
// @name         HK Ticketing Auto Helper (Fixed - v9.1.0)
// @namespace    https://local.hkticketing.helper
// @version      9.1.0
// @description  結帳遇庫存不足瞬間秒退重載選票頁、正常分配時自動勾選條款點分配、進入0%立即永久鎖定 [已修復10大漏洞]
// @match        *://*.hkticketing.com/*
// @match        *://*/*hkticketing*/*
// @match        *://shows.hkticketing.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async function () {
  'use strict';

  // ===== 設定 =====
  const CONFIG = {
    TARGET_QTY: 'MAX',
    MIN_QTY: 1,
    PRIVILEGE_CODE: '486330',
    ALLOW_RV: true,
    PREFER_MAX: true,
    MAX_RETRIES: 3,
    TIMEOUT_MS: 3000
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let orderConfirmed = false;
  let retryCount = 0;

  // ===== [修復] 穿透式原生點擊 =====
  function robustClick(el) {
    if (!el || orderConfirmed) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;

    el.scrollIntoView({ block: 'nearest' });
    const opts = {
      bubbles: true, cancelable: true, view: window,
      clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2
    };
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(t => {
      el.dispatchEvent(new MouseEvent(t, opts));
    });
    if (typeof el.click === 'function') {
      el.click();
    }
    return true;
  }

  // ===== [修復] 改進的按鈕查找 - 處理空格和可見性 =====
  function findBtn(text) {
    return [...document.querySelectorAll('button, .van-button, .bui-btn, .mz-button, [role="button"], a, div[class*="btn"]')].find(b => {
      if (b.closest('#hk-helper-hud') || b.closest('.van-stepper')) return false;

      const t = b.textContent.replace(/\s+/g, ' ').trim();
      const rect = b.getBoundingClientRect();
      const style = getComputedStyle(b);

      return t.includes(text) &&
             rect.width > 0 && rect.height > 0 &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0' &&
             !b.disabled &&
             !/disable/i.test(b.className);
    });
  }

  function getNextBtn() {
    return [...document.querySelectorAll('button.mz-button, button.bui-btn, button, [role="button"]')].find(b => {
      if (b.closest('#hk-helper-hud') || b.closest('.van-stepper')) return false;
      const t = b.textContent.trim();
      const rect = b.getBoundingClientRect();
      return (t === '下一步' || t.includes('下一步')) && rect.width > 0 && !b.disabled && !/disable/i.test(b.className);
    }) || findBtn('下一步') || findBtn('立即購買') || findBtn('立即購票');
  }

  let lastMsg = '';
  function notify(msg, color = '#0a7d32') {
    if (lastMsg !== msg) {
      document.title = '🎫 ' + msg;
      lastMsg = msg;

      let hud = document.getElementById('hk-helper-hud');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'hk-helper-hud';
        hud.style.cssText = 'position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:9999999;background:#ffe600;color:#111;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.25);pointer-events:none;text-align:center;font-family:sans-serif;max-width:90vw;word-break:break-word;';
        document.body.appendChild(hud);
      }
      hud.style.background = color;
      hud.style.color = (color === '#ffe600') ? '#111' : '#fff';
      hud.innerHTML = `<div>HK - TICKETING</div><div style="font-size:11px;font-weight:normal;">${msg}</div>`;
    }
  }

  async function waitFor(conditionFn, timeoutMs = 2000, interval = 40) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (orderConfirmed) return false;
      if (conditionFn()) return true;
      await sleep(interval);
    }
    return false;
  }

  function isUnderCheckoutProtection() {
    const text = document.body ? document.body.textContent : '';
    const url = document.URL.toLowerCase();
    return (
      text.includes('訂單費用') ||
      text.includes('取票方式') ||
      text.includes('座位待分配') ||
      text.includes('座位分配即將完成') ||
      text.includes('待付款') ||
      text.includes('訂單編號') ||
      url.includes('checkout') ||
      url.includes('order') ||
      url.includes('pay')
    );
  }

  // ===== [修復] 票價順位權重 - 改進正則表達式 =====
  function getTierRank(text, price, isRV) {
    if (!CONFIG.ALLOW_RV && isRV) return 9999;

    if (price === 3099) return 1;
    if (price === 2399) return 2;
    if (price === 2099 && !isRV && text.includes('看台')) return 3;
    if (price === 2699) return 4;
    if (price === 2099 && !isRV && (text.includes('地面') || text.includes('內場'))) return 5;
    if (price === 1299 && !isRV) return 6;
    if (price === 899 && !isRV) return 7;
    if (price === 1899 && !isRV) return 8;

    if (price === 2099 && isRV) return 9;
    if (price === 699 && !isRV) return 10;
    if (price === 899 && isRV) return 11;
    if (price === 1699) return 12;

    return 9999;
  }

  function getDistinctSessions() {
    const all = [...document.querySelectorAll('div, button, a')].filter(el => {
      if (el.closest('#hk-helper-hud')) return false;
      const t = el.textContent.trim();
      const rect = el.getBoundingClientRect();
      const hasDate = /\d{4}年\d{1,2}月\d{1,2}日|\d{1,2}月\d{1,2}日/.test(t);
      return hasDate && rect.width > 20 && rect.height > 15 && t.length < 50;
    });

    const outermost = all.filter(el => !all.some(parent => parent !== el && parent.contains(el)));
    const uniqueMap = new Map();
    for (const el of outermost) {
      const cleanText = el.textContent.trim().replace(/\s+/g, ' ');
      if (!uniqueMap.has(cleanText)) {
        uniqueMap.set(cleanText, el);
      }
    }
    return Array.from(uniqueMap.values());
  }

  // ===== [修復] 全域攔截 - 改進錯誤檢查 =====
  async function handleBusyOrError() {
    if (orderConfirmed) return false;

    const text = document.body.textContent;
    const isQueueing = text.includes('您正在排隊中') || text.includes('排隊中');
    const hasModal = document.querySelector('[role="dialog"], .van-dialog, .van-popup');

    if (isQueueing && !hasModal && !text.includes('未能即時處理')) {
      return false;
    }

    if (
      text.includes('非常繁忙') ||
      text.includes('未能即時處理') ||
      text.includes('請重新嘗試') ||
      text.includes('已超時') ||
      text.includes('逾時')
    ) {
      notify('遭遇繁忙阻斷，自動重試中...', '#d32f2f');

      const btn = [...document.querySelectorAll('button, a, div, span, .van-button, [role="button"], [class*="btn"]')].find(b => {
        if (b.closest('#hk-helper-hud')) return false;
        const t = b.textContent.trim();
        return (
          t === '刷新' ||
          t === '刷新頁面' ||
          t.includes('重新嘗試') ||
          t === '重試' ||
          t === '確定' ||
          t === '確認'
        ) && b.getBoundingClientRect().width > 0;
      });

      if (btn) {
        robustClick(btn);
        await sleep(Math.floor(Math.random() * 201) + 1000);
        return true;
      }
    }
    return false;
  }

  // ===== 階段 0：首頁條款 =====
  async function step0_StartPage() {
    notify('確認條款/進入節目首頁', '#1976d2');
    const okBtn = findBtn('知悉並同意') || findBtn('同意') || findBtn('確認');
    if (okBtn) { robustClick(okBtn); await sleep(100); }

    const buyBtn = findBtn('立即購票') || findBtn('立即購買') || findBtn('顯示價格');
    if (buyBtn) { robustClick(buyBtn); await sleep(150); }
  }

  // ===== 階段 1：購票碼 =====
  async function step1_PrivilegeCode() {
    notify('輸入優先購票碼', '#1976d2');
    const input = document.querySelector('input[name="privilegeCode"]') ||
                  document.querySelector('.van-dialog input, [role="dialog"] input, input[type="text"], input[type="tel"]');

    if (input && input.getBoundingClientRect().width > 0) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, CONFIG.PRIVILEGE_CODE);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(100);

      const confirmBtn = findBtn('確定') || findBtn('確認');
      if (confirmBtn) { robustClick(confirmBtn); await sleep(300); }
    }
  }

  // ===== 階段 2：排隊 =====
  async function step2_Queueing() {
    notify('排隊中，靜默保持連線...', '#e68a00');
    await sleep(400);
  }

  // ===== [修復] 使用 Map 替代 WeakMap =====
  const skippedMap = new Map();

  function markSkipped(el) {
    if (!el) return;
    if (!el.id) el.id = `tier-${Date.now()}-${Math.random()}`;
    skippedMap.set(el.id, Date.now() + 6000);
  }

  function isSkipped(el) {
    if (!el || !el.id) return false;
    const time = skippedMap.get(el.id);
    if (!time) return false;
    if (Date.now() > time) {
      skippedMap.delete(el.id);
      return false;
    }
    return true;
  }

  // ===== 階段 3：選票與數量控制 =====
  async function step3_Ticketing() {
    let pollCount = 0;

    while (!orderConfirmed) {
      if (isUnderCheckoutProtection()) {
        return;
      }

      const rawTierEls = [...document.querySelectorAll('[class*="levelItem"]')];
      const now = Date.now();

      const allDetectedPrices = [];
      const parsedTiers = rawTierEls.map(el => {
        const text = el.textContent;
        // [修復] 改進價格解析 - 處理多種格式
        const m = text.match(/HK[\$￥\s]+?([\d,]+(?:\.\d{2})?)/);
        const price = m ? parseFloat(m[1].replace(/,/g, '')) : 0;
        const isRV = text.includes('視線受阻') || text.includes('受阻');
        const rank = getTierRank(text, price, isRV);

        if (price > 0) allDetectedPrices.push(price);

        const isCooldown = isSkipped(el);
        const disabled = /disableClass|disabled|sold/i.test(el.className) ||
                         text.includes('暫無可售') ||
                         rank >= 9999 ||
                         isCooldown;
        return { el, price, disabled, rank, text };
      });

      const tiers = parsedTiers.filter(t => t.price > 0 && t.rank < 9999).sort((a, b) => a.rank - b.rank);
      const distinctSessions = getDistinctSessions();
      let targetTier = tiers.find(t => !t.disabled);

      if (!targetTier) {
        if (isUnderCheckoutProtection()) return;

        pollCount++;
        if (distinctSessions.length > 1) {
          notify(`多場次輪詢回流票 (${pollCount})...`, '#e68a00');
          const delay = pollCount === 1 ? 100 : Math.floor(Math.random() * 301) + 700;
          const nextIdx = pollCount % distinctSessions.length;
          robustClick(distinctSessions[nextIdx]);
          await sleep(delay);
        } else {
          if (pollCount === 1 && distinctSessions.length === 1) {
            notify('單場次點擊重整 (1/2)...', '#e68a00');
            robustClick(distinctSessions[0]);
            await sleep(500);
          } else {
            notify('🔄 單場次無足額，正在刷新網頁 (Reload)...', '#d32f2f');
            await sleep(400);
            if (!isUnderCheckoutProtection()) {
              window.location.reload();
            }
            return;
          }
        }
        continue;
      }

      pollCount = 0;
      notify(`選定順位 ${targetTier.rank}: ${targetTier.price} 元...`, '#0a7d32');

      const hasSelectedBadge = /active|selected|checked/i.test(targetTier.el.className);
      const isZero = document.body.textContent.includes('HK$ 0.00');
      if (!hasSelectedBadge || isZero) {
        robustClick(targetTier.el);
      }

      await waitFor(() => document.querySelector('[class*="buyNum"], [class*="stepper"], .van-stepper'), 500, 30);
      if (isUnderCheckoutProtection()) return;

      const stepper = document.querySelector('[class*="buyNum"], [class*="stepper"], .van-stepper');
      if (stepper) {
        const plusBtn = stepper.querySelector('.van-stepper__plus, [class*="plus"]') ||
                        [...stepper.querySelectorAll('button, div, span, i')].find(el => el.textContent.trim() === '+') ||
                        stepper.querySelector('button:last-of-type') ||
                        stepper.lastElementChild;

        const input = stepper.querySelector('input');

        // [修復] 改進數量檢測 - 更精確 =====
        function getCurrQty() {
          if (input?.value) {
            const v = parseInt(input.value, 10);
            if (!isNaN(v) && v > 0) return v;
          }
          const textNums = [...stepper.querySelectorAll('*')]
            .map(e => e.textContent.trim())
            .filter(t => /^\d+$/.test(t))
            .map(Number)
            .filter(n => 1 <= n && n <= 4);
          return textNums.length > 0 ? textNums[0] : 1;
        }

        let pressAttempts = 0;
        while (pressAttempts < 6) {
          if (isUnderCheckoutProtection()) return;
          const isPlusDisabled = plusBtn && (plusBtn.disabled || /disable/i.test(plusBtn.className) || plusBtn.getAttribute('aria-disabled') === 'true');
          if (isPlusDisabled) break;

          const currentVal = getCurrQty();
          if (CONFIG.TARGET_QTY !== 'MAX' && currentVal >= CONFIG.TARGET_QTY) break;

          if (plusBtn) robustClick(plusBtn);
          pressAttempts++;
          await sleep(120);
        }

        const finalQty = getCurrQty();

        if (finalQty < CONFIG.MIN_QTY) {
          notify(`僅釋出 ${finalQty} 張（不足保底 ${CONFIG.MIN_QTY} 張），標記跳過重選...`, '#e68a00');
          markSkipped(targetTier.el);

          if (distinctSessions.length > 0) {
            robustClick(distinctSessions[0]);
          }
          await sleep(100);
          continue;
        }

        notify(`已鎖定 ${finalQty} 張票，立即前往下一步！`, '#0a7d32');

        for (let wait = 0; wait < 6; wait++) {
          if (isUnderCheckoutProtection()) return;

          const nextBtn = getNextBtn();
          if (nextBtn) robustClick(nextBtn);

          await sleep(250);

          if (isUnderCheckoutProtection()) {
            return;
          }
        }
        return;
      } else {
        await sleep(100);
      }
    }
  }

  // ===== [修復] 改進的條款檢查 =====
  function isTermsChecked() {
    const chk = document.querySelector('input[type="checkbox"]:checked');
    if (chk) return true;

    const active = document.querySelector(
      '.van-checkbox--checked:not(.van-checkbox--unchecked), ' +
      '.van-icon-success, ' +
      'input[type="checkbox"][aria-checked="true"]'
    );
    return !!active;
  }

  // ===== [修復] 改進的庫存檢查 - 只看對話框 =====
  const checkOutOfStock = () => {
    const modal = document.querySelector('[role="dialog"], .van-dialog, .van-popup');
    if (!modal) return false;
    const text = modal.textContent || '';
    return text.includes('庫存不足') || text.includes('所選票品目前庫存不足');
  };

  // ===== 階段 4：結帳頁面（核心：庫存不足秒退重載） =====
  async function step4_Checkout() {
    if (checkOutOfStock()) {
      notify('庫存已被搶走，秒退並重新載入選票頁...', '#e68a00');
      const retBtn = [...document.querySelectorAll('button, a, div, span, .van-button, [class*="btn"]')].find(b =>
        !b.closest('#hk-helper-hud') &&
        (b.textContent.includes('返回重新選') || b.textContent.includes('重新選擇') || b.textContent.includes('返回')) &&
        b.getBoundingClientRect().width > 0
      );

      if (retBtn) {
        robustClick(retBtn);
      } else if (window.history.length > 1) {
        window.history.back();
      }
      await sleep(200);
      return;
    }

    notify('進入訂單確認頁，正在勾選條款並分配座位...', '#d32f2f');

    for (let i = 0; i < 12; i++) {
      if (checkOutOfStock()) return;
      if (isTermsChecked()) {
        notify('✓ 條款已確認勾選', '#0a7d32');
        break;
      }

      const chk = document.querySelector('input[type="checkbox"]:not(:checked)');
      const circle = document.querySelector('.van-icon-circle, [class*="agreementIcon"], [class*="circle"], .van-checkbox__icon');
      const txt = [...document.querySelectorAll('span, div, label, p')].find(el => el.textContent.includes('已閱讀並同意') && el.children.length === 0);

      if (chk) {
        robustClick(chk);
        break;
      } else if (circle) {
        robustClick(circle);
        break;
      } else if (txt) {
        const parent = txt.closest('.van-checkbox, label, div') || txt;
        robustClick(parent);
        break;
      }
      await sleep(35);
    }

    await sleep(60);

    while (!orderConfirmed) {
      if (checkOutOfStock()) {
        notify('庫存已被搶走，秒退重選...', '#e68a00');
        const retBtn = [...document.querySelectorAll('button, a, div, span, .van-button, [class*="btn"]')].find(b =>
          !b.closest('#hk-helper-hud') &&
          (b.textContent.includes('返回重新選') || b.textContent.includes('重新選擇') || b.textContent.includes('返回')) &&
          b.getBoundingClientRect().width > 0
        );
        if (retBtn) robustClick(retBtn);
        else if (window.history.length > 1) window.history.back();
        await sleep(200);
        return;
      }

      const visibleLoading = [...document.querySelectorAll('div, span, p')].find(el => {
        const t = el.textContent.trim();
        const rect = el.getBoundingClientRect();
        return (t.includes('座位分配即將完成') || t.includes('請盡量不要離開目前頁面') || t.includes('待付款')) &&
               rect.width > 0 && rect.height > 0;
      });

      if (visibleLoading || document.body.textContent.includes('訂單編號')) {
        orderConfirmed = true;
        notify('🎉 正在分配座位中 / 產生訂單！腳本已安全鎖定，請等待跳轉付款！', '#0a7d32');
        return;
      }

      const assignBtn = findBtn('分配座位') || findBtn('分配') || findBtn('提交訂單') || findBtn('確認付款');
      if (assignBtn) {
        robustClick(assignBtn);
      }

      const okBtn = [...document.querySelectorAll('button, [class*="btn"]')].find(b =>
        !b.closest('#hk-helper-hud') && (b.textContent.trim() === '確定' || b.textContent.trim() === '確認') && b.closest('[role="dialog"], .van-dialog')
      );
      if (okBtn && okBtn.getBoundingClientRect().width > 0) robustClick(okBtn);

      await sleep(150);
    }
  }

  // ===== 主排程狀態機 =====
  async function mainLoop() {
    while (!orderConfirmed) {
      try {
        const handled = await handleBusyOrError();
        if (handled) {
          await sleep(250);
          continue;
        }

        const activeDialog = document.querySelector('[role="dialog"], .van-dialog, [class*="modal"]');

        if (activeDialog && activeDialog.querySelector('input')) {
          await step1_PrivilegeCode();
        }
        else if (findBtn('立即購票') || findBtn('立即購買') || findBtn('知悉並同意') || findBtn('顯示價格')) {
          await step0_StartPage();
        }
        else if (isUnderCheckoutProtection()) {
          await step4_Checkout();
        }
        else if (document.querySelectorAll('[class*="levelItem"]').length > 0 || getDistinctSessions().length > 0) {
          await step3_Ticketing();
        }
        else {
          await step2_Queueing();
        }
      } catch (err) {
        console.error('[HK Ticketing Helper] Error:', err);
        await sleep(100);
      }

      await sleep(60);
    }
  }

  mainLoop();
})();
