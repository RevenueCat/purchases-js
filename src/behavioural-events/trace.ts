import { v4 as uuidv4 } from "uuid";
import { Mutex } from "../helpers/mutex";

export class Trace {
  public readonly trace_id: string;
  private traceIndex: number = 0;
  private mutex: Mutex = new Mutex();

  constructor() {
    this.trace_id = uuidv4();
  }

  public async nextTraceIndex(): Promise<number> {
    await this.mutex.lock();
    try {
      return this.traceIndex++;
    } finally {
      this.mutex.unlock();
    }
  }
}
