'use strict'

import Scheduler from './scheduler/Scheduler';

let scheduler = new Scheduler(1000);

scheduler.every("Test", 10, () => {
    console.log("I'm doing something important right now");
});


// Run at 8:14 every day.
scheduler.scheduled(20, 14, "Scheduled Job", () => {
    console.log("the scheduled job ran!");
});

scheduler.process();