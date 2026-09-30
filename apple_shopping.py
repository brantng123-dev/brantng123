import base64
import html
import json
import os
import random
import re
import string
import subprocess
import sys
import time
import urllib.parse
from urllib.parse import urlparse

from curl_cffi import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_public_key

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BARK_DEVICE_KEY = os.getenv("BARK_DEVICE_KEY", "WbfPe5p4KS4FcCCscyJn66")
DEBUG_MODE = False

PRODUCTS = {
    "MYEX3ZA/A": "iPhone 16 粉紅色",
}

APPLE_STORES_HK = {
    "IFC": "%7BHK%3D%7Bt%3Da%3Bi%3DR428%3B%7D%3B%7D",
    "HYSAN": "%7BHK%3D%7Bt%3Da%3Bi%3DR409%3B%7D%3B%7D",
    "CANTON_ROAD": "%7BHK%3D%7Bt%3Da%3Bi%3DR499%3B%7D%3B%7D",
    "FW": "%7BHK%3D%7Bt%3Da%3Bi%3DR485%3B%7D%3B%7D",
    "NTP": "%7BHK%3D%7Bt%3Da%3Bi%3DR610%3B%7D%3B%7D",
    "APM": "%7BHK%3D%7Bt%3Da%3Bi%3DR673%3B%7D%3B%7D",
}

TARGET_STORE = "IFC"
SELECTED_RTSID = APPLE_STORES_HK[TARGET_STORE]

CONTACT_INFO = {
    "lastName": os.getenv("CONTACT_LAST_NAME", ""),
    "firstName": os.getenv("CONTACT_FIRST_NAME", ""),
    "emailAddress": os.getenv("CONTACT_EMAIL", ""),
    "mobilePhone": os.getenv("CONTACT_PHONE", ""),
}

BILLING_ADDRESS_INFO = {
    "lastName": os.getenv("BILLING_LAST_NAME", os.getenv("CONTACT_LAST_NAME", "")),
    "firstName": os.getenv("BILLING_FIRST_NAME", os.getenv("CONTACT_FIRST_NAME", "")),
    "street": os.getenv("BILLING_STREET", ""),
    "city": os.getenv("BILLING_CITY", "Kowloon"),
    "state": os.getenv("BILLING_STATE", "HK"),
    "postalCode": os.getenv("BILLING_POSTAL_CODE", "000000"),
    "country": os.getenv("BILLING_COUNTRY", "HK"),
}

CREDIT_CARD_INFO = {
    "cardholderName": os.getenv("CC_HOLDER_NAME", ""),
    "cardNumber": os.getenv("CC_NUMBER", ""),
    "expiryMonth": os.getenv("CC_EXPIRY_MONTH", ""),
    "expiryYear": os.getenv("CC_EXPIRY_YEAR", ""),
    "cvv": os.getenv("CC_CVV", ""),
}

TARGET_PRODUCT_URL = "https://www.apple.com/hk-zh/shop/buy-iphone/iphone-16"
BEACON_ATB_URL = "https://www.apple.com/hk-zh/shop/beacon/atb"
BAG_URL = "https://www.apple.com/hk-zh/shop/bag"
BAG_ACTION_URL = "https://www.apple.com/hk-zh/shop/bagx"
CHECKOUT_NOW_URL = "https://www.apple.com/hk-zh/shop/bagx/checkout_now"
CHECKOUT_DEFAULT_HOST = "secure9.store.apple.com"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0"


class AppleKeyManager:
    STATIC_PUBLIC_KEY_B64 = (
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvUIrYPRsCjQNCEGNWmSp9Wz+5uSqK6nkwiBq"
        "254Q5taDOqZz0YGL3s1DnJPuBU+e8Dexm6GKW1kWxptTRtva5Eds8VhlAgph8RqIoKmOpb3uJOhSzBpk"
        "U28uWyi87VIMM2laXTsSGTpGjSdYjCbcYvMtFdvAycfuEuNn05bDZvUQEa+j9t4S0b2iH7/8LxLos/8q"
        "MomJfwuPwVRkE5s5G55FeBQDt/KQIEDvlg1N8omoAjKdfWtmOCK64XZANTG2TMnar/iXyegPwj05m443"
        "AYz8x5Uw/rHBqnpiQ4xg97Ewox+SidebmxGowKfQT3+McmnLYu/JURNlYYRy2lYiMwIDAQAB"
    )
    STATIC_PUBLIC_KEY_HASH = "DsCuZg+6iOaJUKt5gJMdb6rYEz9BgEsdtEXjVc77oAs="

    @staticmethod
    def get_public_key_pem() -> str:
        return f"-----BEGIN PUBLIC KEY-----\n{AppleKeyManager.STATIC_PUBLIC_KEY_B64}\n-----END PUBLIC KEY-----"


