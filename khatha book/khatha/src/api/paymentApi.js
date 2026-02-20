import axiosClient from "./axiosClient";

/**
 * Make payment
 */
export const makePayment = (customerId, data) => {
  return axiosClient.post(`/payments/${customerId}`, data);
};

/**
 * Get all payments (optional)
 */
export const getPayments = () => {
  return axiosClient.get("/payments");
};
