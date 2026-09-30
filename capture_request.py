import asyncio
import json
from playwright.async_api import async_playwright

async def capture_add_to_cart():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # 顯示瀏覽器視窗
        page = await browser.new_page()

        # 監聽所有網路請求
        captured_requests = []

        def handle_request(request):
            if "bagx" in request.url or "buy-iphone" in request.url:
                captured_requests.append({
                    "method": request.method,
                    "url": request.url,
                    "headers": dict(request.headers),
                    "post_data": request.post_data,
                })
                print(f"🔍 捕捉請求: {request.method} {request.url[:80]}")

        page.on("request", handle_request)

        # 訪問 Apple 香港店鋪
        print("📱 正在打開 Apple 香港店鋪...")
        await page.goto("https://www.apple.com/hk-zh/shop/buy-iphone/iphone-16", wait_until="networkidle")

        print("\n" + "="*60)
        print("✅ 頁面已加載！")
        print("="*60)
        print("\n👉 請在瀏覽器窗口中：")
        print("   1. 選擇你要的 iPhone 16 配置")
        print("   2. 點擊【加入購物袋】按鈕")
        print("\n🔍 我會自動捕捉加車請求...\n")

        # 等待用戶點擊加入購物袋（監聽導航變化）
        try:
            await asyncio.sleep(60)  # 等待 60 秒讓用戶操作
        except KeyboardInterrupt:
            pass

        print("\n" + "="*60)
        print("📊 捕捉到的請求：")
        print("="*60)

        if captured_requests:
            for i, req in enumerate(captured_requests, 1):
                print(f"\n[請求 {i}]")
                print(f"  方法: {req['method']}")
                print(f"  URL: {req['url']}")
                print(f"\n  Headers:")
                for k, v in req['headers'].items():
                    print(f"    {k}: {v}")
                if req['post_data']:
                    print(f"\n  POST Data: {req['post_data'][:500]}")
                print("\n" + "-"*60)

            # 保存詳細日誌
            with open("captured_request.json", "w", encoding="utf-8") as f:
                json.dump(captured_requests, f, indent=2, default=str)
            print(f"\n✅ 詳細日誌已保存到: captured_request.json")
        else:
            print("❌ 未捕捉到任何請求！")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_add_to_cart())
