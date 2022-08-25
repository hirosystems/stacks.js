import { StacksMessage, serializeStacksMessage, deserializeStacksMessage } from '../src/types';
import { BytesReader } from '../src/bytesReader';
import { StacksMessageType } from '../src/constants';

export function serializeDeserialize(value: StacksMessage, type: StacksMessageType): StacksMessage {
  const serialized = serializeStacksMessage(value);
  const byteReader = new BytesReader(serialized);
  return deserializeStacksMessage(byteReader, type);
}
