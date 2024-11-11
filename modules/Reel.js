import { eventManager } from './EventManager.js';

export class Reel extends PIXI.Container {
    constructor(config, index, app) {
        super();
        this.config = config;
        this.reelIndex = index;
        this.app = app;
        this.symbols = [];
        this.spinning = false;
        
        // 從配置中獲取尺寸設定
        this.symbolHeight = config.SYMBOL_CONFIG.height;
        this.symbolWidth = config.SYMBOL_CONFIG.width;
        
        // 初始化輪軸
        this.createSymbols();
    }

    createSymbols() {
        for (let i = 0; i < this.config.REEL_CONFIG.symbolsPerReel; i++) {
            const symbolIndex = this.getRandomSymbolIndex();
            const symbol = this.createSymbol(symbolIndex);
            symbol.y = i * this.symbolHeight + (this.symbolHeight/2);
            this.symbols.push(symbol);
            this.addChild(symbol);
        }
    }

    createSymbol(symbolIndex) {
        const symbol = PIXI.Sprite.from(this.config.RESOURCE_CONFIG.symbols[symbolIndex]);
        symbol.width = this.symbolWidth;
        symbol.height = this.symbolHeight;
        symbol.anchor.set(0.5);
        symbol.x = this.symbolWidth / 2;
        symbol.symbolIndex = symbolIndex;
        return symbol;
    }

    getRandomSymbolIndex() {
        const reelStrips = this.config.REEL_CONFIG.strips;
        const currentReelStrip = reelStrips[`reel${this.reelIndex}`];
        
        if (!currentReelStrip) {
            console.error(`No strip configuration found for reel ${this.reelIndex}`);
            return 0;
        }

        const totalWeight = currentReelStrip.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of currentReelStrip) {
            random -= item.weight;
            if (random <= 0) {
                return item.symbol;
            }
        }
        return currentReelStrip[0].symbol;
    }

    startSpin() {
        if (this.spinning) {
            console.log(`Reel ${this.reelIndex} is already spinning`);
            return;
        }
        
        console.log(`Starting spin for reel ${this.reelIndex}`);
        this.spinning = true;
        this.speed = 0;
        
        if (this.ticker) {
            console.log(`Removing existing ticker for reel ${this.reelIndex}`);
            this.app.ticker.remove(this.ticker);
        }
        
        this.ticker = () => {
            if (!this.spinning) return;
            
            // 加速到最大速度
            this.speed = Math.min(50, this.speed + 4);
            
            // 移動符號
            this.symbols.forEach(symbol => {
                symbol.y += this.speed;
                if (symbol.y >= this.symbolHeight * this.symbols.length) {
                    const newIndex = this.getRandomSymbolIndex();
                    symbol.texture = PIXI.Texture.from(this.config.RESOURCE_CONFIG.symbols[newIndex]);
                    symbol.symbolIndex = newIndex;
                    symbol.y -= this.symbolHeight * this.symbols.length;
                }
            });
        };
        
        console.log(`Adding spin ticker for reel ${this.reelIndex}`);
        this.app.ticker.add(this.ticker);
    }

    stopSpin() {
        console.log(`Attempting to stop reel ${this.reelIndex}`);
        return new Promise((resolve, reject) => {
            if (!this.spinning) {
                console.log(`Reel ${this.reelIndex} is not spinning`);
                resolve();
                return;
            }

            // 先移除原始的 spinning ticker
            if (this.ticker) {
                console.log(`Removing spin ticker for reel ${this.reelIndex}`);
                this.app.ticker.remove(this.ticker);
            }

            let deceleration = 2;  // 減速率
            let stopping = false;  // 確保減速只開始一次

            console.log(`Creating stop ticker for reel ${this.reelIndex}`);
            const stopTicker = () => {
                // 確保開始減速
                if (!stopping) {
                    stopping = true;
                    console.log(`Starting deceleration for reel ${this.reelIndex}`);
                }

                // 減速
                this.speed = Math.max(0, this.speed - deceleration);
                console.log(`Reel ${this.reelIndex} speed: ${this.speed}`);
                
                // 移動符號
                this.symbols.forEach(symbol => {
                    symbol.y += this.speed;
                    if (symbol.y >= this.symbolHeight * this.symbols.length) {
                        symbol.y -= this.symbolHeight * this.symbols.length;
                    }
                });
                
                // 當速度為 0 時停止
                if (this.speed === 0) {
                    console.log(`Reel ${this.reelIndex} stopped completely`);
                    this.app.ticker.remove(stopTicker);
                    this.alignSymbols();
                    this.spinning = false;
                    resolve();
                    return;
                }
            };
            
            this.app.ticker.add(stopTicker);
        });
    }

    alignSymbols() {
        this.symbols.forEach(symbol => {
            // 先計算基本對齊
            const offset = symbol.y % this.symbolHeight;
            if (offset !== 0) {
                symbol.y -= offset;
            }
            // 加上半個符號高度的偏移
            symbol.y += this.symbolHeight / 2;
        });
        
        // 確保符號排序正確
        this.symbols.sort((a, b) => a.y - b.y);
    }

    getVisibleSymbols() {
        return this.symbols
            .filter(symbol => symbol.y >= 0 && symbol.y < this.symbolHeight * 3)
            .sort((a, b) => a.y - b.y);
    }
} 