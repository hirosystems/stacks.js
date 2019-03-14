import { SessionData, SessionOptions } from './sessionData';
/**
 * An abstract class representing the SessionDataStore interface.
 * @type {SessionData}
 */
export declare class SessionDataStore {
    constructor(sessionOptions?: SessionOptions);
    getSessionData(): SessionData;
    setSessionData(session: SessionData): boolean;
    deleteSessionData(): boolean;
}
/**
 * Stores session data in the instance of this class.
 * @type {InstanceDataStore}
 */
export declare class InstanceDataStore extends SessionDataStore {
    sessionData?: SessionData;
    constructor(sessionOptions?: SessionOptions);
    getSessionData(): SessionData;
    setSessionData(session: SessionData): boolean;
    deleteSessionData(): boolean;
}
/**
 * Stores session data in browser a localStorage entry.
 * @type {LocalStorageStore}
 */
export declare class LocalStorageStore extends SessionDataStore {
    key: string;
    constructor(sessionOptions?: SessionOptions);
    getSessionData(): SessionData;
    setSessionData(session: SessionData): boolean;
    deleteSessionData(): boolean;
}
