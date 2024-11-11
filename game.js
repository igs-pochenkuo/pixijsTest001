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
        'Resource/image/symbol/symbol_01.png',
        'Resource/image/symbol/symbol_02.png',
        'Resource/image/symbol/symbol_03.png',
        'Resource/image/symbol/symbol_04.png',
        'Resource/image/symbol/symbol_05.png',
        'Resource/image/symbol/symbol_06.png',
        'Resource/image/symbol/symbol_07.png',
        'Resource/image/symbol/symbol_08.png'
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
        'symbol_01': { name: 'WILD', multiplier: 100 },    // 百搭符號
        'symbol_02': { name: 'SEVEN', multiplier: 50 },    // 七號
        'symbol_03': { name: 'BAR3', multiplier: 30 },     // 三條 BAR
        'symbol_04': { name: 'BAR2', multiplier: 20 },     // 雙條 BAR
        'symbol_05': { name: 'BAR1', multiplier: 10 },     // 單條 BAR
        'symbol_06': { name: 'BELL', multiplier: 8 },      // 鈴鐺
        'symbol_07': { name: 'CHERRY', multiplier: 5 },    // 櫻桃
        'symbol_08': { name: 'ORANGE', multiplier: 3 }     // 橘子
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

// 新增遊戲狀態管理
const gameState = {
    spinning: false,
    currentBet: 10,  // 預設押注金額
    totalCredit: 1000, // 預設玩家金額
    lastWin: 0,
    minBet: 1,      // 最小押注
    maxBet: 100,    // 最大押注
    betStep: 1      // 押注增減單位
};

// 檢查中獎函數
function checkWin(reelSymbols) {
    let totalWin = 0;
    const symbolsMatrix = [];
    
    // 建立符號矩陣
    for (let row = 0; row < 3; row++) {
        symbolsMatrix[row] = [];
        for (let reel = 0; reel < REEL_CONFIG.count; reel++) {
            const symbolIndex = Math.floor(reelSymbols[reel][row] / SYMBOL_CONFIG.height);
            const symbolName = resources.symbols[symbolIndex].split('/').pop().split('.')[0];
            symbolsMatrix[row][reel] = symbolName;
        }
    }

    // 檢查每條中獎線
    PAYLINE_CONFIG.lines.forEach((line, index) => {
        const symbolsInLine = line.map((row, col) => symbolsMatrix[row][col]);
        const firstSymbol = symbolsInLine[0];
        
        // 檢查是否所有符號相同或是 WILD
        const isWin = symbolsInLine.every(symbol => 
            symbol === firstSymbol || 
            symbol === 'symbol_01' || // WILD
            firstSymbol === 'symbol_01'
        );

        if (isWin) {
            // 取得實際中獎的符號（如果有WILD，則使用非WILD的符號計算倍率）
            const winningSymbol = firstSymbol === 'symbol_01' ? 
                symbolsInLine.find(s => s !== 'symbol_01') || 'symbol_01' : 
                firstSymbol;
                
            const win = SYMBOL_CONFIG.payouts[winningSymbol].multiplier * gameState.currentBet;
            totalWin += win;
            
            // 顯示中獎線動畫（這部分需要另外實作）
            highlightWinningLine(index, line, win);
        }
    });

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

// 建立押注控制容器
const betContainer = new PIXI.Container();
betContainer.position.set(app.screen.width - 300, app.screen.height - 100);
app.stage.addChild(betContainer);

// 建立押注金額顯示文字
const betText = new PIXI.Text(`BET: ${gameState.currentBet}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xFFFFFF,
    align: 'center'
});
betText.position.set(70, 10);
betContainer.addChild(betText);

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
minusText.position.set(20, 5);
decreaseBetButton.addChild(minusText);

// 建立增加押注按鈕
const increaseBetButton = new PIXI.Graphics();
increaseBetButton.beginFill(0x4CAF50);
increaseBetButton.drawRect(160, 0, 50, 50);
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
plusText.position.set(15, 5);
increaseBetButton.addChild(plusText);

// 更新押注顯示
function updateBetDisplay() {
    betText.text = `BET: ${gameState.currentBet}`;
}

// 增加押注按鈕事件
increaseBetButton.on('pointerdown', () => {
    if (gameState.spinning) return;
    if (gameState.currentBet + gameState.betStep <= gameState.maxBet) {
        gameState.currentBet += gameState.betStep;
        updateBetDisplay();
    }
});

// 減少押注按鈕事件
decreaseBetButton.on('pointerdown', () => {
    if (gameState.spinning) return;
    if (gameState.currentBet - gameState.betStep >= gameState.minBet) {
        gameState.currentBet -= gameState.betStep;
        updateBetDisplay();
    }
});

// 新增總額顯示
const creditText = new PIXI.Text(`CREDIT: ${gameState.totalCredit}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xFFFFFF,
    align: 'center'
});
creditText.position.set(app.screen.width - 300, 50);
app.stage.addChild(creditText);

// 更新 UI 函數
function updateUI() {
    creditText.text = `CREDIT: ${gameState.totalCredit}`;
    betText.text = `BET: ${gameState.currentBet}`;
}

// 新增旋轉按鈕
const spinButton = new PIXI.Graphics();
spinButton.beginFill(0xFF0000);
spinButton.drawRect(0, 0, 100, 50);
spinButton.endFill();
spinButton.position.set(app.screen.width - 150, app.screen.height - 100);
spinButton.eventMode = 'static';
spinButton.cursor = 'pointer';
app.stage.addChild(spinButton);

// 修改 spin 按鈕事件
spinButton.on('pointerdown', () => {
    if (gameState.spinning) return;
    if (gameState.totalCredit < gameState.currentBet) return; // 檢查金額是否足夠
    
    gameState.spinning = true;
    gameState.totalCredit -= gameState.currentBet;
    updateUI();
    
    reels.forEach((reel, i) => {
        const symbols = reel.children;
        const targetY = symbols.length * SYMBOL_CONFIG.height;
        
        let currentSpeed = 0;
        const spinAnimation = (delta) => {
            currentSpeed = Math.min(50, currentSpeed + 1);
            
            symbols.forEach(symbol => {
                symbol.y += currentSpeed;
                if (symbol.y >= targetY) {
                    symbol.y = -SYMBOL_CONFIG.height;
                }
            });

            if (currentSpeed >= 50) {
                setTimeout(() => {
                    app.ticker.remove(spinAnimation);
                    if (i === reels.length - 1) {
                        gameState.spinning = false;
                        
                        const finalSymbolPositions = reels.map(reel => 
                            reel.children.map(symbol => symbol.y)
                        );
                        
                        const winAmount = checkWin(finalSymbolPositions);
                        gameState.lastWin = winAmount;
                        gameState.totalCredit += winAmount;
                        
                        updateUI();
                    }
                }, 1000 + i * 500);
            }
        };

        setTimeout(() => {
            app.ticker.add(spinAnimation);
        }, i * 200);
    });
}); 