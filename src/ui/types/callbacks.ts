export type AsyncOrSyncCallback<X, T> =
  | ((pa: X[]) => T)
  | ((...args: X[]) => Promise<T>);
