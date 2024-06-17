export function mapValue<T>(input: T) {
  return <U>(mapper: (input: T) => U) => mapper(input);
}