class ApplePaymentEncryption:
    @staticmethod
    def encrypt_field(plaintext: str, public_key_pem: str) -> str:
        try:
            public_key = load_pem_public_key(public_key_pem.encode("utf-8"))
            ciphertext = public_key.encrypt(
                plaintext.encode("utf-8"),
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None,
                ),
            )
            ciphertext_b64 = base64.b64encode(ciphertext).decode("utf-8")
            return json.dumps({
                "cipherText": ciphertext_b64,
                "publicKeyHash": AppleKeyManager.STATIC_PUBLIC_KEY_HASH,
            })
        except Exception as e:
            print(f"❌ RSA 加密失敗: {e}")
            return ""


def detect_card_type(card_number: str) -> str:
    if not card_number:
        return "VISA"
    first = card_number[0]
    if first == "4":
        return "VISA"
    elif first == "5":
        return "MASTERCARD"
    elif first == "3":
        return "AMERICAN_EXPRESS"
    return "VISA"


def generate_ui_fetch_header() -> str:
    p1 = "".join(random.choices(string.ascii_lowercase + string.digits, k=10))
    p2 = "".join(random.choices(string.ascii_lowercase + string.digits, k=5))
    return f"{p1}-mulg{p2}"


def get_cookie_snapshot(session: requests.Session) -> dict:
    snapshot = {}
    try:
        if hasattr(session.cookies, "items"):
            for k, v in session.cookies.items():
                snapshot[str(k)] = v.value if hasattr(v, "value") else str(v)
            return snapshot
    except Exception:
        pass
    try:
        for c in session.cookies:
            if hasattr(c, "name") and hasattr(c, "value"):
                snapshot[str(c.name)] = str(c.value)
            elif isinstance(c, str):
                snapshot[c] = str(session.cookies.get(c, ""))
    except Exception:
        pass
    return snapshot


def log_cookie_diff(step_name: str, before_cookies: dict, session: requests.Session) -> dict:
    after_cookies = get_cookie_snapshot(session)
    added = {k: v for k, v in after_cookies.items() if k not in before_cookies}
    removed = {k: v for k, v in before_cookies.items() if k not in after_cookies}
    modified = {
        k: (before_cookies[k], v)
        for k, v in after_cookies.items()
        if k in before_cookies and before_cookies[k] != v
    }

    print(f"\n🍪 Cookie 變化: {step_name}")
    if not added and not modified and not removed:
        print("   ⚪ (無變動)")
    else:
        if added:
            for k in added.keys():
                print(f"   ➕ {k}")
        if modified:
            for k in modified.keys():
                print(f"   🔄 {k}")
        if removed:
            for k in removed.keys():
                print(f"   ❌ {k}")
    return after_cookies


