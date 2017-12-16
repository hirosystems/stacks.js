/*
 * This should theoretically import from '../../lib/index'
 * because deployed versions ship the lib/ directory, but since
 * the test logic leaves the lib/ directory deleted on a fail it's
 * more convenient for debugging to use the include from src/.
 * 
 * As long as the test logic doesn't get changed fundamentally,
 * this should work. This might bite developers while debugging!
 */
import * as blockstack from '../../src/index';


// TODO: Add tests for every typed method