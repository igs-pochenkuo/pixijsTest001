// 建立 PIXI Application
const app = new PIXI.Application();
await app.init({ 
    width: 1280, 
    height: 720,
    backgroundColor: 0x000000 
});
document.getElementById('gameContainer').appendChild(app.canvas);

// 定義遊戲資源路徑
const resources = {
    background: 'Resource/image/MG_BG.jpg',
    symbols: [
        'Resource/image/symbol/symbol_01.png', // SCATTER
        'Resource/image/symbol/symbol_02.png', // WILD
        'Resource/image/symbol/symbol_03.png', // FREE SPIN
        'Resource/image/symbol/symbol_04.png', // 拳擊手 1
        'Resource/image/symbol/symbol_05.png', // 拳擊手 2
        'Resource/image/symbol/symbol_06.png', // 拳擊手套
        'Resource/image/symbol/symbol_07.png', // 拳頭
        'Resource/image/symbol/symbol_08.png', // 啞鈴紅
        'Resource/image/symbol/symbol_09.png', // 啞鈴藍
        'Resource/image/symbol/symbol_10.png', // A
        'Resource/image/symbol/symbol_11.png', // K
        'Resource/image/symbol/symbol_12.png', // Q
        'Resource/image/symbol/symbol_13.png'  // J
    ]
};

// 載入所有遊戲資源
await PIXI.Assets.load([resources.background, ...resources.symbols]);

// 建立遊戲背景
const background = PIXI.Sprite.from(resources.background);
background.width = app.screen.width;
background.height = app.screen.height;
app.stage.addChild(background);

// 定義 Symbol 倍率表
const SYMBOL_CONFIG = {
    width: 180,      
    height: 150,     
    spacing: 10,
    // 新增倍率設定
    payouts: {
        'symbol_01': { name: 'SCATTER', multiplier: 100, isScatter: true }, // 特殊符號，觸發額外獎勵
        'symbol_02': { name: 'WILD', multiplier: 0, isWild: true },        // 百搭符號
        'symbol_03': { name: 'FREE SPIN', multiplier: 50, isSpecial: true },// 觸發免費遊戲
        'symbol_04': { name: 'BOXER1', multiplier: 40 },     // 高額符號
        'symbol_05': { name: 'BOXER2', multiplier: 35 },     // 高額符號
        'symbol_06': { name: 'GLOVE', multiplier: 30 },      // 高額符號
        'symbol_07': { name: 'FIST', multiplier: 25 },       // 中額符號
        'symbol_08': { name: 'DUMBBELL_RED', multiplier: 20 },// 中額符號
        'symbol_09': { name: 'DUMBBELL_BLUE', multiplier: 15 },// 中額符號
        'symbol_10': { name: 'A', multiplier: 10 },          // 低額符號
        'symbol_11': { name: 'K', multiplier: 8 },           // 低額符號
        'symbol_12': { name: 'Q', multiplier: 5 },           // 低額符號
        'symbol_13': { name: 'J', multiplier: 3 }            // 低額符號
    }
};

const REEL_CONFIG = {
    count: 3,        // 捲軸數量
    width: SYMBOL_CONFIG.width + SYMBOL_CONFIG.spacing,  // 每個捲軸的寬度
    symbolsPerReel: 4 // 每個捲軸的 symbol 數量
};

// 建立老虎機捲軸容器
const reelsContainer = new PIXI.Container();
reelsContainer.position.set(300, 100);
app.stage.addChild(reelsContainer);

// 建立遮罩
const reelsMask = new PIXI.Graphics();
reelsMask.beginFill(0xFFFFFF);
reelsMask.drawRect(
    0, 
    0, 
    (REEL_CONFIG.width) * REEL_CONFIG.count - SYMBOL_CONFIG.spacing, 
    SYMBOL_CONFIG.height * 3
);
reelsMask.endFill();
reelsContainer.mask = reelsMask;
reelsContainer.addChild(reelsMask);

