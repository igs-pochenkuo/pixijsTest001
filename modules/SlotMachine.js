import { eventManager } from './EventManager.js';
import { Reel } from './Reel.js';

export class SlotMachine extends PIXI.Container {
    constructor(config, app) {
        super();
        this.config = config;
        this.app = app;
        this.reels = [];
        this.gameState = {
            spinning: false,
            currentBet: config.BET_CONFIG.levels[config.BET_CONFIG.defaultIndex],
            totalCredit: config.GAME_CONFIG.defaultCredit,
            lastWin: 0,
            betIndex: config.BET_CONFIG.defaultIndex
        };
    }

    async init() {
        try {
            // 建立背景
            const background = PIXI.Sprite.from(this.config.RESOURCE_CONFIG.background);
            background.width = this.config.GAME_CONFIG.width;
            background.height = this.config.GAME_CONFIG.height;
            this.addChild(background);

            // 建立老虎機捲軸容器
            this.reelsContainer = new PIXI.Container();
            this.reelsContainer.position.set(
                this.config.GAME_CONFIG.reelsPosition.x,
                this.config.GAME_CONFIG.reelsPosition.y - 50
            );
            this.addChild(this.reelsContainer);

            // 建立捲軸
            for (let i = 0; i < this.config.REEL_CONFIG.count; i++) {
                const reel = new Reel(this.config, i, this.app);
                reel.x = i * this.config.REEL_CONFIG.width;
                this.reels.push(reel);
                this.reelsContainer.addChild(reel);
            }

            // 建立遮罩
            const reelsMask = new PIXI.Graphics();
            reelsMask.beginFill(0xFFFFFF);
            reelsMask.drawRect(
                0, 
                0, 
                (this.config.REEL_CONFIG.width) * this.config.REEL_CONFIG.count - this.config.SYMBOL_CONFIG.spacing,
                this.config.SYMBOL_CONFIG.height * 3
            );
            reelsMask.endFill();
            this.reelsContainer.mask = reelsMask;
            this.reelsContainer.addChild(reelsMask);

            eventManager.emit('slot:ready');

        } catch (error) {
            console.error('SlotMachine initialization failed:', error);
            eventManager.emit('slot:error', error);
            throw error;
        }
    }

    async spin() {
        if (this.gameState.spinning) {
            console.log('Already spinning, cannot start new spin');
            return;
        }
        if (this.gameState.totalCredit < this.gameState.currentBet) {
            console.log('Insufficient credit for spin');
            return;
        }

        try {
            console.log('=== Starting new spin ===');
            console.log('Current bet:', this.gameState.currentBet);
            
            this.gameState.spinning = true;
            eventManager.emit('spin:start');
            
            // 扣除押注金額
            this.gameState.totalCredit -= this.gameState.currentBet;
            eventManager.emit('credit:update', this.gameState.totalCredit);

            // 所有輪軸同時開始轉動
            this.reels.forEach(reel => reel.startSpin());

            // 依序停止每個輪軸
            for (let i = 0; i < this.reels.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 500 + i * 500));
                await this.reels[i].stopSpin();
            }

            // 取得最終盤面
            const finalSymbolMatrix = this.reels.map(reel => 
                reel.getVisibleSymbols().map(symbol => {
                    const symbolName = this.config.SYMBOL_CONFIG.payouts[
                        `symbol_${String(symbol.symbolIndex + 1).padStart(2, '0')}`
                    ].name;
                    return symbolName;
                })
            );

            console.log('\n=== Spin Result ===');
            console.log('Final Symbol Matrix:');
            // 打印每一行符號
            for (let row = 0; row < 3; row++) {
                let rowSymbols = finalSymbolMatrix.map(reel => reel[row]);
                console.log(`Row ${row + 1}:`, rowSymbols.join(' | '));
            }

            // 計算贏分
            const winAmount = this.calculateWin();
            this.gameState.lastWin = winAmount;

            console.log('\nWin Information:');
            console.log(`Total Win: ${winAmount}`);
            if (winAmount > 0) {
                // 顯示中獎線資訊
                this.config.PAYLINE_CONFIG.lines.forEach((line, index) => {
                    const lineSymbols = line.map((row, col) => finalSymbolMatrix[col][row]);
                    const isWin = this.checkLine(line);
                    if (isWin) {
                        console.log(`Winning Line ${index + 1}:`, lineSymbols.join(' | '));
                    }
                });
            }

            console.log('\nGame State:');
            console.log({
                totalCredit: this.gameState.totalCredit,
                lastWin: winAmount,
                currentBet: this.gameState.currentBet
            });
            console.log('=== Spin Complete ===\n');

            if (winAmount > 0) {
                this.gameState.totalCredit += winAmount;
                eventManager.emit('win', { amount: winAmount });
            }

            this.gameState.spinning = false;
            eventManager.emit('spin:complete', {
                win: winAmount,
                credit: this.gameState.totalCredit
            });

        } catch (error) {
            console.error('Spin failed:', error);
            this.gameState.spinning = false;
            eventManager.emit('slot:error', error);
        }
    }

    calculateWin() {
        const winLines = [];
        let totalWin = 0;

        // 獲取當前可見的符號矩陣
        const symbolMatrix = this.reels.map(reel => 
            reel.getVisibleSymbols().map(symbol => symbol.symbolIndex)
        );

        // 檢查每條中獎線
        this.config.PAYLINE_CONFIG.lines.forEach((line, index) => {
            const lineSymbols = line.map((row, col) => symbolMatrix[col][row]);
            const firstSymbol = lineSymbols[0];
            
            // 檢查是否所有符號相同或是 WILD
            const isWin = lineSymbols.every(symbol => 
                symbol === firstSymbol || 
                symbol === 1 || // WILD symbol index
                firstSymbol === 1
            );

            if (isWin) {
                const symbolForPayout = firstSymbol === 1 ? 
                    lineSymbols.find(s => s !== 1) || 1 : 
                    firstSymbol;
                
                const win = this.config.SYMBOL_CONFIG.payouts[`symbol_${String(symbolForPayout + 1).padStart(2, '0')}`].multiplier * this.gameState.currentBet;
                totalWin += win;
                winLines.push({ line: index, win });
            }
        });

        return totalWin;
    }

    // 新增檢查單一中獎線的方法
    checkLine(line) {
        const lineSymbols = line.map((row, col) => 
            this.reels[col].getVisibleSymbols()[row].symbolIndex
        );
        const firstSymbol = lineSymbols[0];
        
        return lineSymbols.every(symbol => 
            symbol === firstSymbol || 
            symbol === 1 || // WILD
            firstSymbol === 1
        );
    }
} 