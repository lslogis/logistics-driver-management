// API client wrapper for frontend

interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
}

export async function fetchAPI(url: string, options?: FetchOptions) {
  const { params, ...fetchOptions } = options || {};
  
  // Add query params if provided
  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Set default headers
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(finalUrl, {
      ...fetchOptions,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || data.message || `HTTP error! status: ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new APIError('Network error. Please check your connection.', 0);
    }
    
    throw new APIError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// API helper functions
export const api = {
  get: (url: string, params?: Record<string, any>) => 
    fetchAPI(url, { method: 'GET', params }),
  
  post: (url: string, body?: any, options?: FetchOptions) => 
    fetchAPI(url, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...options,
    }),
  
  put: (url: string, body?: any, options?: FetchOptions) => 
    fetchAPI(url, {
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...options,
    }),
  
  patch: (url: string, body?: any, options?: FetchOptions) => 
    fetchAPI(url, {
      method: 'PATCH',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...options,
    }),
  
  delete: (url: string, options?: FetchOptions) => 
    fetchAPI(url, { method: 'DELETE', ...options }),
};

// File upload helper
export async function uploadFile(url: string, file: File, fieldName = 'file') {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  return fetchAPI(url, {
    method: 'POST',
    body: formData,
  });
}

// Batch request helper
export async function batchRequest(requests: Array<{ url: string; options?: FetchOptions }>) {
  return Promise.all(
    requests.map(({ url, options }) => fetchAPI(url, options))
  );
}

// Retry helper with exponential backoff
export async function fetchWithRetry(
  url: string,
  options?: FetchOptions,
  maxRetries = 3,
  initialDelay = 1000
) {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchAPI(url, options);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}