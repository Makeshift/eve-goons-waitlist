'use strict'

class Job {
    constructor(hours, minutes, name, func) {
        this.hours = hours;
        this.minutes = minutes;
        this.name = name;
        this.func = func;

        this.determineNextRun();
        this.lastRan = new Date();
    }

    determineNextRun() {
        this.nextRun = new Date();
        this.nextRun.setHours(this.hours, this.minutes, 0, 0);
        if(!!this.lastRan) {
            // todo: this might be subject to errors if this takes a REALLY long time and is on a day edge
            // advance by one day.
            this.nextRun.setDate(this.nextRun.getDate() + 1)
        }
    }

    canRun() {
        return new Date() >= this.nextRun;
    }

    async run() {
        this.lastRan = new Date(); // hack to protect from reentry, might need a state on this class
        try {
            this.func();
        } catch(e) {
            console.log(e);
        } finally {
            this.lastRan = new Date();
            this.determineNextRun();
        }
    }
}

export default Job;