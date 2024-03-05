/**
 * Clarity type names used for the human-readable representation of Clarity values
 */
export enum ClarityType {
  Int = 'int',
  UInt = 'uint',
  Buffer = 'buffer',
  BoolTrue = 'true',
  BoolFalse = 'false',
  PrincipalStandard = 'address',
  PrincipalContract = 'contract',
  ResponseOk = 'ok',
  ResponseErr = 'err',
  OptionalNone = 'none',
  OptionalSome = 'some',
  List = 'list',
  Tuple = 'tuple',
  StringASCII = 'ascii',
  StringUTF8 = 'utf8',
}

/**
 * Type IDs corresponding to each of the Clarity value types as described here:
 * {@link https://github.com/blockstack/blockstack-core/blob/sip/sip-005/sip/sip-005-blocks-and-transactions.md#clarity-value-representation}
 */
export enum ClarityWireType {
  int = 0x00,
  uint = 0x01,
  buffer = 0x02,
  true = 0x03,
  false = 0x04,
  address = 0x05,
  contract = 0x06,
  ok = 0x07,
  err = 0x08,
  none = 0x09,
  some = 0x0a,
  list = 0x0b,
  tuple = 0x0c,
  ascii = 0x0d,
  utf8 = 0x0e,
}

/** @ignore internal for now */
export function clarityTypeToByte(type: ClarityType): ClarityWireType {
  return ClarityWireType[type];
}

/** @ignore internal for now */
export function clarityByteToType(wireType: ClarityWireType): ClarityType {
  return ClarityWireType[wireType] as ClarityType; // numerical enums are bidirectional in TypeScript
}
