import { StacksMessage, serializeStacksMessage, deserializeStacksMessage } from '../src/types';
import { ByteReader } from '../src/bytesReader';
import { StacksMessageType } from '../src/constants';

export function serializeDeserialize(value: StacksMessage, type: StacksMessageType): StacksMessage {
  const serialized = serializeStacksMessage(value);
  const byteReader = new ByteReader(serialized);
  return deserializeStacksMessage(byteReader, type);
}
