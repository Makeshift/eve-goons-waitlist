'use strict'

import Scheduler from './scheduler/Scheduler';
import database from './dbHandler';
import { data } from './setup';
import log from './logger';

database.connect(() => {
    const wlog = require('./models/wlog');
    const db = data.db;

    let scheduler = new Scheduler(1000);
    
    // scheduler.every("Test", 10, () => {
    //     console.log("I'm doing something important right now");
    // });
    
    scheduler.scheduled(7, 34, "Waitlist Cleanup", () => {
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
            })
        }

        wlog.clean();
    });
    
    scheduler.process();
});