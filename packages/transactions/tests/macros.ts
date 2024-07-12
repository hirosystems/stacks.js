import {
  StacksWire,
  StacksWireType,
  deserializeStacksWireBytes,
  serializeStacksWireBytes,
} from '../src';
import { BytesReader } from '../src/BytesReader';

export function serializeDeserialize<V extends StacksWire, T extends StacksWireType>(
  value: V,
  type: T
): V {
  const serialized = serializeStacksWireBytes(value);
  const byteReader = new BytesReader(serialized);
  return deserializeStacksWireBytes(byteReader, type) as V;
}