def open_firefox(url: str):
    try:
        if sys.platform == "win32":
            subprocess.Popen(["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "-new-tab", url])
        elif sys.platform == "darwin":
            subprocess.Popen(["/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "-new-tab", url])
        else:
            subprocess.Popen(["microsoft-edge", "-new-tab", url])
        print(f"✅ Edge 已開啟: {url}")
    except Exception as e:
        print(f"⚠️ 無法調用 Edge: {e}")
        import webbrowser
        webbrowser.open(url)


def send_bark_notification(title: str, body: str, target_url: str):
    try:
        import requests as standard_requests
        bark_url = f"https://api.day.app/{BARK_DEVICE_KEY}/"
        payload = {
            "title": title,
            "body": body,
            "url": target_url,
            "sound": "alarm",
            "level": "timeSensitive",
        }
        standard_requests.post(bark_url, json=payload, timeout=5)
        print("📲 Bark 推播發送成功！")
    except Exception as e:
        print(f"⚠️ Bark 發送失敗: {e}")


def get_firefox_cookies_and_token():
    """用 curl 從 beacon/atb API 響應頭中提取 as_atb"""
    print("⏳ 正在從 Apple beacon/atb API 獲取 ATB Token...")
    try:
        cmd = [
            "curl",
            "-i",
            "-s",
            "-H", f"User-Agent: {USER_AGENT}",
            "-H", "Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            BEACON_ATB_URL
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        output = result.stdout + result.stderr

        # 從 Set-Cookie 響應頭中提取 as_atb
        as_atb = ""
        lines = output.split('\n')

        for line in lines:
            if 'as_atb=' in line.lower():
                match = re.search(r'as_atb=([^;]+)', line, re.IGNORECASE)
                if match:
                    as_atb = match.group(1)
                    break

        if as_atb:
            print(f"✅ 成功獲取 as_atb!")

            # 解析 atbtoken
            parts = as_atb.split('|')
            atbtoken = parts[-1] if len(parts) > 1 else as_atb
            print(f"🔑 成功提取 atbtoken")

            cookie_dict = {"as_atb": as_atb}
            return cookie_dict, atbtoken
        else:
            print("❌ 無法從響應頭中提取 as_atb")
            return {}, ""

    except subprocess.TimeoutExpired:
        print(f"❌ curl 請求超時")
        return {}, ""
    except Exception as e:
        print(f"❌ 獲取 ATB 失敗: {e}")
        return {}, ""


def extract_store_code_from_rtsid(rtsid: str) -> str:
    match = re.search(r"i=R(\d+)", urllib.parse.unquote(rtsid))
    return f"R{match.group(1)}" if match else "R428"


def extract_tokens_from_response(resp, default_stk: str, default_actk: str) -> tuple[str, str]:
    new_stk = default_stk
    new_actk = default_actk
    try:
        res_json = resp.json()
        meta_h = res_json.get("body", {}).get("meta", {}).get("h", {})
        if "x-aos-stk" in meta_h:
            new_stk = meta_h["x-aos-stk"]
        if "x-as-actk" in meta_h:
            new_actk = meta_h["x-as-actk"]
    except Exception:
        new_stk = resp.headers.get("x-aos-stk", default_stk)
        new_actk = resp.headers.get("x-as-actk", default_actk)
    return new_stk, new_actk


def execute_auto_submit_form(session: requests.Session, html_text: str, referer: str) -> bool:
    if "<form" not in html_text:
        return True

    action_match = re.search(r'<form[^>]*action=["\']([^"\']+)["\']', html_text)
    if not action_match:
        return False

    action_url = html.unescape(action_match.group(1))
    payload = {}
    input_pattern = r'<input[^>]*type=["\']?hidden["\']?[^>]*name=["\']([^"\']+)["\'][^>]*value=["\']([^"\']*)["\']'
    for match in re.finditer(input_pattern, html_text):
        payload[match.group(1)] = html.unescape(match.group(2))

    parsed = urlparse(action_url)
    host = parsed.netloc

    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": host,
        "Origin": f"https://{host}",
        "Referer": referer,
        "User-Agent": USER_AGENT,
        "Connection": "keep-alive",
    }
    try:
        print(f"🔄 正在自動提交表單...")
        resp = session.post(action_url, headers=headers, data=payload, timeout=15)
        return resp.status_code in [200, 302, 303]
    except Exception as e:
        print(f"⚠️ 自動提交失敗: {e}")
        return False


def trigger_checkout_now(session: requests.Session, html_text: str) -> str:
    uuid_match = re.search(r'id=["\']shoppingCart\.items\.(item-[0-9a-fA-F-]+)\.delete["\']', html_text)
    if not uuid_match:
        uuid_match = re.search(r"shoppingCart\.items\.(item-[0-9a-fA-F-]+)", html_text)
    item_uuid = uuid_match.group(1) if uuid_match else ""

    stk_match = re.search(r'["\']stk["\']\s*:\s*["\']([^"\']+)["\']', html_text)
    if not stk_match:
        stk_match = re.search(r'x-aos-stk["\']?\s*[:=]\s*["\']?([^"\'\s&]+)', html_text)
    cart_stk = stk_match.group(1) if stk_match else ""

    params = {"_a": "checkout", "_m": "shoppingCart.actions"}
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Host": "www.apple.com",
        "Origin": "https://www.apple.com",
        "Referer": BAG_URL,
        "User-Agent": USER_AGENT,
        "X-Requested-With": "Fetch",
        "x-aos-model-page": "cart",
        "x-aos-stk": cart_stk,
        "syntax": "graviton",
        "modelVersion": "v2",
    }
    payload = {
        "shoppingCart.recommendations.recommendeditem.part": "",
        "shoppingCart.bagSavedItems.part": "",
        "shoppingCart.bagSavedItems.itemid": "",
        "shoppingCart.bagSavedItems.listid": "",
        "shoppingCart.bagSavedItems.childPart": "",
        f"shoppingCart.items.{item_uuid}.itemQuantity.quantity": "1",
        "shoppingCart.locationConsent.locationConsent": "false",
        "shoppingCart.summary.promoCode.promoCode": "",
        "shoppingCart.actions.fcscounter": "",
        "shoppingCart.actions.fcsdata": "",
    }

    try:
        before = get_cookie_snapshot(session)
        resp = session.post(CHECKOUT_NOW_URL, params=params, headers=headers, data=payload, timeout=10)
        log_cookie_diff("步驟 1.3: POST checkout_now", before, session)

        if resp.status_code == 200:
            redirect_url = resp.json().get("head", {}).get("data", {}).get("url", "")
            if redirect_url:
                print(f"🎉 成功獲取結帳 URL")
                return redirect_url
    except Exception as e:
        print(f"⚠️ checkout_now 異常: {e}")

    return f"https://{CHECKOUT_DEFAULT_HOST}/hk-zh/shop/checkout?_s=Fulfillment-init"


def extract_tokens_from_checkout_page(session: requests.Session, checkout_url: str) -> tuple[str, str, str]:
    parsed = urlparse(checkout_url)
    checkout_host = parsed.netloc or CHECKOUT_DEFAULT_HOST

    headers = {
        "Host": checkout_host,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Referer": BAG_URL,
        "User-Agent": USER_AGENT,
    }

    try:
        before = get_cookie_snapshot(session)
        resp = session.get(checkout_url, headers=headers, timeout=15)
        log_cookie_diff("步驟 1.4: GET 結帳初始化首頁", before, session)

        stk_match = re.search(r'["\']stk["\']\s*:\s*["\']([^"\']+)["\']', resp.text)
        if not stk_match:
            stk_match = re.search(r'x-aos-stk["\']?\s*[:=]\s*["\']?([^"\'\s&,}]+)', resp.text)
        stk_token = stk_match.group(1) if stk_match else ""

        actk_match = re.search(r'["\']actk["\']\s*:\s*["\']([^"\']+)["\']', resp.text)
        if not actk_match:
            actk_match = re.search(r'x-as-actk["\']?\s*[:=]\s*["\']?([^"\'\s&,}]+)', resp.text)
        actk_token = actk_match.group(1) if actk_match else ""

        if stk_token:
            print(f"✅ 成功提取結帳 STK Token")
        if actk_token:
            print(f"✅ 成功提取結帳 ACTK Token")

        return checkout_host, stk_token, actk_token
    except Exception as e:
        print(f"⚠️ 提取結帳 Tokens 失敗: {e}")
        return checkout_host, "", ""


def clear_cart_if_not_empty(session: requests.Session) -> bool:
    print("\n🔍 正在檢查購物袋現有內容...")
    try:
        before = get_cookie_snapshot(session)
        bag_resp = session.get(
            BAG_URL,
            headers={"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "User-Agent": USER_AGENT},
            timeout=10,
        )
        log_cookie_diff("檢查購物袋 (GET)", before, session)

        raw_uuids = re.findall(r'shoppingCart\.items\.(item-[0-9a-fA-F-]+)', bag_resp.text)
        item_uuids = list(dict.fromkeys(raw_uuids))

        if not item_uuids:
            print("✨ 購物袋目前為空！")
            return True

        print(f"🛒 偵測到 {len(item_uuids)} 件舊商品，準備清空...")
        stk_match = re.search(r'["\']stk["\']\s*:\s*["\']([^"\']+)["\']', bag_resp.text)
        cart_stk = stk_match.group(1) if stk_match else ""

        for idx, item_uuid in enumerate(item_uuids, start=1):
            print(f"🗑️ [{idx}/{len(item_uuids)}] 正在刪除...")
            params = {"_a": "delete", "_m": f"shoppingCart.items.{item_uuid}.delete"}
            headers = {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
                "Connection": "keep-alive",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Host": "www.apple.com",
                "Origin": "https://www.apple.com",
                "Referer": BAG_URL,
                "User-Agent": USER_AGENT,
                "X-Requested-With": "Fetch",
                "x-aos-model-page": "cart",
                "x-aos-stk": cart_stk,
                "syntax": "graviton",
                "modelVersion": "v2",
            }
            payload = {
                f"shoppingCart.items.{item_uuid}.delete": "",
                "shoppingCart.locationConsent.locationConsent": "false",
            }

            del_resp = session.post(BAG_ACTION_URL, params=params, headers=headers, data=payload, timeout=10)
            cart_stk, _ = extract_tokens_from_response(del_resp, cart_stk, "")
            time.sleep(0.3)

        print("🎉 購物袋已清空！")
        return True
    except Exception as e:
        print(f"⚠️ 清空購物袋出錯: {e}")
        return False


def add_product_to_bag(session: requests.Session, p_code: str, atbtoken: str) -> tuple[bool, str, str, str]:
    if not atbtoken:
        print("❌ 缺少 atbtoken！")
        return False, "", "", ""

    params = {
        "product": p_code,
        "purchaseOption": "fullPrice",
        "step": "select",
        "acpart": "none",
        "atbtoken": atbtoken,
        "igt": "true",
        "add-to-cart": "add-to-cart",
    }
    req_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Host": "www.apple.com",
        "Referer": TARGET_PRODUCT_URL,
        "User-Agent": USER_AGENT,
    }

    try:
        print(f"🚀 [步驟 1] 正在加車...")
        before = get_cookie_snapshot(session)
        resp = session.get(TARGET_PRODUCT_URL, params=params, headers=req_headers, allow_redirects=False, timeout=10)
        log_cookie_diff("步驟 1.1: 303 直通加車 (GET)", before, session)

        print(f"   📊 HTTP 狀態碼: {resp.status_code}")
        location = resp.headers.get("Location", "")
        print(f"   📍 Location Header: {location[:100] if location else '(無)'}")
        print(f"   📝 响應長度: {len(resp.text)} 字符")

        if resp.status_code in (301, 302, 303, 307) and ("step=attach" in location or "/shop/bag" in location):
            print("🎉 成功加入購物袋！")
            before_bag = get_cookie_snapshot(session)
            bag_resp = session.get(BAG_URL, headers={"Accept": "text/html,application/xhtml+xml", "User-Agent": USER_AGENT}, timeout=10)
            log_cookie_diff("步驟 1.2: GET 查看購物袋頁面", before_bag, session)

            checkout_url = trigger_checkout_now(session, bag_resp.text)
            checkout_host, stk_token, actk_token = extract_tokens_from_checkout_page(session, checkout_url)
            return True, checkout_url, stk_token, actk_token
        elif resp.status_code == 200:
            print(f"   ⚠️ 獲得 200 回應，可能需要 POST 而非 GET")
        else:
            print(f"   ❌ 非預期的狀態碼: {resp.status_code}")

        return False, "", "", ""
    except Exception as e:
        print(f"❌ 加車出錯: {e}")
        return False, "", "", ""


def switch_to_retail_and_select_store(
    session: requests.Session, checkout_host: str, stk_token: str, actk_token: str, store_code: str
) -> tuple[bool, str, str]:
    if not stk_token:
        return False, "", ""

    print(f"\n🏢 [步驟 2] 正在鎖定門市...")
    target_url = f"https://{checkout_host}/hk-zh/shop/checkoutx/fulfillment"

    params = {
        "_a": "selectFulfillmentLocationAction",
        "_m": "checkout.fulfillment.fulfillmentOptions",
    }
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": checkout_host,
        "Origin": f"https://{checkout_host}",
        "Referer": f"https://{checkout_host}/hk-zh/shop/checkout?_s=Fulfillment-init",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "Fetch",
        "x-aos-model-page": "checkoutPage",
        "x-aos-stk": stk_token,
        "x-as-actk": actk_token,
        "syntax": "graviton",
        "modelVersion": "v2",
        "Connection": "keep-alive",
    }
    payload = {
        "checkout.fulfillment.fulfillmentOptions.selectFulfillmentLocation": "RETAIL",
        "checkout.fulfillment.pickupTab.pickup.storeLocator.showAllStores": "false",
        "checkout.fulfillment.pickupTab.pickup.storeLocator.selectStore": store_code,
        "checkout.fulfillment.pickupTab.pickup.storeLocator.searchInput": "香港",
    }

    try:
        before = get_cookie_snapshot(session)
        resp = session.post(target_url, params=params, headers=headers, data=payload, timeout=20)
        log_cookie_diff("步驟 2A: POST 切換取貨模式與門市", before, session)

        stk_token, actk_token = extract_tokens_from_response(resp, stk_token, actk_token)

        select_params = {
            "_a": "select",
            "_m": "checkout.fulfillment.pickupTab.pickup.storeLocator",
        }
        headers["x-aos-stk"] = stk_token
        headers["x-as-actk"] = actk_token

        resp2 = session.post(target_url, params=select_params, headers=headers, data=payload, timeout=20)
        log_cookie_diff("步驟 2B: POST 鎖定門市", before, session)

        stk_token, actk_token = extract_tokens_from_response(resp2, stk_token, actk_token)
        if resp2.status_code == 200:
            print(f"✅ 成功鎖定門市")
            return True, stk_token, actk_token
        return False, stk_token, actk_token
    except Exception as e:
        print(f"❌ 選擇門市出錯: {e}")
        return False, stk_token, actk_token


def continue_from_fulfillment_to_pickup_contact(
    session: requests.Session, checkout_host: str, stk_token: str, actk_token: str, store_code: str
) -> tuple[bool, str, str, dict]:
    if not stk_token:
        print("❌ 缺少 STK Token")
        return False, stk_token, actk_token, {}

    print(f"\n⚡ [步驟 2.1] 正在推進流程...")
    target_url = f"https://{checkout_host}/hk-zh/shop/checkoutx/fulfillment"
    params = {
        "_a": "continueFromFulfillmentToPickupContact",
        "_m": "checkout.fulfillment",
    }
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": checkout_host,
        "Origin": f"https://{checkout_host}",
        "Referer": f"https://{checkout_host}/hk-zh/shop/checkout?_s=Fulfillment-init",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "Fetch",
        "x-aos-model-page": "checkoutPage",
        "x-aos-stk": stk_token,
        "x-as-actk": actk_token,
        "syntax": "graviton",
        "modelVersion": "v2",
        "Connection": "keep-alive",
    }
    payload = {
        "checkout.fulfillment.fulfillmentOptions.selectFulfillmentLocation": "RETAIL",
        "checkout.fulfillment.pickupTab.pickup.storeLocator.showAllStores": "false",
        "checkout.fulfillment.pickupTab.pickup.storeLocator.selectStore": store_code,
        "checkout.fulfillment.pickupTab.pickup.storeLocator.searchInput": "香港",
    }

    try:
        before = get_cookie_snapshot(session)
        resp = session.post(target_url, params=params, headers=headers, data=payload, timeout=20)
        log_cookie_diff("步驟 2.1: POST 推進流程", before, session)

        stk_token, actk_token = extract_tokens_from_response(resp, stk_token, actk_token)
        if resp.status_code != 200:
            return False, stk_token, actk_token, {}

        res_json = resp.json()
        checkout_data = res_json.get("body", {}).get("checkout", {})
        current_page = checkout_data.get("d", {}).get("page", "Unknown")

        print(f"📊 當前頁面: 【{current_page}】")
        if current_page == "PickupContact":
            print("🎉 成功推進至取貨聯絡人！")
            return True, stk_token, actk_token, res_json
        else:
            return False, stk_token, actk_token, res_json
    except Exception as e:
        print(f"❌ 推進步驟出錯: {e}")
        return False, stk_token, actk_token, {}


def submit_pickup_contact_info(
    session: requests.Session,
    checkout_host: str,
    stk_token: str,
    actk_token: str,
    contact_info: dict,
    ui_header: str,
) -> tuple[bool, str, str]:
    if not stk_token:
        print("❌ STK Token 為空")
        return False, stk_token, actk_token

    print(f"\n👤 [步驟 3] 正在提交取貨聯絡人資訊...")

    target_url = f"https://{checkout_host}/hk-zh/shop/checkoutx"
    params = {
        "_a": "continueFromPickupContactToBilling",
        "_m": "checkout.pickupContact",
    }
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": checkout_host,
        "Origin": f"https://{checkout_host}",
        "Referer": f"https://{checkout_host}/hk-zh/shop/checkout?_s=PickupContact-init",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "Fetch",
        "x-aos-model-page": "checkoutPage",
        "x-aos-stk": stk_token,
        "x-as-actk": actk_token,
        "x-aos-ui-fetch-call-1": ui_header,
        "syntax": "graviton",
        "modelVersion": "v2",
        "Connection": "keep-alive",
    }
    payload = {
        "checkout.pickupContact.selfPickupContact.selfContact.address.lastName": contact_info["lastName"],
        "checkout.pickupContact.selfPickupContact.selfContact.address.firstName": contact_info["firstName"],
        "checkout.pickupContact.selfPickupContact.selfContact.address.emailAddress": contact_info["emailAddress"],
        "checkout.pickupContact.selfPickupContact.selfContact.address.mobilePhone": contact_info["mobilePhone"],
        "checkout.pickupContact.selfPickupContact.selfContact.address.isDaytimePhoneSelected": "false",
    }

    try:
        before = get_cookie_snapshot(session)
        resp = session.post(target_url, params=params, headers=headers, data=payload, timeout=20)
        log_cookie_diff("步驟 3: POST 提交取貨人資訊", before, session)

        stk_token, actk_token = extract_tokens_from_response(resp, stk_token, actk_token)
        if resp.status_code == 200:
            print("✅ 成功提交取貨聯絡人資訊！")
            return True, stk_token, actk_token
        else:
            print(f"⚠️ 提交失敗，狀態碼: {resp.status_code}")
            return False, stk_token, actk_token
    except Exception as e:
        print(f"❌ 提交聯絡資訊出錯: {e}")
        return False, stk_token, actk_token


