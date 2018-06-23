'use strict'

class Task {
    constructor(name, interval, func) {
        this.name = name;
        this.interval = interval;
        this.func = func;
        this.lastRan = new Date();
    }

    canRun() {
        let nextRun = this.lastRan.setSeconds(this.lastRan.getSeconds() + this.interval);
        return new Date() > nextRun;
    }

    async run() {
        this.lastRan = new Date(); // hack to protect from reentry, might need a state on this class
        try {
            this.func();
        } catch(e) {
            console.log(e);
        } finally {
            this.lastRan = new Date();
        }
    }
}

export default Task;