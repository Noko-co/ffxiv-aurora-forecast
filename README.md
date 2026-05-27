# FFXIV Aurora, Rainbow & Diamond Dust Forecast

一個基於 Angular 的《最終幻想14》(FFXIV) 天氣預報工具，提供極光、彩虹與鑽石星層的出現時間預測。

## 功能

### 🌌 極光預報 (Aurora Forecast)
- 預報 **庫爾札斯西部高地** (Coerthas Western Highlands) 的極光。
- 預報 **舊薩雷安** (Old Sharlayan) 的極光。
- 自動計算極光出現的艾歐澤亞時間 (ET) 與實際現實時間。

### 🌈 彩虹預報 (Rainbow Forecast)
- 預報全地圖符合彩虹出現條件（由雨轉晴）的時間視窗。
- **篩選功能**：支援按區域分組進行多選，並提供「單一群組全選」功能，方便快速切換感興趣的區域。
- **能見度分級**：提供彩色圖示標註彩虹的預計能見度（由 ET 日期與時間決定）。
- **即時倒數**：顯示距離下次彩虹出現的現實剩餘時間。

### ❄️ 鑽石星層預報 (Diamond Dust Forecast)
- 預報 **庫爾札斯西部高地** (Coerthas Western Highlands) 的鑽石星層出現時間。
- 監測特定的天氣與時間組合（晴朗且於特定 ET 時段）。

## 開發

此專案使用 [Angular CLI](https://github.com/angular/angular-cli) 版本 21.2.12。

### 本地運行

```bash
npm install
ng serve
```

啟動後請訪問 `http://localhost:4200/`。

### 構建

```bash
ng build
```

編譯後的檔案將存放在 `dist/` 目錄中。

## 引用與致謝

本專案的部分核心邏輯（天氣預報算法）參考並移植自：
- [Asvel/ffxiv-weather](https://github.com/Asvel/ffxiv-weather)

感謝 Asvel 提供優秀的天氣預報基礎庫。

## 授權

本專案採用 [MIT License](LICENSE) 授權。
