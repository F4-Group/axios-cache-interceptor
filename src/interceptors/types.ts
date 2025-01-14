export interface AxiosInterceptor<T> {
  onFulfilled?(value: T): T | Promise<T>;
  onRejected?(error: any): any;

  /**
   * Should apply this interceptor to an already provided axios
   * instance. Does not call this method explicitly.
   */
  use(): void;
}
