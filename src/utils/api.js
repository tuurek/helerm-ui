import fetch from 'isomorphic-fetch';
import {
  forEach,
  merge
} from 'lodash';

import { getStorageItem } from './storage';

const ALLOWED_METHODS_WITHOUT_AUTHENTICATION = ['GET'];

/**
 *
 * @param endpoint
 * @param params
 * @param options
 * @returns {*}
 */
export function get (endpoint, params = {}, options = {}) {
  return callApi(endpoint, params, options);
}

/**
 *
 * @param endpoint
 * @param data
 * @param params
 * @param options
 * @returns {*}
 */
export function post (endpoint, data, params = {}, options = {}) {
  if (typeof data !== 'string') {
    data = JSON.stringify(data);
    options.headers = merge(
      { 'Content-Type': 'application/json' },
      options.headers
    );
  }
  return callApi(endpoint, params, merge({ body: data, method: 'POST' }, options));
}

/**
 *
 * @param endpoint
 * @param data
 * @param params
 * @param options
 * @returns {*}
 */
export function put (endpoint, data, params = {}, options = {}) {
  if (typeof data !== 'string') {
    data = JSON.stringify(data);
    options.headers = merge(
      { 'Content-Type': 'application/json' },
      options.headers
    );
  }
  return callApi(endpoint, params, merge({ body: data, method: 'PUT' }, options));
}

/**
 *
 * @param endpoint
 * @param params
 * @param options
 * @returns {*}
 */
export function del (endpoint, params = {}, options = { method: 'DELETE' }) {
  return callApi(endpoint, params, options);
}

/**
 *
 * @param endpoint
 * @param params
 * @param options
 * @returns {*}
 */
export function callApi (endpoint, params, options = {}) {
  const token = getStorageItem('token');
  const url = getApiUrl(endpoint, params);
  const finalOptions = merge({ method: 'GET', credentials: 'include' }, options);
  const defaultHeaders = {
    'Accept': 'application/json'
  };

  if (!token && !ALLOWED_METHODS_WITHOUT_AUTHENTICATION.includes(finalOptions.method)) {
    throw Error(`Following methods for API-endpoint require authentication: ${ALLOWED_METHODS_WITHOUT_AUTHENTICATION.join(', ')}`);
  }

  if (token) {
    defaultHeaders.Authorization = `JWT ${token}`;
  }

  finalOptions.headers = merge(new Headers(), defaultHeaders, options.headers || {});

  return fetch(url, options);
}

/**
 *
 * @param url
 * @param query
 * @returns {string}
 */
export function getApiUrl (url, query = {}) {
  const queryString = buildQueryString(query);
  return [API_URL, API_VERSION, url, queryString].join('/');
}

/**
 *
 * @param query
 * @returns {string}
 */
export function buildQueryString (query) {
  const pairs = [];

  forEach(query, (value, key) => {
    pairs.push([key, value].join('='));
  });

  return pairs.length ? '?' + pairs.join('&') : '';
}

export default { get, post, put, del };
