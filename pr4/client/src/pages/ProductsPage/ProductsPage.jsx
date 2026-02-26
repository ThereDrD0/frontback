import React, { useEffect, useState } from "react";
import "./ProductsPage.scss";
import ProductsList from "../../components/ProductsList";
import ProductModal from "../../components/ProductModal";
import { api } from "../../api";

export default function ProductsPage() {
  const[products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const[modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    api.getProducts().then(setProducts).finally(() => setLoading(false));
  },[]);

  const openCreate = () => {
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setModalMode("edit");
    setEditingProduct(p);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить?")) return;
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmitModal = async (payload) => {
    if (modalMode === "create") {
      const newP = await api.createProduct(payload);
      setProducts((prev) =>[...prev, newP]);
    } else {
      const updP = await api.updateProduct(payload.id, payload);
      setProducts((prev) => prev.map((p) => (p.id === payload.id ? updP : p)));
    }
    closeModal();
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">Магазин Товаров</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Каталог</h1>
            <button className="btn btn--primary" onClick={openCreate}>+ Создать</button>
          </div>
          {loading ? <div>Загрузка...</div> : 
            <ProductsList products={products} onEdit={openEdit} onDelete={handleDelete} />}
        </div>
      </main>
      <ProductModal open={modalOpen} mode={modalMode} initial={editingProduct} onClose={closeModal} onSubmit={handleSubmitModal} />
    </div>
  );
}