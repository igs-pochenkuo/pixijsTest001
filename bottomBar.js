export class BottomBar {
    constructor(app, gameState, BET_CONFIG) {
        this.app = app;
        this.gameState = gameState;
        this.BET_CONFIG = BET_CONFIG;
        this.container = new PIXI.Container();
        this.container.position.set(0, app.screen.height - 80);
        this.callbacks = {}; // 用於存儲回調函數

        this.createUI();
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

        this.createBetControls();
        this.createSpinButton();
    }

    createBetControls() {
        // 建立押注控制容器
        const betContainer = new PIXI.Container();
        betContainer.position.set(this.app.screen.width - 500, 15);
        this.container.addChild(betContainer);

        // 減少押注按鈕
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

        // 增加押注按鈕
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

        // 綁定按鈕事件
        this.bindBetEvents();
    }

    createSpinButton() {
        // 旋轉按鈕
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

    bindBetEvents() {
        this.increaseBetButton.on('pointerdown', () => {
            if (this.gameState.spinning) return;
            if (this.gameState.betIndex < this.BET_CONFIG.levels.length - 1) {
                this.gameState.betIndex++;
                this.gameState.currentBet = this.BET_CONFIG.levels[this.gameState.betIndex];
                this.updateUI();
            }
        });

        this.decreaseBetButton.on('pointerdown', () => {
            if (this.gameState.spinning) return;
            if (this.gameState.betIndex > 0) {
                this.gameState.betIndex--;
                this.gameState.currentBet = this.BET_CONFIG.levels[this.gameState.betIndex];
                this.updateUI();
            }
        });
    }

    // 設置 SPIN 按鈕的點擊事件
    onSpin(callback) {
        this.spinButton.on('pointerdown', () => {
            if (this.gameState.spinning) return;
            if (this.gameState.totalCredit < this.gameState.currentBet) return;
            callback();
        });
    }

    updateUI() {
        this.creditText.text = `CREDIT: ${this.gameState.totalCredit}`;
        this.betText.text = `BET: ${this.gameState.currentBet}`;
        this.winText.text = `WIN: ${this.gameState.lastWin}`;
    }
} 