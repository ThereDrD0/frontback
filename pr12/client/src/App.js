import React, { useEffect, useState } from "react";
import axios from "axios";

const apiUrl = "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json"
  }
});

let refreshRequest = null;

function getAccessToken() {
  return localStorage.getItem("accessToken") || "";
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken") || "";
}

function setTokens(tokens) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

function getErrorMessage(error) {
  return error.response?.data?.error || "request failed";
}

async function refreshTokens() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("missing refresh token");
  }

  const response = await axios.post(`${apiUrl}/auth/refresh`, null, {
    headers: {
      "x-refresh-token": refreshToken,
      accept: "application/json"
    }
  });

  setTokens(response.data);
  return response.data.accessToken;
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (!getAccessToken() || !getRefreshToken()) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = refreshTokens().finally(() => {
          refreshRequest = null;
        });
      }

      const accessToken = await refreshRequest;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
);

const emptyAuth = {
  email: "",
  first_name: "",
  last_name: "",
  password: ""
};

const emptyProduct = {
  title: "",
  category: "",
  description: "",
  price: ""
};

const emptyUserForm = {
  id: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "user"
};

export default function App() {
  const [tab, setTab] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [createForm, setCreateForm] = useState(emptyProduct);
  const [editForm, setEditForm] = useState(emptyProduct);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const isSeller = user && (user.role === "seller" || user.role === "admin");
  const isAdmin = user && user.role === "admin";

  useEffect(() => {
    if (getAccessToken() && getRefreshToken()) {
      loadSession();
      return;
    }

    setLoading(false);
  }, []);

  async function loadSession() {
    try {
      const meResponse = await apiClient.get("/auth/me");
      const currentUser = meResponse.data;

      setUser(currentUser);

      const productsResponse = await apiClient.get("/products");
      setProducts(productsResponse.data);

      if (currentUser.role === "admin") {
        const usersResponse = await apiClient.get("/users");
        setUsers(usersResponse.data);
      } else {
        setUsers([]);
        setUserForm(emptyUserForm);
      }
    } catch (error) {
      clearTokens();
      setUser(null);
      setProducts([]);
      setUsers([]);
      setSelectedProduct(null);
      setUserForm(emptyUserForm);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    const response = await apiClient.get("/products");
    setProducts(response.data);
  }

  function updateAuthField(event) {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateCreateField(event) {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateEditField(event) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateUserField(event) {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleRegister(event) {
    event.preventDefault();

    try {
      await apiClient.post("/auth/register", authForm);
      setAuthForm(emptyAuth);
      setTab("login");
      setMessage("Пользователь создан");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    try {
      const response = await apiClient.post("/auth/login", {
        email: authForm.email,
        password: authForm.password
      });

      setTokens(response.data);
      setMessage("");
      await loadSession();
    } catch (error) {
      clearTokens();
      setMessage(getErrorMessage(error));
    }
  }

  function handleLogout() {
    clearTokens();
    setUser(null);
    setProducts([]);
    setUsers([]);
    setSelectedProduct(null);
    setSelectedId("");
    setEditForm(emptyProduct);
    setUserForm(emptyUserForm);
    setMessage("Выход выполнен");
  }

  async function handleCreateProduct(event) {
    event.preventDefault();

    try {
      await apiClient.post("/products", {
        ...createForm,
        price: Number(createForm.price)
      });
      setCreateForm(emptyProduct);
      await loadProducts();
      setMessage("Товар добавлен");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleLoadProduct(event) {
    event.preventDefault();

    try {
      const response = await apiClient.get(`/products/${selectedId}`);
      setSelectedProduct(response.data);
      setEditForm({
        title: response.data.title,
        category: response.data.category,
        description: response.data.description,
        price: String(response.data.price)
      });
      setMessage("");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleUpdateProduct(event) {
    event.preventDefault();

    if (!selectedProduct) {
      setMessage("Сначала загрузите товар");
      return;
    }

    try {
      const response = await apiClient.put(`/products/${selectedProduct.id}`, {
        ...editForm,
        price: Number(editForm.price)
      });
      setSelectedProduct(response.data);
      await loadProducts();
      setMessage("Товар обновлён");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleDeleteProduct(id) {
    try {
      await apiClient.delete(`/products/${id}`);
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
        setSelectedId("");
        setEditForm(emptyProduct);
      }
      await loadProducts();
      setMessage("Товар удалён");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function startEditUser(item) {
    setUserForm({
      id: item.id,
      email: item.email,
      first_name: item.first_name,
      last_name: item.last_name,
      role: item.role
    });
  }

  async function handleSaveUser(event) {
    event.preventDefault();

    if (!userForm.id) {
      setMessage("Выберите пользователя");
      return;
    }

    try {
      await apiClient.put(`/users/${userForm.id}`, {
        email: userForm.email,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        role: userForm.role
      });
      await loadSession();
      setMessage("Пользователь обновлён");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleBlockUser(id) {
    try {
      await apiClient.delete(`/users/${id}`);
      await loadSession();
      setMessage("Пользователь заблокирован");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  if (loading) {
    return <div className="app">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="app">
        {message ? <div className="message">{message}</div> : null}
        <div className="panel">
          <h1>Практика 12</h1>
          <p className="muted">Админ для проверки: admin@example.com / admin123</p>
          <div className="tabs">
            <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>
              Вход
            </button>
            <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>
              Регистрация
            </button>
          </div>
          {tab === "login" ? (
            <form className="form" onSubmit={handleLogin}>
              <input name="email" placeholder="Email" value={authForm.email} onChange={updateAuthField} />
              <input
                name="password"
                type="password"
                placeholder="Пароль"
                value={authForm.password}
                onChange={updateAuthField}
              />
              <button type="submit">Войти</button>
            </form>
          ) : (
            <form className="form" onSubmit={handleRegister}>
              <input
                name="first_name"
                placeholder="Имя"
                value={authForm.first_name}
                onChange={updateAuthField}
              />
              <input
                name="last_name"
                placeholder="Фамилия"
                value={authForm.last_name}
                onChange={updateAuthField}
              />
              <input name="email" placeholder="Email" value={authForm.email} onChange={updateAuthField} />
              <input
                name="password"
                type="password"
                placeholder="Пароль"
                value={authForm.password}
                onChange={updateAuthField}
              />
              <button type="submit">Зарегистрироваться</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {message ? <div className="message">{message}</div> : null}
      <div className="panel">
        <div className="row">
          <strong>
            {user.first_name} {user.last_name}
          </strong>
          <span className="muted">{user.email}</span>
          <span className="muted">Роль: {user.role}</span>
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="panel">
            <h2>Товары</h2>
            <div className="list">
              {products.length === 0 ? <div className="muted">Список пуст</div> : null}
              {products.map((product) => (
                <div className="item" key={product.id}>
                  <div>
                    #{product.id} {product.title}
                  </div>
                  <div className="muted">{product.category}</div>
                  <div className="row">
                    <button
                      onClick={() => {
                        setSelectedId(product.id);
                        setMessage("");
                      }}
                    >
                      Выбрать id
                    </button>
                    {isAdmin ? <button onClick={() => handleDeleteProduct(product.id)}>Удалить</button> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isSeller ? (
            <div className="panel">
              <h2>Создать товар</h2>
              <form className="form" onSubmit={handleCreateProduct}>
                <input name="title" placeholder="Название" value={createForm.title} onChange={updateCreateField} />
                <input
                  name="category"
                  placeholder="Категория"
                  value={createForm.category}
                  onChange={updateCreateField}
                />
                <textarea
                  name="description"
                  placeholder="Описание"
                  value={createForm.description}
                  onChange={updateCreateField}
                />
                <input name="price" placeholder="Цена" value={createForm.price} onChange={updateCreateField} />
                <button type="submit">Создать</button>
              </form>
            </div>
          ) : null}
        </div>

        <div>
          <div className="panel">
            <h2>Товар по id</h2>
            <form className="form" onSubmit={handleLoadProduct}>
              <input value={selectedId} onChange={(event) => setSelectedId(event.target.value)} placeholder="ID" />
              <button type="submit">Загрузить</button>
            </form>
            {selectedProduct ? (
              <div className="item">
                <h3>{selectedProduct.title}</h3>
                <p className="muted">{selectedProduct.category}</p>
                <p>{selectedProduct.description}</p>
                <p>Цена: {selectedProduct.price}</p>
              </div>
            ) : (
              <p className="muted">Товар не выбран</p>
            )}
          </div>

          {isSeller ? (
            <div className="panel">
              <h2>Обновить товар</h2>
              <form className="form" onSubmit={handleUpdateProduct}>
                <input name="title" placeholder="Название" value={editForm.title} onChange={updateEditField} />
                <input name="category" placeholder="Категория" value={editForm.category} onChange={updateEditField} />
                <textarea
                  name="description"
                  placeholder="Описание"
                  value={editForm.description}
                  onChange={updateEditField}
                />
                <input name="price" placeholder="Цена" value={editForm.price} onChange={updateEditField} />
                <button type="submit">Сохранить</button>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {isAdmin ? (
        <div className="grid">
          <div className="panel">
            <h2>Пользователи</h2>
            <div className="list">
              {users.map((item) => (
                <div className="item" key={item.id}>
                  <div>
                    #{item.id} {item.first_name} {item.last_name}
                  </div>
                  <div className="muted">{item.email}</div>
                  <div className="muted">Роль: {item.role}</div>
                  {item.isBlocked ? <div className="blocked">Заблокирован</div> : null}
                  <div className="row">
                    <button onClick={() => startEditUser(item)}>Редактировать</button>
                    {!item.isBlocked ? <button onClick={() => handleBlockUser(item.id)}>Блокировать</button> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Редактирование пользователя</h2>
            <form className="form" onSubmit={handleSaveUser}>
              <input value={userForm.id} placeholder="ID" readOnly />
              <input name="first_name" placeholder="Имя" value={userForm.first_name} onChange={updateUserField} />
              <input name="last_name" placeholder="Фамилия" value={userForm.last_name} onChange={updateUserField} />
              <input name="email" placeholder="Email" value={userForm.email} onChange={updateUserField} />
              <select name="role" value={userForm.role} onChange={updateUserField}>
                <option value="user">user</option>
                <option value="seller">seller</option>
                <option value="admin">admin</option>
              </select>
              <button type="submit">Сохранить</button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
