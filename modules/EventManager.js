/**
 * 遊戲事件管理器
 * 用於處理遊戲中的事件發布和訂閱
 */
export class EventManager {
    constructor() {
        // 儲存所有事件及其回調函數
        this.events = new Map();
    }

    /**
     * 訂閱事件
     * @param {string} eventName - 事件名稱
     * @param {Function} callback - 回調函數
     */
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        this.events.get(eventName).add(callback);
    }

    /**
     * 取消訂閱事件
     * @param {string} eventName - 事件名稱
     * @param {Function} callback - 回調函數
     */
    off(eventName, callback) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).delete(callback);
        }
    }

    /**
     * 發送事件
     * @param {string} eventName - 事件名稱
     * @param {any} data - 事件數據
     */
    emit(eventName, data) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }
}

// 建立全局事件管理器實例
export const eventManager = new EventManager(); 