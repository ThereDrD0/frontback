import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="userRow">
      <div className="userMain">
        <div><strong>{product.name}</strong> ({product.category})</div>
        <div style={{opacity: 0.7}}>{product.description}</div>
        <div>Цена: {product.price} ₽ | На складе: {product.stock} шт.</div>
      </div>
      <div className="userActions">
        <button className="btn" onClick={() => onEdit(product)}>Ред.</button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>Удал.</button>
      </div>
    </div>
  );
}