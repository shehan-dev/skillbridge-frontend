import axios from "axios";

// API Base URLs for all services
export const userApi = axios.create({ baseURL: "http://localhost:3000/users" });
export const bookingApi = axios.create({ baseURL: "http://localhost:4000/bookings" });
export const messagingApi = axios.create({ baseURL: "http://localhost:5000" });
export const reviewApi = axios.create({ baseURL: "http://localhost:6001" });
export const paymentApi = axios.create({ baseURL: "http://localhost:7000/payments" });
export const notificationApi = axios.create({ baseURL: "http://localhost:9000/notifications" });

// API instances array for interceptor setup
const apiInstances = [userApi, bookingApi, messagingApi, reviewApi, paymentApi, notificationApi];

// Attach token if present to all API instances
apiInstances.forEach(api => {
  api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
});

// Response interceptor for error handling
apiInstances.forEach(api => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );
});
  
