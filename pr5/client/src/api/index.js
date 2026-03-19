import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    accept: "application/json"
  }
});

export const api = {
  createUser: async (user) => (await apiClient.post("/users", user)).data,
  getUsers: async () => (await apiClient.get("/users")).data,
  getUserById: async (id) => (await apiClient.get(`/users/${id}`)).data,
  updateUser: async (id, user) => (await apiClient.patch(`/users/${id}`, user)).data,
  deleteUser: async (id) => {
    await apiClient.delete(`/users/${id}`);
  }
};
