import axios from "axios";

export const userApi = axios.create({ baseURL: "http://<user-service-lb>:3000" });
export const bookingApi = axios.create({ baseURL: "http://<booking-service-lb>:4000" });
export const messagingApi = axios.create({ baseURL: "http://<messaging-service-lb>:5000" });
export const reviewApi = axios.create({ baseURL: "http://<code-review-service-lb>:6000" });
export const paymentApi = axios.create({ baseURL: "http://<payment-service-lb>:7000" });

// Attach token if present
userApi.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