def select_billing_option(
    session: requests.Session,
    checkout_host: str,
    stk_token: str,
    actk_token: str,
    ui_header: str,
    billing_method: str = "CREDIT",
) -> tuple[bool, str, str]:
    if not stk_token:
        print("❌ STK Token 為空")
        return False, stk_token, actk_token

    print(f"\n💳 [步驟 4] 正在選取計費方式...")
    billing_url = f"https://{checkout_host}/hk-zh/shop/checkoutx/billing"

    params = {
        "_a": "selectBillingOptionAction",
        "_m": "checkout.billing.billingOptions",
    }
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": checkout_host,
        "Origin": f"https://{checkout_host}",
        "Referer": f"https://{checkout_host}/hk-zh/shop/checkout?_s=Billing-init",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "Fetch",
        "x-aos-model-page": "checkoutPage",
        "x-aos-stk": stk_token,
        "x-as-actk": actk_token,
        "x-aos-ui-fetch-call-1": ui_header,
        "syntax": "graviton",
        "modelVersion": "v2",
        "Connection": "keep-alive",
    }
    payload = {
        "checkout.billing.billingOptions.selectBillingOption": billing_method,
        "checkout.billing.billingOptions.selectedBillingOptions.giftCard.giftCardInput.deviceID": '{"op":"DEVICEID"}',
        "checkout.billing.billingOptions.selectedBillingOptions.giftCard.giftCardInput.giftCard": "",
        "checkout.locationConsent.locationConsent": "true",
    }

    try:
        before = get_cookie_snapshot(session)
        resp = session.post(billing_url, params=params, headers=headers, data=payload, timeout=20)
        log_cookie_diff("步驟 4: POST 選擇計費方式", before, session)

        stk_token, actk_token = extract_tokens_from_response(resp, stk_token, actk_token)
        if resp.status_code == 200:
            print(f"✅ 成功選定計費方式!")
            return True, stk_token, actk_token
        else:
            print(f"⚠️ 選擇失敗，狀態碼: {resp.status_code}")
            return False, stk_token, actk_token
    except Exception as e:
        print(f"❌ 選擇計費方式出錯: {e}")
        return False, stk_token, actk_token