// 建立捲軸
const reels = [];
for (let i = 0; i < REEL_CONFIG.count; i++) {
    const reel = new PIXI.Container();
    reel.x = i * REEL_CONFIG.width;
    reelsContainer.addChild(reel);
    reels.push(reel);

    // 為每個捲軸新增圖示
    for (let j = 0; j < REEL_CONFIG.symbolsPerReel; j++) {
        const symbolIndex = Math.floor(Math.random() * resources.symbols.length);
        const symbol = PIXI.Sprite.from(resources.symbols[symbolIndex]);
        
        // 設定統一的 symbol 大小
        symbol.width = SYMBOL_CONFIG.width;
        symbol.height = SYMBOL_CONFIG.height;
        
        // 設定位置
        symbol.y = j * SYMBOL_CONFIG.height;
        
        // 將 symbol 的錨點設在中心，這樣旋轉時會更自然
        symbol.anchor.set(0.5);
        symbol.x = SYMBOL_CONFIG.width / 2;
        
        // 儲存 symbol 的索引，用於後續中獎判定
        symbol.symbolIndex = symbolIndex;
        
        reel.addChild(symbol);
    }
}

// 新增中獎線設定
const PAYLINE_CONFIG = {
    lines: [
        [1, 1, 1],  // 中間線
        [0, 0, 0],  // 上方線
        [2, 2, 2],  // 下方線
        [0, 1, 2],  // 斜線 \
        [2, 1, 0]   // 斜線 /
    ]
};

// 新增 BET 級距設定
const BET_CONFIG = {
    levels: [1, 5, 10, 20, 50, 100, 200, 500, 1000], // BET 可選擇的級距
    defaultIndex: 2  // 預設使用的級距索引（這裡預設為 10）
};

// 修改遊戲狀態管理
const gameState = {
    spinning: false,
    betIndex: BET_CONFIG.defaultIndex,  // 當前 BET 級距的索引
    currentBet: BET_CONFIG.levels[BET_CONFIG.defaultIndex], // 預設押注金額
    totalCredit: 1000, // 預設玩家金額
    lastWin: 0
};

// 檢查中獎函數
function checkWin(reelSymbols) {
    let totalWin = 0;
    const symbolsMatrix = [];
    
    // 建立符號矩陣
    for (let row = 0; row < 3; row++) {
        symbolsMatrix[row] = [];
        for (let reel = 0; reel < REEL_CONFIG.count; reel++) {
            // 修改這裡的邏輯，直接使用 symbol index
            const symbolIndex = Math.floor(Math.random() * resources.symbols.length); // 暫時使用隨機數
            const symbolName = `symbol_${String(symbolIndex + 1).padStart(2, '0')}`;
            symbolsMatrix[row][reel] = symbolName;
        }
    }

    // 檢查每條中獎線
    PAYLINE_CONFIG.lines.forEach((line, index) => {
        const symbolsInLine = line.map((row, col) => symbolsMatrix[row][col]);
        const firstSymbol = symbolsInLine[0];
        
        // 跳過 SCATTER 和 FREE SPIN，這些需要特別處理
        if (firstSymbol === 'symbol_01' || firstSymbol === 'symbol_03') return;
        
        // 檢查是否所有符號相同或是 WILD
        const isWin = symbolsInLine.every(symbol => 
            symbol === firstSymbol || 
            symbol === 'symbol_02' || // WILD
            firstSymbol === 'symbol_02'
        );

        if (isWin) {
            // 取得實際中獎的符號（如果有WILD，則使用非WILD的符號計算倍率）
            const winningSymbol = firstSymbol === 'symbol_02' ? 
                symbolsInLine.find(s => s !== 'symbol_02') || 'symbol_02' : 
                firstSymbol;
                
            const win = SYMBOL_CONFIG.payouts[winningSymbol].multiplier * gameState.currentBet;
            totalWin += win;
            
            highlightWinningLine(index, line, win);
        }
    });

    // 檢查 SCATTER 獎勵
    const scatterCount = symbolsMatrix.flat().filter(symbol => symbol === 'symbol_01').length;
    if (scatterCount >= 3) {
        const scatterWin = SYMBOL_CONFIG.payouts['symbol_01'].multiplier * gameState.currentBet;
        totalWin += scatterWin;
        // TODO: 觸發 SCATTER 特殊獎勵效果
    }

    // 檢查 FREE SPIN
    const freeSpinCount = symbolsMatrix.flat().filter(symbol => symbol === 'symbol_03').length;
    if (freeSpinCount >= 3) {
        // TODO: 觸發免費遊戲模式
    }

    return totalWin;
}

