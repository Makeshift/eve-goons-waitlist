'use strict'

import Job from './job';
import Task from './task';

// A basic scheduler that will run in it's own process.
// For jobs, keep them short and simple so they don't starve the other jobs
// in the queue
class Scheduler {
    constructor(resolution) {
        this.jobs = [];
        this.tasks = [];
        this.resolution = resolution || 1000; // in ms

        // Allow for overrides
        if(!!process.env.SCHEDULE_RESOLUTION) {
            this.resolution = process.env.SCHEDULE_RESOLUTION;
        }
    }

    every(name, interval, func) {
        let t = new Task(name, interval, func);
        this.tasks.push(t);
    }

    // Only use this function if you *really* need something to kick off
    // on a specific time, otherwise, the every() function is better
    scheduled(hours, minutes, name, func) {
        let j = new Job(hours, minutes, name, func);
        this.jobs.push(j);
    }

    process() {
        // Loop and check to see if we need to run anything ever second
        // this should keep the processing very low
        setInterval( () => {
            for(let i = 0; i < this.tasks.length; i++) {
                let task = this.tasks[i];

                if(task.canRun()) {
                    task.run();
                }
            }

            for(let i = 0; i < this.jobs.length; i++) {
                
            }

        }, this.resolution);
    }
}

export default Scheduler;