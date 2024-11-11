import { BottomBar } from './bottomBar.js';
import {
    SYMBOL_CONFIG,
    REEL_CONFIG,
    REEL_STRIPS,
    PAYLINE_CONFIG,
    BET_CONFIG,
    GAME_CONFIG,
    RESOURCE_CONFIG
} from './config.js';

// 新增權重隨機選擇函數
function getWeightedRandomSymbol(reelStrip) {
    const totalWeight = reelStrip.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of reelStrip) {
        random -= item.weight;
        if (random <= 0) {
            return item.symbol;
        }
    }
    return reelStrip[0].symbol;
}

// 建立 PIXI Application
const app = new PIXI.Application();
await app.init({ 
    width: GAME_CONFIG.width, 
    height: GAME_CONFIG.height,
    backgroundColor: GAME_CONFIG.backgroundColor 
});
document.getElementById('gameContainer').appendChild(app.canvas);

// 載入所有遊戲資源
await PIXI.Assets.load([RESOURCE_CONFIG.background, ...RESOURCE_CONFIG.symbols]);

// 建立遊戲背景
const background = PIXI.Sprite.from(RESOURCE_CONFIG.background);
background.width = app.screen.width;
background.height = app.screen.height;
app.stage.addChild(background);

// 遊戲狀態管理
const gameState = {
    spinning: false,
    betIndex: BET_CONFIG.defaultIndex,
    currentBet: BET_CONFIG.levels[BET_CONFIG.defaultIndex],
    totalCredit: GAME_CONFIG.defaultCredit,
    lastWin: 0
};

// 建立老虎機捲軸容器
const reelsContainer = new PIXI.Container();
reelsContainer.position.set(GAME_CONFIG.reelsPosition.x, GAME_CONFIG.reelsPosition.y);
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
        const symbolIndex = getWeightedRandomSymbol(REEL_STRIPS[`reel${i}`]);
        const symbol = PIXI.Sprite.from(RESOURCE_CONFIG.symbols[symbolIndex]);
        
        symbol.width = SYMBOL_CONFIG.width;
        symbol.height = SYMBOL_CONFIG.height;
        symbol.y = j * SYMBOL_CONFIG.height;
        symbol.anchor.set(0.5);
        symbol.x = SYMBOL_CONFIG.width / 2;
        symbol.symbolIndex = symbolIndex;
        
        reel.addChild(symbol);
    }
}

// 生成新符號的函數
function generateNewSymbol(reelIndex) {
    const symbolIndex = getWeightedRandomSymbol(REEL_STRIPS[`reel${reelIndex}`]);
    const symbol = PIXI.Sprite.from(RESOURCE_CONFIG.symbols[symbolIndex]);
    
    symbol.width = SYMBOL_CONFIG.width;
    symbol.height = SYMBOL_CONFIG.height;
    symbol.anchor.set(0.5);
    symbol.x = SYMBOL_CONFIG.width / 2;
    symbol.symbolIndex = symbolIndex;
    
    return symbol;
}

