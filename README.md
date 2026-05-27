# FFXIV Aurora Forecast

一個基於 Angular 的《最終幻想14》(FFXIV) 極光預報工具。專門用於預報庫爾扎斯西部高地與舊薩雷安的極光出現時間。

## 功能

- 預報庫爾扎斯西部高地 (Coerthas Western Highlands) 的極光。
- 預報舊薩雷安 (Old Sharlayan) 的極光。
- 計算極光出現的艾歐澤亞時間 (ET) 與實際時間。

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
