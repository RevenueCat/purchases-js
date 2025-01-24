import { v4 as uuidv4 } from "uuid";

export class Trace {
  public readonly trace_id: string;
  private trace_index: number;

  constructor() {
    this.trace_id = uuidv4();
    this.trace_index = 0;
  }

  public nextTraceIndex(): number {
    const current_index = this.trace_index;
    this.trace_index++;
    return current_index;
  }
}