// 顯示中獎線動畫
function highlightWinningLine(lineIndex, line, winAmount) {
    // 建立中獎線圖形
    const winLine = new PIXI.Graphics();
    winLine.lineStyle(3, 0xFFFF00, 1);
    
    // 繪製中獎線
    const startX = 0;
    const startY = (line[0] + 0.5) * SYMBOL_CONFIG.height;
    winLine.moveTo(startX, startY);
    
    line.forEach((row, col) => {
        const x = col * REEL_CONFIG.width;
        const y = (row + 0.5) * SYMBOL_CONFIG.height;
        winLine.lineTo(x, y);
    });
    
    reelsContainer.addChild(winLine);
    
    // 2秒後移除中獎線
    setTimeout(() => {
        reelsContainer.removeChild(winLine);
    }, 2000);
}

// 建立 UI 容器
const uiContainer = new PIXI.Container();
uiContainer.position.set(0, app.screen.height - 80); // 放在畫面底部
app.stage.addChild(uiContainer);

// 新增總額顯示 (左側)
const creditText = new PIXI.Text(`CREDIT: ${gameState.totalCredit}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xFFFFFF,
    align: 'center'
});
creditText.position.set(50, 25);
uiContainer.addChild(creditText);

// 新增最後贏分顯示 (中間)
const winText = new PIXI.Text(`WIN: ${gameState.lastWin}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xFFFFFF,
    align: 'center'
});
winText.anchor.set(0.5, 0); // 設置錨點使文字水平置中
winText.position.set(app.screen.width / 2, 25);
uiContainer.addChild(winText);

// 修改旋轉按鈕 (右側)
const spinButton = new PIXI.Graphics();
spinButton.beginFill(0xFF0000);
spinButton.drawRect(0, 0, 120, 50);
spinButton.endFill();
spinButton.position.set(app.screen.width - 150, 15);
spinButton.eventMode = 'static';
spinButton.cursor = 'pointer';
uiContainer.addChild(spinButton);

// SPIN 文字
const spinText = new PIXI.Text('SPIN', {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xFFFFFF,
    align: 'center'
});
spinText.anchor.set(0.5);
spinText.position.set(60, 25);
spinButton.addChild(spinText);

// 建立押注控制容器 (SPIN 左側)
const betContainer = new PIXI.Container();
betContainer.position.set(app.screen.width - 500, 15); // 向左移動更多空間
uiContainer.addChild(betContainer);

// 建立減少押注按鈕
const decreaseBetButton = new PIXI.Graphics();
decreaseBetButton.beginFill(0x4CAF50);
decreaseBetButton.drawRect(0, 0, 50, 50);
decreaseBetButton.endFill();
decreaseBetButton.eventMode = 'static';
decreaseBetButton.cursor = 'pointer';
betContainer.addChild(decreaseBetButton);

// 減號符號
const minusText = new PIXI.Text('-', {
    fontFamily: 'Arial',
    fontSize: 32,
    fill: 0xFFFFFF,
    align: 'center'
});
minusText.anchor.set(0.5);
minusText.position.set(25, 25);
decreaseBetButton.addChild(minusText);

