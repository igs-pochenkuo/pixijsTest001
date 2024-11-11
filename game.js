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

// 定義老虎機設定
const SYMBOL_CONFIG = {
    width: 180,      // symbol 寬度
    height: 150,     // symbol 高度
    spacing: 10      // symbol 之間的間距
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

// 新增旋轉按鈕
const spinButton = new PIXI.Graphics();
spinButton.beginFill(0xFF0000);
spinButton.drawRect(0, 0, 100, 50);
spinButton.endFill();
spinButton.position.set(app.screen.width - 150, app.screen.height - 100);
spinButton.eventMode = 'static';
spinButton.cursor = 'pointer';
app.stage.addChild(spinButton);

// 旋轉動畫狀態
let spinning = false;

// 點擊旋轉按鈕事件
spinButton.on('pointerdown', () => {
    if (spinning) return;
    spinning = true;
    
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
                        spinning = false;
                    }
                }, 1000 + i * 500);
            }
        };

        setTimeout(() => {
            app.ticker.add(spinAnimation);
        }, i * 200);
    });
}); 