import properties from "../properties/properties";


const buildUrl = (endpoint) => {
  // Ensure no double slashes
  return `${properties.api.baseURL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
};

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const apiInvoker = {
  get: async (endpoint, onSuccess, onError, customHeaders = {}) => {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: 'GET',
        headers: { ...defaultHeaders, ...customHeaders },
      });

      const data = await response.json();
      response.ok ? onSuccess(data) : onError(data);
    } catch (err) {
      onError({ error: 'Network error', details: err });
    }
  },

  post: async (endpoint, body, onSuccess, onError, customHeaders = {}) => {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: 'POST',
        headers: { ...defaultHeaders, ...customHeaders },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      response.ok ? onSuccess(data) : onError(data);
    } catch (err) {
      onError({ error: 'Network error', details: err });
    }
  },
};

export default apiInvoker;
