import axiosClient from "./axiosClient";

/**
 * ✅ GET RETAILER PROFILE
 */
export const getRetailerProfile = () => {
    const retailerId = sessionStorage.getItem("retailerId");
    return axiosClient.get("/retailer/profile", {
        headers: { "X-Retailer-Id": retailerId }
    });
};

/**
 * ✅ UPDATE RETAILER PROFILE
 */
export const updateRetailerProfile = (data) => {
    const retailerId = sessionStorage.getItem("retailerId");
    return axiosClient.put("/retailer/profile", data, {
        headers: { "X-Retailer-Id": retailerId }
    });
};

/**
 * ✅ GET NEARBY RETAILERS BASED ON GPS LOCATION
 */
export const getNearbyRetailers = (lat, lng, radius = 10) => {
    return axiosClient.get("/retailer/nearby", {
        params: { lat, lng, radius }
    });
};
