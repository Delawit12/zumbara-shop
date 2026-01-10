import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { clearAllCookies, getFromCookies } from "./store";

// export const API_BASE_URL = "https://backend.zumbarashop.com/api/v1";
export const API_BASE_URL = "https://nest-zumbara.onrender.com/api/v1";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getFromCookies("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // You can handle specific status codes here
    if (error.response) {
      switch (error.response.status) {
        case 401:
          clearAllCookies();
          break;
        case 403:
          // Handle forbidden access
          break;
        case 500:
          // Handle server errors
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
