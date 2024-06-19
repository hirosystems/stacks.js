// todo: this file should hold the type definitions for more message types later
// needed now to fix a circular dependency issue in structuredDataSignature
import { StacksWireType } from './constants';

/** @deprecated  */
export interface StructuredDataSignatureWire {
  readonly type: StacksWireType.StructuredDataSignature;
  data: string;
}
