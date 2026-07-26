export async function apiRequest(url, options = {}) {
  const { headers, body, ...rest } = options;
  const config = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = (typeof body === 'object' && !(body instanceof FormData)) ? JSON.stringify(body) : body;
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    let errorMessage = `Une erreur est survenue (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Reponse non-JSON
    }
    const error = new Error(errorMessage);
    error.status = res.status;
    error.isApiResponseError = true;
    throw error;
  }

  const hasHeaderGet = Boolean(res.headers && typeof res.headers.get === 'function');
  const contentType = hasHeaderGet ? res.headers.get("content-type") : null;

  if ((contentType && contentType.includes("application/json")) || (!contentType && typeof res.json === 'function')) {
    return res.json();
  }
  return typeof res.text === 'function' ? res.text() : "";
}
