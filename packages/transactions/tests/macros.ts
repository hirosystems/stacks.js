import { StacksMessage, serializeStacksMessage, deserializeStacksMessage } from '../src/types';
import { BufferReader } from '../src/bufferReader';
import { StacksMessageType } from '../src/constants';

export function serializeDeserialize(value: StacksMessage, type: StacksMessageType): StacksMessage {
  const serialized = serializeStacksMessage(value);
  const bufferReader = new BufferReader(serialized);
  return deserializeStacksMessage(bufferReader, type);
}