def continue_from_billing_to_review(
    session: requests.Session,
    checkout_host: str,
    stk_token: str,
    actk_token: str,
    ui_header: str,
    card_info: dict,
    address_info: dict,
) -> tuple[bool, str, str]:
    if not stk_token:
        print("❌ STK Token 為空")
        return False, stk_token, actk_token

    card_type = detect_card_type(card_info.get("cardNumber", ""))
    print(f"\n🔐 [步驟 5] 正在加密並送出信用卡...")
    print(f"   • 卡別: {card_type}")
    print(f"   • 末四碼: ****{card_info.get('cardNumber', '')[-4:]}")

    pub_key_pem = AppleKeyManager.get_public_key_pem()
    encrypted_card = ApplePaymentEncryption.encrypt_field(card_info.get("cardNumber", ""), pub_key_pem)
    encrypted_cvv = ApplePaymentEncryption.encrypt_field(card_info.get("cvv", ""), pub_key_pem)

    if not encrypted_card or not encrypted_cvv:
        print("❌ 加密失敗！")
        return False, stk_token, actk_token

    billing_url = f"https://{checkout_host}/hk-zh/shop/checkoutx/billing"
    params = {
        "_a": "continueFromBillingToReview",
        "_m": "checkout.billing",
    }
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": checkout_host,
        "Origin": f"https://{checkout_host}",
        "Referer": f"https://{checkout_host}/hk-zh/shop/checkout?_s=Billing-init",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "Fetch",
        "x-aos-model-page": "checkoutPage",
        "x-aos-stk": stk_token,
        "x-as-actk": actk_token,
        "x-aos-ui-fetch-call-1": ui_header,
        "syntax": "graviton",
        "modelVersion": "v2",
        "Connection": "keep-alive",
    }

    payload = {
        "checkout.billing.billingOptions.selectBillingOption": "CREDIT",
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.billingAddress.address.street2": "",
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.billingAddress.address.lastName": address_info.get("lastName", ""),
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.billingAddress.address.firstName": address_info.get("firstName", ""),
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.billingAddress.address.countryCode": address_info.get("country", "HK"),
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.billingAddress.address.street": address_info.get("street", ""),
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.validCardNumber": "true",
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.cardNumberForBinDetection": "",
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.cardNumber": encrypted_card,
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.selectCardType": card_type,
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.expiration": f"{card_info.get('expiryMonth', '01')}/{card_info.get('expiryYear', '26')}",
        "checkout.billing.billingOptions.selectedBillingOptions.creditCard.cardInputs.cardInput-0.securityCode": encrypted_cvv,
        "checkout.billing.billingOptions.selectedBillingOptions.giftCard.giftCardInput.deviceID": '{"op":"DEVICEID"}',
        "checkout.billing.billingOptions.selectedBillingOptions.giftCard.giftCardInput.giftCard": "",
    }

    try:
        before = get_cookie_snapshot(session)
        resp = session.post(billing_url, params=params, headers=headers, data=payload, timeout=30)
        log_cookie_diff("步驟 5: POST 提交信用卡", before, session)

        stk_token, actk_token = extract_tokens_from_response(resp, stk_token, actk_token)

        if resp.status_code == 200:
            if "repost" in resp.text or "form method" in resp.text:
                execute_auto_submit_form(session, resp.text, billing_url)
            print("🎉 成功提交信用卡資訊！")
            return True, stk_token, actk_token
        else:
            print(f"⚠️ 送出失敗，狀態碼: {resp.status_code}")
            return False, stk_token, actk_token
    except Exception as e:
        print(f"❌ 提交出錯: {e}")
        return False, stk_token, actk_token


