import { type Purchases } from "../main";

export function requiresLoadedResources<
  This extends Purchases,
  Args extends never[],
  Result,
>(
  target: (this: This, ...args: Args) => Promise<Result>,
  _context: ClassMethodDecoratorContext<
    This,
    (...args: Args) => Promise<Result>
  >,
) {
  async function wrapper(this: This, ...args: Args): Promise<Result> {
    await this.preload();
    return target.call(this, ...args);
  }

  return wrapper;
}
