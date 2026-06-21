import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("Cannot get the backend url");
}

const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 50000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized access. Redirecting to login...");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
