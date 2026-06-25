# iPhone 不用 App Store 的安裝方式

這個資料夾是一個 iPhone 可加入主畫面的 PWA。它不是 `.ipa`，不用 App Store，也不用電腦一直開著。做法是把整個資料夾放到 HTTPS 靜態網站，女朋友用 Safari 開啟網址後，選「加入主畫面」。

## 最簡單部署方式：Netlify Drop

1. 打開 https://app.netlify.com/drop
2. 把 `period-cycle-app` 整個資料夾拖進去。
3. 等它產生網址，例如 `https://xxxx.netlify.app`。
4. 把網址傳給女朋友。
5. 她用 iPhone Safari 開啟 `https://xxxx.netlify.app/install-ios.html`。
6. 點分享按鈕，選「加入主畫面」。

## 另一種方式：GitHub Pages

1. 建一個 GitHub repository。
2. 上傳 `period-cycle-app` 裡面的所有檔案。
3. 到 Settings -> Pages。
4. Source 選 `main` branch 和 `/root`。
5. 等 GitHub 產生 `https://你的帳號.github.io/你的repo/`。
6. 用 Safari 開啟 `install-ios.html`，加入主畫面。

## 重要限制

- iOS 一般情況不能像 Android APK 那樣直接安裝任意 App。
- 不走 App Store、又不要電腦一直開著，最穩定的方式就是 PWA + HTTPS hosting。
- 資料會存在女朋友手機的瀏覽器本機儲存空間，不會自動上傳雲端。
- 如果她清除 Safari 網站資料，記錄也會被清掉。

## 入口

- App：`index.html`
- iPhone 安裝說明：`install-ios.html`
