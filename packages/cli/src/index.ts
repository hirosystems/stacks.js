#!/usr/bin/env node

import { CLIMain } from './cli';

export { CLIMain };
// implement just enough of window to be useful to blockstack.js.
// do this here, so we can be *sure* it's in RAM.
const localStorageRAM: Record<string, any> = {};

// @ts-ignore
declare let global: any;

global['window'] = {
  location: {
    origin: 'localhost',
  },
  localStorage: {
    getItem: function (itemName: string) {
      return localStorageRAM[itemName];
    },
    setItem: function (itemName: string, itemValue: any) {
      localStorageRAM[itemName] = itemValue;
    },
    removeItem: function (itemName: string) {
      delete localStorageRAM[itemName];
    },
  },
};

global['localStorage'] = global['window'].localStorage;

CLIMain();
