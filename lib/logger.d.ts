export declare const levels: string[];
export declare class Logger {
    static error(message: string): void;
    static warn(message: string): void;
    static info(message: string): void;
    static debug(message: string): void;
    static logMessage(level: string, message: string): string;
    static shouldLog(level: string): boolean;
}
