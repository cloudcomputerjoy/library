import Constants from 'expo-constants';

const DEFAULT_PORT = '5000';

const stripTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const normalizeApiBaseUrl = (url) => {
  const normalized = stripTrailingSlash(url.trim());
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const getExpoHost = () => {
  const candidates = [
    Constants?.expoConfig?.hostUri,
    Constants?.expoGoConfig?.debuggerHost,
    Constants?.manifest2?.extra?.expoClient?.hostUri,
    Constants?.manifest?.debuggerHost,
  ];

  const raw = candidates.find(Boolean);
  if (!raw) {
    return null;
  }

  return raw.split(':')[0];
};

export const getApiBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return normalizeApiBaseUrl(configured);
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_PORT}/api`;
};

export const getApiServerUrl = () => getApiBaseUrl().replace(/\/api$/, '');

export const API_BASE_URL = getApiBaseUrl();
export const API_SERVER_URL = getApiServerUrl();

export default API_BASE_URL;
