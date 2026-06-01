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
    if (body !== null && typeof body === 'object' && !(body instanceof FormData)) {
      config.body = JSON.stringify(body);
    } else {
      config.body = body;
    }
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    let errorMessage = `Une erreur est survenue (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
    }
    const error = new Error(errorMessage);
    error.status = res.status;
    error.isApiResponseError = true;
    throw error;
  }

  const contentType = res.headers?.get("content-type");
  if ((contentType && contentType.includes("application/json")) || (res.json && !res.headers)) {
    return res.json();
  }
  
  return res.text ? res.text() : "";
}
