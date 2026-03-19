import React, { useEffect, useState } from "react";
import "./UsersPage.scss";
import UsersList from "../../components/UsersList";
import UserModal from "../../components/UserModal";
import { api } from "../../api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить пользователя?")) {
      return;
    }

    await api.deleteUser(id);
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const handleSubmitModal = async (payload) => {
    if (editingUser) {
      const updatedUser = await api.updateUser(payload.id, payload);
      setUsers((prev) => prev.map((user) => (user.id === payload.id ? updatedUser : user)));
    } else {
      const newUser = await api.createUser(payload);
      setUsers((prev) => [...prev, newUser]);
    }

    closeModal();
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">Пользователи</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Список пользователей</h1>
            <button className="btn btn--primary" onClick={openCreate}>
              Добавить пользователя
            </button>
          </div>
          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <UsersList users={users} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </div>
      </main>
      <UserModal
        open={modalOpen}
        initialUser={editingUser}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
