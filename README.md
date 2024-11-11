# 拳擊主題老虎機遊戲

使用 PixiJS 開發的拳擊主題老虎機遊戲。

## 功能特點

- 3x3 的老虎機版面
- 13 種不同的遊戲符號
- 5 條中獎線
- 可調整押注金額
- 支援特殊符號（WILD、SCATTER、FREE SPIN）

## 遊戲符號

1. SCATTER (symbol_01) - 特殊獎勵符號
2. WILD (symbol_02) - 百搭符號
3. FREE SPIN (symbol_03) - 免費遊戲觸發符號
4. 拳擊手 1 (symbol_04) - 高額符號
5. 拳擊手 2 (symbol_05) - 高額符號
6. 拳擊手套 (symbol_06) - 高額符號
7. 拳頭 (symbol_07) - 中額符號
8. 啞鈴紅 (symbol_08) - 中額符號
9. 啞鈴藍 (symbol_09) - 中額符號
10. A (symbol_10) - 低額符號
11. K (symbol_11) - 低額符號
12. Q (symbol_12) - 低額符號
13. J (symbol_13) - 低額符號

## 檔案結構

- `index.html` - 遊戲入口頁面
- `styles.css` - 基本樣式設定
- `game.js` - 主要遊戲邏輯
- `bottomBar.js` - 底部 UI 控制元件（可重用）

## 技術規格

- 遊戲畫面尺寸：1280x720
- 使用框架：PixiJS
- 支援模組化開發
- 響應式設計

## 遊戲設定

### 押注設定 
```javascript
const BET_CONFIG = {
levels: [1, 5, 10, 20, 50, 100, 200, 500, 1000],
defaultIndex: 2
};
```

### 中獎線設定
```javascript
const PAYLINE_CONFIG = {
lines: [
[1, 1, 1], // 中間線
[0, 0, 0], // 上方線
[2, 2, 2], // 下方線
[0, 1, 2], // 斜線 \
[2, 1, 0] // 斜線 /
]
```

## 如何開始
1. 確保已安裝所需依賴
2. 將遊戲資源放置於正確位置：
   - 背景圖片：`Resource/image/MG_BG.jpg`
   - 符號圖片：`Resource/image/symbol/symbol_XX.png`
3. 啟動本地伺服器
4. 在瀏覽器中開啟 index.html

## 開發注意事項

- bottomBar.js 設計為可重用元件，可用於其他老虎機遊戲
- 遊戲狀態統一由 gameState 物件管理
- 所有遊戲設定都集中在配置物件中，方便調整

## 未來計劃

- [ ] 實作 FREE SPIN 功能
- [ ] 加入音效系統
- [ ] 新增更多動畫效果
- [ ] 實作 SCATTER 特殊獎勵
- [ ] 優化中獎判定邏輯