import * as consts from './constants';

// env variables for the react app
// https://create-react-app.dev/docs/adding-custom-environment-variables/

const THEMES = {
  black: '#000000',
  brick: '#bd2719',
  bus: '#0000bf',
  copper: '#00d7a7',
  coat: '#0072c6',
  engel: '#ffe977',
  fog: '#9fc9eb',
  gold: '#c2a251',
  metro: '#fd4f00',
  silver: '#dedfe1',
  summer: '#ffc61e',
  suomenlinna: '#f5a3c7',
  tram: '#009246',
  white: '#ffffff'
};

function envValueToBoolean(value, defaultValue) {
  const strValue = String(value).toLowerCase();
  if (
    value === false ||
    strValue === '' ||
    strValue === 'false' ||
    strValue === '0'
  ) {
    return false;
  }
  if (value === true || strValue === 'true' || strValue === '1') {
    return true;
  }
  return defaultValue;
}

export default {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.REACT_APP_API_URL,
  API_VERSION: process.env.REACT_APP_API_VERSION,
  RESULTS_PER_PAGE:
    parseInt(process.env.REACT_APP_RESULTS_PER_PAGE, 10) ||
    consts.DEFAULT_PAGE_SIZE,
  SEARCH_PAGE_SIZE:
    parseInt(process.env.REACT_APP_SEARCH_PAGE_SIZE, 10) ||
    consts.DEFAULT_SEARCH_PAGE_SIZE,
  PIWIK_URL: process.env.REACT_APP_PIWIK_URL,
  PIWIK_ID: process.env.REACT_APP_PIWIK_ID,
  STORAGE_PREFIX: process.env.REACT_APP_STORAGE_PREFIX || 'HELERM',
  GIT_VERSION: process.env.REACT_APP_GIT_VERSION,
  SITE_TITLE: process.env.REACT_APP_SITE_TITLE || '',
  FEEDBACK_URL: process.env.REACT_APP_FEEDBACK_URL,
  FACETED_SEARCH_LENGTH:
    parseInt(process.env.REACT_APP_FACETED_SEARCH_LENGTH, 10) ||
    consts.DEFAULT_FACETED_SEARCH_LENGTH,
  SITE_THEME: THEMES[process.env.REACT_APP_SITE_THEME] || THEMES.coat,
  SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
  SENTRY_REPORT_DIALOG: process.env.REACT_APP_SENTRY_REPORT_DIALOG,
  OIDC_URL: process.env.REACT_APP_OIDC_URL,
  OIDC_CLIENT_ID: process.env.REACT_APP_OIDC_CLIENT_ID,
  OIDC_RESPONSE_TYPE: process.env.REACT_APP_OIDC_RESPONSE_TYPE,
  OIDC_SCOPE: process.env.REACT_APP_OIDC_SCOPE,
  OIDC_TOKEN_URL: process.env.REACT_APP_OIDC_TOKEN_URL,
  OIDC_LOGGING: envValueToBoolean(process.env.REACT_APP_OIDC_LOGGING, false),
};
