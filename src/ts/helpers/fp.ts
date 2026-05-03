/**
 * Tiny FP combinators used across line-adjustments / fallbacks. Kept local
 * (rather than pushed upstream into `hyperly/fp`) because the abstractions
 * are thin and have zero dependencies — local ownership avoids pinning a
 * library API for the sake of three helpers.
 */

export const identity = <T>(x: T): T => x

/**
 * Run a side-effecting function on `x` and return `x` unchanged. Lets a
 * `void`-returning helper participate in a `pipe` without breaking the chain.
 */
export const tap = <T>(f: (x: T) => void) => (x: T): T => {
  f(x)
  return x
}

/**
 * Thread a value left-to-right through each function: `pipe(f, g)(x) = g(f(x))`.
 *
 * Two arities are typed precisely; longer chains fall back to homogeneous
 * `T → T`. Three steps is the longest chain in this codebase.
 *
 * `compose` (right-to-left, `f ∘ g`) is intentionally omitted — every
 * call site here reads more naturally as "do A, then B", and shipping
 * both invites mixing them up.
 */
export function pipe<A, B>(f: (a: A) => B): (a: A) => B
export function pipe<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C
export function pipe<A, B, C, D>(f: (a: A) => B, g: (b: B) => C, h: (c: C) => D): (a: A) => D
export function pipe(...fns: Array<(x: any) => any>) {
  return (x: any) => fns.reduce((v, f) => f(v), x)
}
