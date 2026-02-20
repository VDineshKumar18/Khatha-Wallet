import axiosClient from "./axiosClient";

export const notifyCustomer = async (customerId) => {
  const retailerId = sessionStorage.getItem("retailerId");

  if (!retailerId) {
    throw new Error("Retailer not logged in");
  }

  // ✅ NO BODY REQUIRED
  return axiosClient.post(
    `/notify/${customerId}`,
    null,
    {
      headers: {
        "X-Retailer-Id": retailerId,
      },
    }
  );
};
