import axiosClient from "./axiosClient";

/**
 * ✅ GET BILLS BY CUSTOMER
 */
export const getBillsByCustomer = (customerId) => {
  const retailerId = sessionStorage.getItem("retailerId");

  return axiosClient.get(`/bills/${customerId}`, {
    headers: {
      "X-Retailer-Id": retailerId,
    },
  });
};

/**
 * ✅ CREATE KHATHA / CUSTOMER BILL
 */
export const createBill = (customerId, billData) => {
  const retailerId = sessionStorage.getItem("retailerId");

  if (!customerId) {
    throw new Error("Customer ID is required for khatha bill");
  }

  return axiosClient.post(
    `/bills/${customerId}`,
    billData,
    {
      headers: {
        "X-Retailer-Id": retailerId,
        "Content-Type": "application/json",
      },
    }
  );
};

/**
 * ✅ CREATE PAID BILL (NO CUSTOMER)
 */
export const createPaidBill = (billData) => {
  const retailerId = sessionStorage.getItem("retailerId");

  return axiosClient.post(
    `/bills/paid`,
    billData,
    {
      headers: {
        "X-Retailer-Id": retailerId,
        "Content-Type": "application/json",
      },
    }
  );
};

/**
 * ✅ UPLOAD BILL IMAGE
 */
export const uploadBillImage = (billId, file) => {
  const retailerId = sessionStorage.getItem("retailerId");
  const formData = new FormData();
  formData.append("file", file);

  return axiosClient.post(`/bills/${billId}/image`, formData, {
    headers: {
      "X-Retailer-Id": retailerId,
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * ✅ GET ALL BILLS FOR RETAILER
 */
export const getAllBills = () => {
  const retailerId = sessionStorage.getItem("retailerId");

  return axiosClient.get("/bills", {
    headers: {
      "X-Retailer-Id": retailerId,
    },
  });
};
