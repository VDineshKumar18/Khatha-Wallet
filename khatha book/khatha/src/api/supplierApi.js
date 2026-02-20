import axiosClient from "./axiosClient";

const getRetailerId = () => sessionStorage.getItem("retailerId");

export const getSuppliers = () =>
    axiosClient.get("/suppliers", {
        headers: { "X-Retailer-Id": getRetailerId() },
    });

export const createSupplier = (supplier) =>
    axiosClient.post("/suppliers", supplier, {
        headers: { "X-Retailer-Id": getRetailerId() },
    });

export const updateSupplier = (id, supplier) =>
    axiosClient.put(`/suppliers/${id}`, supplier, {
        headers: { "X-Retailer-Id": getRetailerId() },
    });

export const deleteSupplier = (id) =>
    axiosClient.delete(`/suppliers/${id}`, {
        headers: { "X-Retailer-Id": getRetailerId() },
    });

export const getSupplierTransactions = (id) =>
    axiosClient.get(`/suppliers/${id}/transactions`, {
        headers: { "X-Retailer-Id": getRetailerId() },
    });

export const addSupplierTransaction = (id, data) =>
    axiosClient.post(`/suppliers/${id}/transact`, data, {
        headers: { "X-Retailer-Id": getRetailerId() },
    });
