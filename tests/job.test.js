'use strict'

import Job from '../scheduler/job';

// should they go here?
const hour = 1;
const minute = 30;
const name = "Test";
const func = jest.fn();
var job = null;

beforeEach(() => {
    job = new Job(hour, minute, name, func);
});

describe('constructor', () => {
    test('it should have all properties', () => {
        expect(job.hours).toEqual(hour);
        expect(job.minutes).toEqual(minute);
        expect(job.name).toEqual(name);
        expect(job.func).toEqual(func);
    });
});

describe('determineNextRun', () => {
    test('it should set next run', () => {
        job.determineNextRun();

        expect(job.nextRun).not.toBeUndefined();
    });

    test('if it ran today, it will set it to tomorrow', () => {
        let nextRun = job.nextRun;

        // Signal that it was already run today
        job.lastRun = new Date();
        job.determineNextRun();

        expect(job.nextRun.getTime()).toBeGreaterThan(nextRun.getTime());
    });
});

describe('canRun', () => {
    test('when next run is not available yet', () => {
        let futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        job.nextRun = futureDate;

        expect(job.canRun()).toEqual(false);
    });

    test('when run is in the past', () => {
        let pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        job.nextRun = pastDate;

        expect(job.canRun()).toEqual(true);
    });
});

describe('run', () => {
    test('it should run function', () => {
        expect.assertions(1)
        return job.run().then(() => {
            expect(func).toBeCalled();
        });
    });

    test('it should capture exception', () => {
        const myMock = () => {
            throw "test";
        }

        expect.assertions(1)
        job = new Job(hour, minute, name, myMock);

        return job.run().then(() => {
            // make sure an exception didn't happen
            expect(true).toEqual(true);
        });
    });
});

