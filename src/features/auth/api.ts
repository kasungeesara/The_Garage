export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  createdAt: string;
  role: "Customer" | "Seller" | "Admin";
  status: "Active" | "Suspended";
  emailVerified: boolean;
};

export class AuthError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/auth/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(20000),
      cache: 'no-store',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json', 'X-Garage-Client': 'web' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AuthError('Unable to connect. Please try again.', 0);
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status >= 500
      ? 'Authentication service is unavailable. Please try again shortly.'
      : Array.isArray(data?.message) ? data.message.join('. ') : data?.message;
    throw new AuthError(message || 'Request failed. Please try again.', response.status);
  }
  if (!data) throw new AuthError('Unexpected response from the authentication service.', response.status);
  return data;
}

export const auth = {
  login: (email: string, password: string) => request<{ user: AuthUser }>('login', { email, password }),
  signup: (data: { email: string; password: string; name: string; phone: string; city: string }) =>
    request<{ user: AuthUser }>('signup', data),
  me: () => request<{ user: AuthUser }>('me'),
  logout: () => request<void>('logout', {}),
};
