/*
  Format Clarity Values into Clarity style readable strings
  eg:
  `Cl.uint(1)` => u1
  `Cl.list(Cl.uint(1))` => (list u1)
  `Cl.tuple({ id: u1 })` => { id: u1 }
*/

import { bytesToHex } from '@stacks/common';
import { ClarityType, ClarityValue, ListCV, TupleCV, principalToString } from '.';

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
  if (cv.list.length === 0) return '(list)';

  const spaceBefore = formatSpace(space, depth, false);
  const endSpace = space ? formatSpace(space, depth, true) : '';

  const items = cv.list.map(v => prettyPrintWithDepth(v, space, depth)).join(spaceBefore);

  return `(list${spaceBefore}${items}${endSpace})`;
}

/**
 * @description format Tuple clarity values in clarity style strings
 * with the ability to prettify the result with line break end space indentation
 * @example
 * ```ts
 * formatTuple(Cl.tuple({ id: Cl.uint(1) }))
 * // { id: u1 }
 *
 * formatTuple(Cl.tuple({ id: Cl.uint(1) }, 2))
 * // {
 * //   id: u1
 * // }
 * ```
 */
function formatTuple(cv: TupleCV, space: number, depth = 1): string {
  if (Object.keys(cv.data).length === 0) return '{}';

  const items: string[] = [];
  for (const [key, value] of Object.entries(cv.data)) {
    items.push(`${key}: ${prettyPrintWithDepth(value, space, depth)}`);
  }

  const spaceBefore = formatSpace(space, depth, false);
  const endSpace = formatSpace(space, depth, true);

  return `{${spaceBefore}${items.join(`,${spaceBefore}`)}${endSpace}}`;
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

  if (cv.type === ClarityType.StringASCII) return `"${cv.data}"`;
  if (cv.type === ClarityType.StringUTF8) return `u"${cv.data}"`;

  if (cv.type === ClarityType.PrincipalContract) return `'${principalToString(cv)}`;
  if (cv.type === ClarityType.PrincipalStandard) return `'${principalToString(cv)}`;

  if (cv.type === ClarityType.Buffer) return `0x${bytesToHex(cv.buffer)}`;

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
 * @description format clarity values in clarity style strings
 * with the ability to prettify the result with line break end space indentation
 * @param cv The Clarity Value to format
 * @param space The indentation size of the output string. There's no indentation and no line breaks if space = 0
 * @example
 * ```ts
 * prettyPrint(Cl.tuple({ id: Cl.some(Cl.uint(1)) }))
 * // { id: (some u1) }
 *
 * prettyPrint(Cl.tuple({ id: Cl.uint(1) }, 2))
 * // {
 * //   id: u1
 * // }
 * ```
 */
export function prettyPrint(cv: ClarityValue, space = 0): string {
  return prettyPrintWithDepth(cv, space, 0);
}
