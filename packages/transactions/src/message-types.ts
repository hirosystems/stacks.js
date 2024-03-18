// todo: this file should hold the type definitions for more message types later
// needed now to fix a circular dependency issue in structuredDataSignature
import { StacksMessageType } from './constants';

export interface StructuredDataSignature {
  readonly type: StacksMessageType.StructuredDataSignature;
  data: string;
}
