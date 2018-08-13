'use strict'

import Scheduler from './scheduler/Scheduler';
import database from './dbHandler';
import { data } from './setup';
import log from './logger';
import momenttz from 'moment-timezone'

// Set global timezone for application
momenttz.tz.setDefault("Etc/UTC");

database.connect(() => {
    const wlog = require('./models/wlog');
    const db = database.db;

    let scheduler = new Scheduler(1000);
    
    // scheduler.every("Test", 10, () => {
    //     console.log("I'm doing something important right now");
    // });
    
    scheduler.scheduled(11, 0, "Waitlist Cleanup", () => {
        const collections = ['waitlist', 'fleets'];

        for(let i = 0; i < collections.length; i++) {
            let collection = db.collection(collections[i]);

            collection.remove({}, (err, docCount) => {
                if(!!err) {
                    console.log("This ran with an error!");
                    return;
                    // log.debug("scheduler.WaitlistCleanup: ", err);
                }

                console.log("Everything was fine.");
            });
        }

        wlog.clean();
    });

    scheduler.scheduled(11, 30, "Waitlist Cleanup", () => {
        const collections = ['users'];

        for(let i = 0; i < collections.length; i++) {
            let collection = db.collection(collections[i]);

            collection.remove({}, (err, docCount) => {
                if(!!err) {
                    console.log("This ran with an error!");
                    return;
                    // log.debug("scheduler.WaitlistCleanup: ", err);
                }

                console.log("Everything was fine.");
            });
        }

        wlog.clean();
    });
    
    scheduler.process();
});