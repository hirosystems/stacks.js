import { StacksMessage, serializeStacksMessage, deserializeStacksMessage } from '../src/types';
import { BytesReader } from '../src/bytesReader';
import { StacksMessageType } from '../src/constants';

export function serializeDeserialize<V extends StacksMessage, T extends StacksMessageType>(
  value: V,
  type: T
): V {
  const serialized = serializeStacksMessage(value);
  const byteReader = new BytesReader(serialized);
  return deserializeStacksMessage(byteReader, type) as V;
}
