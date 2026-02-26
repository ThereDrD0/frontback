import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" }
});

export const api = {
  getProducts: async () => (await apiClient.get("/products")).data,
  createProduct: async (p) => (await apiClient.post("/products", p)).data,
  updateProduct: async (id, p) => (await apiClient.patch(`/products/${id}`, p)).data,
  deleteProduct: async (id) => (await apiClient.delete(`/products/${id}`)).data,
};