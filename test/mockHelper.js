/*! Copyright 2022 Ayogo Health Inc. */

export function mockFunction(retVal) {
  const mockData = {
    callCount: 0,
    calls: [],
    impl: () => retVal
  };

  const fn = function(...args) {
    mockData.callCount++;
    mockData.calls.push(args);
    return mockData.impl(...args);
  };

  Object.defineProperties(fn, {
    called: {
      get: function() {
        return !!mockData.callCount;
      }
    },
    callCount: {
      get: function() {
        return mockData.callCount;
      }
    },
    call: {
      get: function() {
        return function(callIdx) {
          return mockData.calls[callIdx];
        };
      }
    },
    mockImplementation: {
      get: function() {
        return function(impl) {
          mockData.impl = impl;
        };
      }
    },
    rejectWith: {
      get: function() {
        return function(rejVal) {
          mockData.impl = () => Promise.reject(rejVal);
        };
      }
    },
    resolveWith: {
      get: function() {
        return function(resVal) {
          mockData.impl = () => Promise.resolve(resVal);
        };
      }
    },
    returnWith: {
      get: function() {
        return function(returnVal) {
          mockData.impl = () => returnVal;
        };
      }
    },
    resetMock: {
      get: function() {
        return function() {
          mockData.calls.length = 0;
          mockData.callCount = 0;
          mockData.impl = () => retVal;
        };
      }
    }
  });

  return fn;
}
