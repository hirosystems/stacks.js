import { StacksWire, serializeStacksWireBytes, deserializeStacksWireBytes } from '../src/types';
import { BytesReader } from '../src/bytesReader';
import { StacksWireType } from '../src/constants';

export function serializeDeserialize<V extends StacksWire, T extends StacksWireType>(
  value: V,
  type: T
): V {
  const serialized = serializeStacksWireBytes(value);
  const byteReader = new BytesReader(serialized);
  return deserializeStacksWireBytes(byteReader, type) as V;
}