// 建立押注金額顯示文字
const betText = new PIXI.Text(`BET: ${gameState.currentBet}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xFFFFFF,
    align: 'center'
});
betText.position.set(70, 10);
// 設定最小寬度確保文字不會溢出
betContainer.addChild(betText);

// 建立增加押注按鈕
const increaseBetButton = new PIXI.Graphics();
increaseBetButton.beginFill(0x4CAF50);
increaseBetButton.drawRect(250, 0, 50, 50); // 向右移動按鈕
increaseBetButton.endFill();
increaseBetButton.eventMode = 'static';
increaseBetButton.cursor = 'pointer';
betContainer.addChild(increaseBetButton);

// 加號符號
const plusText = new PIXI.Text('+', {
    fontFamily: 'Arial',
    fontSize: 32,
    fill: 0xFFFFFF,
    align: 'center'
});
plusText.anchor.set(0.5);
plusText.position.set(275, 25);
increaseBetButton.addChild(plusText);

// 更新 UI 函數
function updateUI() {
    creditText.text = `CREDIT: ${gameState.totalCredit}`;
    betText.text = `BET: ${gameState.currentBet}`;
    winText.text = `WIN: ${gameState.lastWin}`;
}

// 建立 UI 相關的函數
function createUI() {
    // ... 其他 UI 元素的創建程式碼保持不變 ...

    // 增加押注按鈕事件
    increaseBetButton.on('pointerdown', () => {
        if (gameState.spinning) return;
        if (gameState.betIndex < BET_CONFIG.levels.length - 1) {
            gameState.betIndex++;
            gameState.currentBet = BET_CONFIG.levels[gameState.betIndex];
            updateUI();
        }
    });

    // 減少押注按鈕事件
    decreaseBetButton.on('pointerdown', () => {
        if (gameState.spinning) return;
        if (gameState.betIndex > 0) {
            gameState.betIndex--;
            gameState.currentBet = BET_CONFIG.levels[gameState.betIndex];
            updateUI();
        }
    });

    // 移除文字的事件監聽
    minusText.eventMode = 'none';
    plusText.eventMode = 'none';

    // 移除文字的互動性
    minusText.interactive = false;
    plusText.interactive = false;

    // Spin 按鈕事件
    spinButton.on('pointerdown', () => {
        if (gameState.spinning) return;
        if (gameState.totalCredit < gameState.currentBet) return;
        
        gameState.spinning = true;
        gameState.totalCredit -= gameState.currentBet;
        updateUI();
        
        // 為每個捲軸設定動畫
        reels.forEach((reel, i) => {
            const symbols = reel.children;
            const targetY = symbols.length * SYMBOL_CONFIG.height;
            
            // 使用 PIXI 的 Ticker 來處理動畫
            let currentSpeed = 0;
            const spinAnimation = (delta) => {
                currentSpeed = Math.min(50, currentSpeed + 1);
                
                symbols.forEach(symbol => {
                    symbol.y += currentSpeed;
                    if (symbol.y >= targetY) {
                        symbol.y = -SYMBOL_CONFIG.height;
                    }
                });

                // 停止動畫
                if (currentSpeed >= 50) {
                    setTimeout(() => {
                        app.ticker.remove(spinAnimation);
                        if (i === reels.length - 1) {
                            // 最後一個輪軸停止時
                            gameState.spinning = false;
                            
                            // 檢查中獎
                            const winAmount = checkWin(reels);
                            gameState.lastWin = winAmount;
                            gameState.totalCredit += winAmount;
                            
                            // 更新UI顯示
                            updateUI();
                        }
                    }, 1000 + i * 500);
                }
            };

            // 依序啟動每個輪軸的動畫
            setTimeout(() => {
                app.ticker.add(spinAnimation);
            }, i * 200);
        });
    });
}

// 呼叫 createUI 函數
createUI();