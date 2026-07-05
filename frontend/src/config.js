export const API =
  process.env.REACT_APP_API_URL || "http://192.168.56.1:5000";

export function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}
