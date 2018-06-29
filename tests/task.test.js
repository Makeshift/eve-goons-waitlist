'use strict'

import Task from '../scheduler/task';

const name = "test";
const interval = 10;
const mock = jest.fn();
let task = null;


beforeEach(() => {
    task = new Task(name, interval, mock);
});

describe('constructor', () => {
    test('should set properties correctly', () => {
        expect(task.name).toEqual(name);
        expect(task.interval).toEqual(interval);
        expect(task.func).toEqual(mock);
    });
});

describe('canRun', () => {
    test('when next run is not available yet', () => {
        let futureDate = new Date();
        futureDate.setSeconds(futureDate.getSeconds() + interval);
        task.lastRan = futureDate;

        expect(task.canRun()).toEqual(false);
    });

    test('when run is in the past', () => {
        let pastDate = new Date();
        pastDate.setSeconds(pastDate.getSeconds() - interval);
        task.lastRan = pastDate;

        expect(task.canRun()).toEqual(true);
    });
});

describe('run', () => {
    test('it should run function', () => {
        expect.assertions(1)
        return task.run().then(() => {
            expect(mock).toBeCalled();
        });
    });

    test('it should capture exception', () => {
        const myMock = jest
            .fn()
            .mockImplementationOnce(() => { throw "test"})

        expect.assertions(1)
        task = new Task(name, interval, myMock);

        return task.run().then(() => {
            // make sure an exception didn't happen
            expect(myMock).toBeCalled();
        });
    });
});

