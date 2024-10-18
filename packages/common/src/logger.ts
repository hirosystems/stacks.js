import { config } from './config';

const levels = ['debug', 'info', 'warn', 'error', 'none'];

const levelToInt: { [level: string]: number } = {};
const intToLevel: { [int: number]: string } = {};

for (let index = 0; index < levels.length; index++) {
  const level = levels[index];
  levelToInt[level] = index;
  intToLevel[index] = level;
}

/**
 * @ignore
 * @deprecated
 */
export class Logger {
  static error(message: string) {
    if (!this.shouldLog('error')) return;
    console.error(this.logMessage('error', message));
  }

  static warn(message: string) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.logMessage('warn', message));
  }

  static info(message: string) {
    if (!this.shouldLog('info')) return;
    console.log(this.logMessage('info', message));
  }

  static debug(message: string) {
    if (!this.shouldLog('debug')) return;
    console.log(this.logMessage('debug', message));
  }

  static logMessage(level: string, message: string) {
    return `[${level.toUpperCase()}] ${message}`;
  }

  static shouldLog(level: string) {
    const currentLevel = levelToInt[config.logLevel];
    return currentLevel <= levelToInt[level];
  }
}
