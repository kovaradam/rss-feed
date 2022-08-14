export type FirstParam<T extends (...args: any) => any> = Parameters<T>[0];
