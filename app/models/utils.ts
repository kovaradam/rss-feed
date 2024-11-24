// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FirstParam<T extends (...args: any) => any> = Parameters<T>[0];
