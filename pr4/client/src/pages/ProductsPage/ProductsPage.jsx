import React, { useEffect, useState } from "react";
import "./ProductsPage.scss";
import ProductsList from "../../components/ProductsList";
import ProductModal from "../../components/ProductModal";
import { api } from "../../api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    api.getProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить товар?")) {
      return;
    }

    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const handleSubmitModal = async (payload) => {
    if (modalMode === "create") {
      const newProduct = await api.createProduct(payload);
      setProducts((prev) => [...prev, newProduct]);
    } else {
      const updatedProduct = await api.updateProduct(payload.id, payload);
      setProducts((prev) =>
        prev.map((product) => (product.id === payload.id ? updatedProduct : product))
      );
    }

    closeModal();
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">Магазин товаров</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Каталог</h1>
            <button className="btn btn--primary" onClick={openCreate}>
              Добавить товар
            </button>
          </div>
          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <ProductsList products={products} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </div>
      </main>
      <ProductModal
        open={modalOpen}
        initial={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
