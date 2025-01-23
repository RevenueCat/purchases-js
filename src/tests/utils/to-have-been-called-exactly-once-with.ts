import { expect, type MockInstance } from "vitest";

expect.extend({
  // This expectation was added to vitest 3.0
  toHaveBeenCalledExactlyOnceWith:
    // In the meantime adding it as a custom one here
    function toHaveBeenCalledExactlyOnceWith(
      received: MockInstance,
      ...expectedArgs: unknown[]
    ) {
      const spyName = received.getMockName();
      const callsWithExactArgs = received.mock.calls.filter((callArgs) => {
        if (callArgs.length !== expectedArgs.length) return false;
        for (let i = 0; i < callArgs.length; i++) {
          if (callArgs[i] !== expectedArgs[i]) return false;
        }
        return true;
      });
      const pass = callsWithExactArgs.length === 1;

      if (pass) {
        return {
          message: () =>
            `expected "${spyName}" not to be called exactly once with arguments: ${this.utils.printExpected(expectedArgs)}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected "${spyName}" to be called exactly once with arguments: ${this.utils.printExpected(expectedArgs)} but was called ${callsWithExactArgs.length} times`,
          pass: false,
        };
      }
    },
});
