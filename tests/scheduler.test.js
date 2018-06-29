'use strict'

import Scheduler from '../scheduler/scheduler';

var scheduler = null;

beforeEach(() => {
    scheduler = new Scheduler();
});

describe('constructor', () => {
    test('it has a default time resolution', () => {
        expect(scheduler.resolution).toEqual(1000)
    });

    test('it takes a specific resolution', () => {
        const res = 5000;
        let scheduler = new Scheduler(res);
        expect(scheduler.resolution).toEqual(res);
    });
});

test('adding task appends to task array', () => {    
    scheduler.every("Test", 10, () => {});

    expect(scheduler.tasks.length).toEqual(1);
    expect(scheduler.jobs.length).toEqual(0);
});

test('adding job appends to job array', () => {
    scheduler.scheduled(12, 0, "Test Job", () => {});

    expect(scheduler.jobs.length).toEqual(1);
    expect(scheduler.tasks.length).toEqual(0);
});

describe('process', () => {
    beforeEach(() => {
        // Since process uses setInterval
        jest.useFakeTimers()
    });

    test('it should set up with specific interval', () => {
        scheduler.process();

        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });
});