import { SlotMachine } from './modules/SlotMachine.js';
import { BottomBar } from './bottomBar.js';
import { eventManager } from './modules/EventManager.js';
import * as CONFIG from './config.js';

class Game {
    constructor() {
        this.app = null;
        this.slotMachine = null;
        this.bottomBar = null;
        this.init();
    }

    async init() {
        try {
            // 初始化 PIXI Application
            this.app = new PIXI.Application();
            await this.app.init({ 
                width: CONFIG.GAME_CONFIG.width, 
                height: CONFIG.GAME_CONFIG.height,
                backgroundColor: CONFIG.GAME_CONFIG.backgroundColor 
            });
            document.getElementById('gameContainer').appendChild(this.app.canvas);

            // 載入資源
            await PIXI.Assets.load([CONFIG.RESOURCE_CONFIG.background, ...CONFIG.RESOURCE_CONFIG.symbols]);

            // 建立老虎機，傳入 app 實例
            this.slotMachine = new SlotMachine(CONFIG, this.app);
            await this.slotMachine.init();
            this.app.stage.addChild(this.slotMachine);

            // 建立底部控制列
            this.bottomBar = new BottomBar(this.app, this.slotMachine.gameState, CONFIG.BET_CONFIG);

            // 設置 spin 按鈕事件
            this.bottomBar.onSpin(() => {
                this.slotMachine.spin();
            });

            eventManager.emit('game:ready');

        } catch (error) {
            console.error('Game initialization failed:', error);
            eventManager.emit('game:error', error);
        }
    }
}

// 啟動遊戲
window.addEventListener('load', () => {
    new Game();
});