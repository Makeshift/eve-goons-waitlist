'use strict'

class Task {
    constructor(name, interval, func) {
        this.name = name;
        this.interval = interval;
        this.func = func;
        this.lastRan = Date.UTC();
    }

    canRun() {
        let nextRun = this.lastRan.setSeconds(this.lastRan.getSeconds() + this.interval);
        return Date.UTC() > nextRun;
    }

    async run() {
        this.lastRan = Date.UTC(); // hack to protect from reentry, might need a state on this class
        try {
            func();
        } catch(e) {
            console.log(e);
        } finally {
            this.lastRan = Date.UTC();
        }
    }
}

export default Task;