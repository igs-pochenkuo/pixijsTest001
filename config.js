export const SYMBOL_CONFIG = {
    width: 180,      
    height: 150,     
    spacing: 10,
    payouts: {
        'symbol_01': { name: 'SCATTER', multiplier: 100, isScatter: true }, 
        'symbol_02': { name: 'WILD', multiplier: 0, isWild: true },        
        'symbol_03': { name: 'FREE SPIN', multiplier: 50, isSpecial: true },
        'symbol_04': { name: 'BOXER1', multiplier: 40 },     
        'symbol_05': { name: 'BOXER2', multiplier: 35 },     
        'symbol_06': { name: 'GLOVE', multiplier: 30 },      
        'symbol_07': { name: 'FIST', multiplier: 25 },       
        'symbol_08': { name: 'DUMBBELL_RED', multiplier: 20 },
        'symbol_09': { name: 'DUMBBELL_BLUE', multiplier: 15 },
        'symbol_10': { name: 'A', multiplier: 10 },          
        'symbol_11': { name: 'K', multiplier: 8 },           
        'symbol_12': { name: 'Q', multiplier: 5 },           
        'symbol_13': { name: 'J', multiplier: 3 }            
    }
};

export const REEL_CONFIG = {
    count: 3,        
    width: SYMBOL_CONFIG.width + SYMBOL_CONFIG.spacing,  
    symbolsPerReel: 4,
    strips: {
        reel0: [
            { symbol: 0, weight: 1 },  // SCATTER
            { symbol: 1, weight: 2 },  // WILD
            { symbol: 2, weight: 1 },  // FREE SPIN
            { symbol: 3, weight: 4 },  // BOXER1
            { symbol: 4, weight: 4 },  // BOXER2
            { symbol: 5, weight: 5 },  // GLOVE
            { symbol: 6, weight: 6 },  // FIST
            { symbol: 7, weight: 7 },  // DUMBBELL_RED
            { symbol: 8, weight: 7 },  // DUMBBELL_BLUE
            { symbol: 9, weight: 8 },  // A
            { symbol: 10, weight: 8 }, // K
            { symbol: 11, weight: 9 }, // Q
            { symbol: 12, weight: 9 }  // J
        ],
        reel1: [
            { symbol: 0, weight: 1 },
            { symbol: 1, weight: 3 },
            { symbol: 2, weight: 1 },
            { symbol: 3, weight: 5 },
            { symbol: 4, weight: 5 },
            { symbol: 5, weight: 6 },
            { symbol: 6, weight: 7 },
            { symbol: 7, weight: 8 },
            { symbol: 8, weight: 8 },
            { symbol: 9, weight: 9 },
            { symbol: 10, weight: 9 },
            { symbol: 11, weight: 10 },
            { symbol: 12, weight: 10 }
        ],
        reel2: [
            { symbol: 0, weight: 1 },
            { symbol: 1, weight: 2 },
            { symbol: 2, weight: 1 },
            { symbol: 3, weight: 3 },
            { symbol: 4, weight: 3 },
            { symbol: 5, weight: 4 },
            { symbol: 6, weight: 5 },
            { symbol: 7, weight: 6 },
            { symbol: 8, weight: 6 },
            { symbol: 9, weight: 7 },
            { symbol: 10, weight: 7 },
            { symbol: 11, weight: 8 },
            { symbol: 12, weight: 8 }
        ]
    }
};

export const PAYLINE_CONFIG = {
    lines: [
        [1, 1, 1],  // 中間線
        [0, 0, 0],  // 上方線
        [2, 2, 2],  // 下方線
        [0, 1, 2],  // 斜線 \
        [2, 1, 0]   // 斜線 /
    ]
};

export const BET_CONFIG = {
    levels: [1, 5, 10, 20, 50, 100, 200, 500, 1000],
    defaultIndex: 2
};

export const GAME_CONFIG = {
    width: 1280,
    height: 720,
    backgroundColor: 0x000000,
    reelsPosition: {
        x: 300,
        y: 100
    },
    defaultCredit: 1000
};

export const RESOURCE_CONFIG = {
    background: 'Resource/image/MG_BG.jpg',
    symbols: [
        'Resource/image/symbol/symbol_01.png',
        'Resource/image/symbol/symbol_02.png',
        'Resource/image/symbol/symbol_03.png',
        'Resource/image/symbol/symbol_04.png',
        'Resource/image/symbol/symbol_05.png',
        'Resource/image/symbol/symbol_06.png',
        'Resource/image/symbol/symbol_07.png',
        'Resource/image/symbol/symbol_08.png',
        'Resource/image/symbol/symbol_09.png',
        'Resource/image/symbol/symbol_10.png',
        'Resource/image/symbol/symbol_11.png',
        'Resource/image/symbol/symbol_12.png',
        'Resource/image/symbol/symbol_13.png'
    ]
}; 