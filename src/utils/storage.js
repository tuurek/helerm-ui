import { get, isString } from 'lodash';

import config from '../config';

/**
 *
 * @param {string} key
 * @returns {string}
 */
function buildStorageKey(key) {
  return [config.STORAGE_PREFIX, key].join('.');
}

/**
 *
 * @param {*} value
 * @returns {boolean}
 */
function isJson(value) {
  try {
    JSON.parse(value);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 *
 * @param {string} key
 */
export function getStorageItem(key) {
  const [root, ...rest] = key.split('.');
  const item = localStorage.getItem(buildStorageKey(root));
  const value = isJson(item) ? JSON.parse(item) : item;
  return rest.length ? get(value, rest.join('.')) : value;
}

/**
 *
 * @param {string} key
 * @param {*} value
 * @param callback
 */
export function setStorageItem(key, value, callback = null) {
  let storageValue = value;

  if (!isString(value)) {
    storageValue = JSON.stringify(value);
  }
  try {
    localStorage.setItem(buildStorageKey(key), storageValue);
    if (callback && typeof callback === 'function') {
      callback();
    }
  } catch (e) {
    // fall silently
  }
}

/**
 *
 * @param {string} key
 * @param callback
 */
export function removeStorageItem(key, callback = null) {
  localStorage.removeItem(buildStorageKey(key));
  if (callback && typeof callback === 'function') {
    callback();
  }
}
