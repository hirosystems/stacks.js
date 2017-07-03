export {
  /**
   * Retrives the specified file from the app's data store.
   * @param {String} path - the path to the file to read
   * @returns {Promise} that resolves to the raw data in the file
   * or rejects with an error
   */
  getFile
} from 'blockstack-storage'

export {
  /**
   * Stores the data provided in the file specified.
   * @param {String} path - the path to store the data in
   * @param {String|Buffer} contents - the data to store in the file
   * @return {Promise} that resolves if the operation succeed and rejects
   * if it failed
   */
  putFile
} from 'blockstack-storage'
