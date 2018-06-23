'use strict'

class Job {
    constructor(hours, minutes, name, func) {
        this.hours = hours;
        this.minutes = minutes;
        this.name = name;
        this.func = func;

        this.determineNextRun();
        this.lastRan = Date.UTC();
    }

    determineNextRun() {
        this.nextRun = Date.UTC().setHours(this.hours, this.minutes, 0, 0);
        if(!!this.lastRan) {
            // todo: this might be subject to errors if this takes a REALLY long time and is on a day edge
            // advance by one day.
            this.nextRun.setDate(this.nextRun.getDate() + 1)
        }
    }

    canRun() {
        return this.Date.UTC() >= this.nextRun();
    }

    async run() {
        this.lastRan = Date.UTC(); // hack to protect from reentry, might need a state on this class
        try {
            func();
        } catch(e) {
            console.log(e);
        } finally {
            this.lastRan = Date.UTC();
            this.determineNextRun();
        }
    }
}

export default Job;