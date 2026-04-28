/**
 * Environment Configuration
 * Development, Staging, Production settings
 */

// Determine current environment
const ENV = process.env.NODE_ENV || 'development';

const CONFIG = {
  development: {
    name: 'development',
    apiUrl: 'http://localhost:5000/api',
    socketUrl: 'http://localhost:5000',
    logLevel: 'debug',
    enableDebugPanel: true,
    enableNetworkLogging: true,
    enableStorageLogging: true,
    apiTimeout: 30000,
  },
  
  staging: {
    name: 'staging',
    apiUrl: 'https://staging-api.smartlibrary.com/api',
    socketUrl: 'https://staging-api.smartlibrary.com',
    logLevel: 'warn',
    enableDebugPanel: false,
    enableNetworkLogging: false,
    enableStorageLogging: false,
    apiTimeout: 30000,
  },
  
  production: {
    name: 'production',
    apiUrl: 'https://api.smartlibrary.com/api',
    socketUrl: 'https://api.smartlibrary.com',
    logLevel: 'error',
    enableDebugPanel: false,
    enableNetworkLogging: false,
    enableStorageLogging: false,
    apiTimeout: 30000,
  },
};

// Get environment-specific config
export const getConfig = () => {
  const envConfig = CONFIG[ENV] || CONFIG.development;
  return {
    ...envConfig,
    environment: ENV,
  };
};

// Get specific config value
export const getConfigValue = (key, defaultValue = null) => {
  const config = getConfig();
  return config[key] !== undefined ? config[key] : defaultValue;
};

// Set environment (useful for testing)
export const setEnvironment = (env) => {
  process.env.NODE_ENV = env;
};

// Export default config
export default getConfig();