// 檢查中獎函數
function checkWin(reels) {
    let totalWin = 0;
    const symbolsMatrix = [];
    
    // 建立符號矩陣
    for (let row = 0; row < 3; row++) {
        symbolsMatrix[row] = [];
        for (let reel = 0; reel < REEL_CONFIG.count; reel++) {
            const symbols = reels[reel].children;
            
            let targetSymbol = null;
            for (let symbol of symbols) {
                const relativeY = symbol.y % (SYMBOL_CONFIG.height * REEL_CONFIG.symbolsPerReel);
                const adjustedY = relativeY >= 0 ? relativeY : relativeY + (SYMBOL_CONFIG.height * REEL_CONFIG.symbolsPerReel);
                
                if (adjustedY >= row * SYMBOL_CONFIG.height && 
                    adjustedY < (row + 1) * SYMBOL_CONFIG.height) {
                    targetSymbol = symbol;
                    break;
                }
            }

            if (targetSymbol) {
                const symbolName = `symbol_${String(targetSymbol.symbolIndex + 1).padStart(2, '0')}`;
                symbolsMatrix[row][reel] = symbolName;
            } else {
                const defaultIndex = Math.floor(Math.random() * RESOURCE_CONFIG.symbols.length);
                symbolsMatrix[row][reel] = `symbol_${String(defaultIndex + 1).padStart(2, '0')}`;
            }
        }
    }

    console.log('當前盤面:');
    symbolsMatrix.forEach((row, i) => {
        console.log(`Row ${i}: ${row.map(symbol => SYMBOL_CONFIG.payouts[symbol].name).join(' | ')}`);
    });

    // 檢查每條中獎線
    PAYLINE_CONFIG.lines.forEach((line, index) => {
        const symbolsInLine = line.map((row, col) => symbolsMatrix[row][col]);
        
        let effectiveSymbol = null;
        let allWild = true;
        
        for (const symbol of symbolsInLine) {
            if (symbol !== 'symbol_02') {
                effectiveSymbol = symbol;
                allWild = false;
                break;
            }
        }
        
        if (allWild) {
            effectiveSymbol = 'symbol_02';
        }
        
        if (effectiveSymbol === 'symbol_01' || effectiveSymbol === 'symbol_03') {
            return;
        }
        
        const isWin = symbolsInLine.every(symbol => 
            symbol === effectiveSymbol || symbol === 'symbol_02'
        );

        if (isWin) {
            const win = SYMBOL_CONFIG.payouts[effectiveSymbol].multiplier * gameState.currentBet;
            totalWin += win;
            
            console.log(`中獎線 ${index + 1}: ${SYMBOL_CONFIG.payouts[effectiveSymbol].name} x${SYMBOL_CONFIG.payouts[effectiveSymbol].multiplier} = ${win}`);
            
            highlightWinningLine(index, line, win);
        }
    });

    // 檢查 SCATTER
    const scatterCount = symbolsMatrix.flat().filter(symbol => symbol === 'symbol_01').length;
    if (scatterCount >= 3) {
        const scatterWin = SYMBOL_CONFIG.payouts['symbol_01'].multiplier * gameState.currentBet;
        totalWin += scatterWin;
        console.log(`SCATTER 獎勵: ${scatterCount}個 = ${scatterWin}`);
    }

    console.log(`總贏分: ${totalWin}`);
    return totalWin;
}

// 顯示中獎線動畫
function highlightWinningLine(lineIndex, line, winAmount) {
    const winLine = new PIXI.Graphics();
    winLine.lineStyle(3, 0xFFFF00, 1);
    
    const startX = 0;
    const startY = (line[0] + 0.5) * SYMBOL_CONFIG.height;
    winLine.moveTo(startX, startY);
    
    line.forEach((row, col) => {
        const x = col * REEL_CONFIG.width;
        const y = (row + 0.5) * SYMBOL_CONFIG.height;
        winLine.lineTo(x, y);
    });
    
    reelsContainer.addChild(winLine);
    
    setTimeout(() => {
        reelsContainer.removeChild(winLine);
    }, 2000);
}

// 建立 BottomBar
const bottomBar = new BottomBar(app, gameState, BET_CONFIG);

// 設置 SPIN 按鈕事件
bottomBar.onSpin(() => {
    if (gameState.spinning) return;
    
    console.log('=== 開始新一輪 ===');
    console.log(`當前押注: ${gameState.currentBet}`);
    console.log(`剩餘金額: ${gameState.totalCredit}`);
    
    gameState.spinning = true;
    gameState.totalCredit -= gameState.currentBet;
    bottomBar.updateUI();
    
    let spinCompleted = false;
    
    reels.forEach((reel, i) => {
        const symbols = reel.children;
        const targetY = symbols.length * SYMBOL_CONFIG.height;
        
        let currentSpeed = 0;
        const spinAnimation = (delta) => {
            currentSpeed = Math.min(50, currentSpeed + 1);
            
            symbols.forEach(symbol => {
                symbol.y += currentSpeed;
                if (symbol.y >= targetY) {
                    reel.removeChild(symbol);
                    const newSymbol = generateNewSymbol(i);
                    newSymbol.y = -SYMBOL_CONFIG.height;
                    reel.addChild(newSymbol);
                }
            });

            if (currentSpeed >= 50) {
                setTimeout(() => {
                    app.ticker.remove(spinAnimation);
                    if (i === reels.length - 1 && !spinCompleted) {
                        spinCompleted = true;
                        gameState.spinning = false;
                        
                        const winAmount = checkWin(reels);
                        gameState.lastWin = winAmount;
                        gameState.totalCredit += winAmount;
                        
                        console.log(`更新後金額: ${gameState.totalCredit}`);
                        console.log('=== 本輪結束 ===\n');
                        
                        bottomBar.updateUI();
                    }
                }, 1000 + i * 500);
            }
        };

        setTimeout(() => {
            app.ticker.add(spinAnimation);
        }, i * 200);
    });
});