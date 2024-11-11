import { eventManager } from './modules/EventManager.js';

export class BottomBar {
    constructor(app, gameState, betConfig) {
        this.app = app;
        this.gameState = gameState;
        this.betConfig = betConfig;
        this.container = new PIXI.Container();
        this.container.position.set(0, app.screen.height - 80);

        this.createUI();
        this.bindEvents();
        app.stage.addChild(this.container);
    }

    createUI() {
        // 新增總額顯示 (左側)
        this.creditText = new PIXI.Text(`CREDIT: ${this.gameState.totalCredit}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.creditText.position.set(50, 25);
        this.container.addChild(this.creditText);

        // 新增最後贏分顯示 (中間)
        this.winText = new PIXI.Text(`WIN: ${this.gameState.lastWin}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.winText.anchor.set(0.5, 0);
        this.winText.position.set(this.app.screen.width / 2, 25);
        this.container.addChild(this.winText);

        // 建立押注控制容器
        const betContainer = new PIXI.Container();
        betContainer.position.set(this.app.screen.width - 500, 15);
        this.container.addChild(betContainer);

        // 建立減少押注按鈕
        this.decreaseBetButton = new PIXI.Graphics();
        this.decreaseBetButton.beginFill(0x4CAF50);
        this.decreaseBetButton.drawRect(0, 0, 50, 50);
        this.decreaseBetButton.endFill();
        this.decreaseBetButton.eventMode = 'static';
        this.decreaseBetButton.cursor = 'pointer';
        betContainer.addChild(this.decreaseBetButton);

        // 減號符號
        const minusText = new PIXI.Text('-', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xFFFFFF,
            align: 'center'
        });
        minusText.anchor.set(0.5);
        minusText.position.set(25, 25);
        this.decreaseBetButton.addChild(minusText);

        // 押注金額顯示
        this.betText = new PIXI.Text(`BET: ${this.gameState.currentBet}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.betText.position.set(70, 10);
        betContainer.addChild(this.betText);

        // 建立增加押注按鈕
        this.increaseBetButton = new PIXI.Graphics();
        this.increaseBetButton.beginFill(0x4CAF50);
        this.increaseBetButton.drawRect(250, 0, 50, 50);
        this.increaseBetButton.endFill();
        this.increaseBetButton.eventMode = 'static';
        this.increaseBetButton.cursor = 'pointer';
        betContainer.addChild(this.increaseBetButton);

        // 加號符號
        const plusText = new PIXI.Text('+', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xFFFFFF,
            align: 'center'
        });
        plusText.anchor.set(0.5);
        plusText.position.set(275, 25);
        this.increaseBetButton.addChild(plusText);

        // 建立 SPIN 按鈕
        this.spinButton = new PIXI.Graphics();
        this.spinButton.beginFill(0xFF0000);
        this.spinButton.drawRect(0, 0, 120, 50);
        this.spinButton.endFill();
        this.spinButton.position.set(this.app.screen.width - 150, 15);
        this.spinButton.eventMode = 'static';
        this.spinButton.cursor = 'pointer';
        this.container.addChild(this.spinButton);

        // SPIN 文字
        const spinText = new PIXI.Text('SPIN', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            align: 'center'
        });
        spinText.anchor.set(0.5);
        spinText.position.set(60, 25);
        this.spinButton.addChild(spinText);
    }

    bindEvents() {
        // 監聽遊戲事件
        eventManager.on('credit:update', (credit) => {
            this.creditText.text = `CREDIT: ${credit}`;
        });

        eventManager.on('spin:complete', (data) => {
            this.winText.text = `WIN: ${data.win}`;
            this.creditText.text = `CREDIT: ${data.credit}`;
            this.enableButtons();
        });

        eventManager.on('spin:start', () => {
            this.disableButtons();
            this.winText.text = 'WIN: 0';
        });

        // 綁定按鈕事件
        this.increaseBetButton.on('pointerdown', () => {
            if (this.gameState.spinning) return;
            if (this.gameState.betIndex < this.betConfig.levels.length - 1) {
                this.gameState.betIndex++;
                this.gameState.currentBet = this.betConfig.levels[this.gameState.betIndex];
                this.updateBetDisplay();
            }
        });

        this.decreaseBetButton.on('pointerdown', () => {
            if (this.gameState.spinning) return;
            if (this.gameState.betIndex > 0) {
                this.gameState.betIndex--;
                this.gameState.currentBet = this.betConfig.levels[this.gameState.betIndex];
                this.updateBetDisplay();
            }
        });
    }

    updateBetDisplay() {
        this.betText.text = `BET: ${this.gameState.currentBet}`;
        eventManager.emit('bet:change', this.gameState.currentBet);
    }

    enableButtons() {
        this.spinButton.eventMode = 'static';
        this.spinButton.alpha = 1;
        this.increaseBetButton.eventMode = 'static';
        this.decreaseBetButton.eventMode = 'static';
    }

    disableButtons() {
        this.spinButton.eventMode = 'none';
        this.spinButton.alpha = 0.5;
        this.increaseBetButton.eventMode = 'none';
        this.decreaseBetButton.eventMode = 'none';
    }

    onSpin(callback) {
        this.spinButton.on('pointerdown', () => {
            if (!this.gameState.spinning && this.gameState.totalCredit >= this.gameState.currentBet) {
                callback();
            }
        });
    }
} 