def main():
    print("=" * 60)
    print("🍎 Apple 香港官方店 自動購物流程")
    print("=" * 60)

    cookie_dict, atbtoken = get_firefox_cookies_and_token()

    if not cookie_dict or not atbtoken:
        print("⚠️ 無法獲取 ATB Token，終止執行。")
        return

    session = requests.Session(impersonate="firefox")
    for k, v in cookie_dict.items():
        session.cookies[k] = v
    session.cookies["rtsid"] = SELECTED_RTSID

    clear_cart_if_not_empty(session)

    success = False
    checkout_url = ""
    stk_token = ""
    actk_token = ""
    for p_code, p_name in PRODUCTS.items():
        print(f"\n🚀 正在嘗試加車: {p_name}")
        success, checkout_url, stk_token, actk_token = add_product_to_bag(session, p_code, atbtoken)
        if success:
            break

    if not success or not stk_token:
        print("❌ 無法完成加車流程。")
        return

    parsed = urlparse(checkout_url)
    checkout_host = parsed.netloc or CHECKOUT_DEFAULT_HOST
    store_code = extract_store_code_from_rtsid(SELECTED_RTSID)
    ui_header = generate_ui_fetch_header()

    store_ok, current_stk, current_actk = switch_to_retail_and_select_store(
        session, checkout_host, stk_token, actk_token, store_code
    )
    if not store_ok:
        print("❌ 鎖定門市失敗。")
        open_firefox(f"https://{checkout_host}/hk-zh/shop/checkout?_s=Fulfillment-init")
        return

    step_ok, current_stk, current_actk, _ = continue_from_fulfillment_to_pickup_contact(
        session, checkout_host, current_stk, current_actk, store_code
    )
    if not step_ok:
        print("❌ 推進流程失敗。")
        open_firefox(f"https://{checkout_host}/hk-zh/shop/checkout?_s=Fulfillment-init")
        return

    contact_ok, current_stk, current_actk = submit_pickup_contact_info(
        session, checkout_host, current_stk, current_actk, CONTACT_INFO, ui_header
    )
    if not contact_ok:
        print("⚠️ 填寫取貨人失敗。")
        open_firefox(f"https://{checkout_host}/hk-zh/shop/checkout?_s=PickupContact-init")
        return

    billing_option_ok, current_stk, current_actk = select_billing_option(
        session, checkout_host, current_stk, current_actk, ui_header, billing_method="CREDIT"
    )
    if not billing_option_ok:
        print("⚠️ 選擇計費方式失敗。")
        open_firefox(f"https://{checkout_host}/hk-zh/shop/checkout?_s=Billing-init")
        return

    if DEBUG_MODE:
        print("\n🐛 DEBUG MODE - 在提交信用卡前暫停")
        final_url = f"https://{checkout_host}/hk-zh/shop/checkout?_s=Billing-init"
        send_bark_notification("🐛 Debug 暫停", "已選定信用卡，未送出扣款", final_url)
        open_firefox(final_url)
        return

    card_ok, current_stk, current_actk = continue_from_billing_to_review(
        session, checkout_host, current_stk, current_actk, ui_header, CREDIT_CARD_INFO, BILLING_ADDRESS_INFO
    )

    print("\n" + "=" * 50)
    if card_ok:
        final_url = f"https://{checkout_host}/hk-zh/shop/checkout?_s=BillingReview-init"
        print("🎉🎉 全流程成功！請在瀏覽器確認送出訂單")
        send_bark_notification("✅ Apple 結帳就緒", "已成功填寫信用卡，請確認送出訂單", final_url)
        open_firefox(final_url)
    else:
        final_url = f"https://{checkout_host}/hk-zh/shop/checkout?_s=Billing-init"
        print("⚠️ 信用卡送出失敗。")
        open_firefox(final_url)
    print("=" * 50)


if __name__ == "__main__":
    main()
