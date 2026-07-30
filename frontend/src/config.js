export const API =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:7860";

export function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
  };
}
