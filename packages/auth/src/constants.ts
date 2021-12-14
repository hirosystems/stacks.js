/**
 * @ignore
 */
export const BLOCKSTACK_HANDLER = 'blockstack';
/**
 * @ignore
 */
export const BLOCKSTACK_STORAGE_LABEL = 'blockstack';
/**
 * This constant is used in the [[redirectToSignInWithAuthRequest]]
 */
export const DEFAULT_BLOCKSTACK_HOST = 'https://browser.blockstack.org/auth';

/**
 * Default user profile object
 */
export const DEFAULT_PROFILE = {
  '@type': 'Person',
  '@context': 'http://schema.org',
};

/**
 * Non-exhaustive list of common permission scopes.
 */
export const enum AuthScope {
  /**
   * Read and write data to the user's Gaia hub in an app-specific storage bucket.
   * This is the default scope.
   */
  store_write = 'store_write',
  /**
   * Publish data so that other users of the app can discover and interact with the user.
   * The user's files stored on Gaia hub are made visible to others via the `apps` property in the
   * user’s `profile.json` file.
   */
  publish_data = 'publish_data',
  /**
   * Request the user's email if available.
   */
  email = 'email',
}

/**
 * @ignore
 */
export const DEFAULT_SCOPE = [AuthScope.store_write];

/**
 * @ignore
 */
export const BLOCKSTACK_APP_PRIVATE_KEY_LABEL = 'blockstack-transit-private-key';

/**
 * @ignore
 */
export const DEFAULT_CORE_NODE = 'https://stacks-node-api.stacks.co';
/**
 * @ignore
 */
export const NAME_LOOKUP_PATH = '/v1/names';
/**
 * @ignore
 */
export const LOCALSTORAGE_SESSION_KEY = 'blockstack-session';
