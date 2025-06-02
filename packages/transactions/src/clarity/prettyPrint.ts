/*
  Format Clarity Values into Clarity style readable strings
  eg:
  `Cl.uint(1)` => u1
  `Cl.list(Cl.uint(1))` => (list u1)
  `Cl.tuple({ id: u1 })` => { id: u1 }
*/

import { ClarityType, ClarityValue, ListCV, TupleCV } from '.';

function escape(value: string): string {
  // Use JSON.stringify to handle all necessary escape sequences (e.g., \n, \r, \t, \", \\, \uXXXX).
  // JSON.stringify(value) produces a string like "\"hello\nworld\"", so we slice off the leading and trailing quotes.
  return JSON.stringify(value).slice(1, -1);
}

function formatSpace(space: number, depth: number, end = false) {
  if (!space) return ' ';
  return `\n${' '.repeat(space * (depth - (end ? 1 : 0)))}`;
}

/**
 * @description format List clarity values in clarity style strings
 * with the ability to prettify the result with line break end space indentation
 * @example
 * ```ts
 * formatList(Cl.list([Cl.uint(1)]))
 * // (list u1)
 *
 * formatList(Cl.list([Cl.uint(1)]), 2)
 * // (list
 * //   u1
 * // )
 * ```
 */
function formatList(cv: ListCV, space: number, depth = 1): string {
  if (cv.value.length === 0) return '(list)';

  const spaceBefore = formatSpace(space, depth, false);
  const endSpace = space ? formatSpace(space, depth, true) : '';

  const items = cv.value.map(v => prettyPrintWithDepth(v, space, depth)).join(spaceBefore);

  return `(list${spaceBefore}${items}${endSpace})`;
}

/**
 * @description format Tuple clarity values in clarity style strings
 * the keys are alphabetically sorted
 * with the ability to prettify the result with line break end space indentation
 * @example
 * ```ts
 * formatTuple(Cl.tuple({ id: Cl.uint(1), age: Cl.uint(20) }))
 * // { age: 20, id: u1 }
 *
 * formatTuple(Cl.tuple({ id: Cl.uint(1), age: Cl.uint(20) }, 2))
 * // {
 * //   age: 20,
 * //   id: u1
 * // }
 * ```
 */
function formatTuple(cv: TupleCV, space: number, depth = 1): string {
  if (Object.keys(cv.value).length === 0) return '{}';

  const items: string[] = [];
  for (const [key, value] of Object.entries(cv.value)) {
    items.push(`${key}: ${prettyPrintWithDepth(value, space, depth)}`);
  }

  const spaceBefore = formatSpace(space, depth, false);
  const endSpace = formatSpace(space, depth, true);

  return `{${spaceBefore}${items.sort().join(`,${spaceBefore}`)}${endSpace}}`;
}

function exhaustiveCheck(param: never): never {
  throw new Error(`invalid clarity value type: ${param}`);
}

// the exported function should not expose the `depth` argument
function prettyPrintWithDepth(cv: ClarityValue, space = 0, depth: number): string {
  if (cv.type === ClarityType.BoolFalse) return 'false';
  if (cv.type === ClarityType.BoolTrue) return 'true';

  if (cv.type === ClarityType.Int) return cv.value.toString();
  if (cv.type === ClarityType.UInt) return `u${cv.value.toString()}`;

  if (cv.type === ClarityType.StringASCII) return `"${escape(cv.value)}"`;
  if (cv.type === ClarityType.StringUTF8) return `u"${escape(cv.value)}"`;

  if (cv.type === ClarityType.PrincipalContract) return `'${cv.value}`;
  if (cv.type === ClarityType.PrincipalStandard) return `'${cv.value}`;

  if (cv.type === ClarityType.Buffer) return `0x${cv.value}`;

  if (cv.type === ClarityType.OptionalNone) return 'none';
  if (cv.type === ClarityType.OptionalSome)
    return `(some ${prettyPrintWithDepth(cv.value, space, depth)})`;

  if (cv.type === ClarityType.ResponseOk)
    return `(ok ${prettyPrintWithDepth(cv.value, space, depth)})`;
  if (cv.type === ClarityType.ResponseErr)
    return `(err ${prettyPrintWithDepth(cv.value, space, depth)})`;

  if (cv.type === ClarityType.List) {
    return formatList(cv, space, depth + 1);
  }
  if (cv.type === ClarityType.Tuple) {
    return formatTuple(cv, space, depth + 1);
  }

  // make sure that we exhausted all ClarityTypes
  exhaustiveCheck(cv);
}

/**
 * Format clarity values in clarity style strings with the ability to prettify
 * the result with line break end space indentation.
 * @param cv The Clarity Value to format
 * @param space The indentation size of the output string. There's no indentation and no line breaks if space = 0
 * @example
 * ```ts
 * prettyPrint(Cl.tuple({ id: Cl.uint(1), age: Cl.some(Cl.uint(42)) }))
 * // { age: (some u42), id: u1 }
 *
 * prettyPrint(Cl.tuple({ id: Cl.uint(1), age: Cl.some(Cl.uint(42)) }, 2))
 * // {
 * //   age: (some u42),
 * //   id: u1
 * // }
 * ```
 */
export function stringify(cv: ClarityValue, space = 0): string {
  return prettyPrintWithDepth(cv, space, 0);
}

/** @deprecated alias for {@link Cl.stringify} */
export const prettyPrint = stringify;
