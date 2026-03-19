import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="productRow">
      <div className="productMain">
        <div>
          <strong>{product.name}</strong> ({product.category})
        </div>
        <div className="muted">{product.description}</div>
        <div>
          Цена: {product.price} руб. | Остаток: {product.stock}
        </div>
      </div>
      <div className="productActions">
        <button className="btn" onClick={() => onEdit(product)}>
          Изменить
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}
