import { type Purchases } from "../main";

export function requiresInitialization<
  This extends Purchases,
  Args extends never[],
  Result,
>(
  target: (this: This, ...args: Args) => Promise<Result>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: ClassMethodDecoratorContext<
    This,
    (...args: Args) => Promise<Result>
  >,
) {
  async function wrapper(this: This, ...args: Args): Promise<Result> {
    await this.initialize();
    return await target.call(this, ...args);
  }

  return wrapper;
}
