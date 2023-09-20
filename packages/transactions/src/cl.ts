import { asciiToBytes, hexToBytes, utf8ToBytes } from '@stacks/common';
import {
  boolCV,
  bufferCV,
  contractPrincipalCV,
  deserializeCV,
  intCV,
  listCV,
  noneCV,
  responseErrorCV,
  responseOkCV,
  serializeCV,
  someCV,
  standardPrincipalCV,
  stringAsciiCV,
  stringUtf8CV,
  tupleCV,
  uintCV,
} from './clarity';

export { prettyPrint } from './clarity/prettyPrint';

// todo: https://github.com/hirosystems/clarinet/issues/786

// Primitives //////////////////////////////////////////////////////////////////
/**
 * `Cl.bool` — Creates a Clarity boolean type, represented as a JS object
 *
 * Alias for {@link boolCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const bool = boolCV;
/**
 * `Cl.int` — Creates a Clarity `int` type, represented as a JS object
 *
 * Alias for {@link intCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const int = intCV;
/**
 * `Cl.uInt` — Creates a Clarity `uint` type, represented as a JS object
 *
 * Alias for {@link uintCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const uint = uintCV;
/**
 * `Cl.contractPrincipal` — Creates a Clarity contract `principal` type, represented as a JS object
 *
 * Alias for {@link contractPrincipalCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const contractPrincipal = contractPrincipalCV;
/**
 * `Cl.standardPrincipal` — Creates a Clarity standard `principal` type, represented as a JS object
 *
 * Alias for {@link standardPrincipalCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const standardPrincipal = standardPrincipalCV;
// todo: add .principal method that detects `.` inside string for both standard and contract principals

// Sequences ///////////////////////////////////////////////////////////////////
/**
 * `Cl.list` — Creates a Clarity `list` type, represented as a JS object
 *
 * Alias for {@link listCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const list = listCV;
/**
 * `Cl.stringAscii` — Creates a Clarity `string-ascii` type, represented as a JS object
 *
 * Alias for {@link stringAsciiCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const stringAscii = stringAsciiCV;
/**
 * `Cl.stringUtf8` — Creates a Clarity `string-utf8` type, represented as a JS object
 *
 * Alias for {@link stringUtf8CV}
 * @see {@link serialize}, {@link deserialize}
 */
export const stringUtf8 = stringUtf8CV;
/**
 * `Cl.buffer` — Creates a Clarity `buffer` type, represented as a JS object
 *
 * Alias for {@link bufferCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const buffer = bufferCV;
/**
 * `Cl.bufferFromHex` — Converts bytes (from a hex string) to a Clarity `buffer` type, represented as a JS object
 * @param hex bytes encoded as a hex string
 * @returns input encoded as a {@link BufferCV}
 */
export const bufferFromHex = (hex: string) => bufferCV(hexToBytes(hex));
/**
 * `Cl.bufferFromAscii` — Converts bytes (from an ASCII string) to a Clarity `buffer` type, represented as a JS object
 * @param hex bytes encoded as an ASCII string
 * @returns input encoded as a {@link BufferCV}
 */
export const bufferFromAscii = (ascii: string) => bufferCV(asciiToBytes(ascii));
/**
 * `Cl.bufferFromUtf8` — Converts bytes (from an UTF-8 string) to a Clarity `buffer` type, represented as a JS object
 * @param hex bytes encoded as a UTF-8 string
 * @returns input encoded as a {@link BufferCV}
 */
export const bufferFromUtf8 = (utf8: string) => bufferCV(utf8ToBytes(utf8));

// Composites //////////////////////////////////////////////////////////////////
/**
 * `Cl.none` — Creates a Clarity optional `none` type, represented as a JS object
 *
 * Alias for {@link noneCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const none = noneCV;
/**
 * `Cl.some` — Creates a Clarity optional `some` type, represented as a JS object
 *
 * Alias for {@link someCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const some = someCV;
/**
 * `Cl.ok` — Creates a Clarity response `ok` type, represented as a JS object
 *
 * Alias for {@link responseOkCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const ok = responseOkCV;
/**
 * `Cl.error` — Creates a Clarity response `error` type, represented as a JS object
 *
 * Alias for {@link responseErrorCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const error = responseErrorCV;
/**
 * `Cl.tuple` — Creates a Clarity `tuple` type, represented as a JS object
 *
 * Alias for {@link tupleCV}
 * @see {@link serialize}, {@link deserialize}
 */
export const tuple = tupleCV;

// Methods /////////////////////////////////////////////////////////////////////
/**
 * `Cl.serialize` — Serializes a Clarity JS object to the equivalent hex-encoded representation
 *
 * Alias for {@link serializeCV}
 * @see {@link deserialize}
 */
export const serialize = serializeCV;
/**
 * `Cl.deserialize` — Deserializes a hex string to the equivalent Clarity JS object
 *
 * Alias for {@link deserializeCV}
 * @see {@link serialize}
 */
export const deserialize = deserializeCV;

// todo: add `deserializeReadable` methods that translates enums into name strings
