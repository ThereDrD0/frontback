import React, { useEffect, useState } from "react";

export default function ProductModal({ open, initial, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initial?.name ?? "");
    setCategory(initial?.category ?? "");
    setDescription(initial?.description ?? "");
    setPrice(initial?.price ?? "");
    setStock(initial?.stock ?? "");
  }, [open, initial]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      id: initial?.id,
      name,
      category,
      description,
      price: Number(price),
      stock: Number(stock)
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            />
          </label>
          <label className="label">
            Описание
            <input
              className="input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </label>
          <label className="label">
            Цена
            <input
              className="input"
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </label>
          <label className="label">
            Остаток
            <input
              className="input"
              type="number"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              required
            />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
