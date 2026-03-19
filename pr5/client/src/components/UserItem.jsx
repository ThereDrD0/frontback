import React from "react";

export default function UserItem({ user, onEdit, onDelete }) {
  return (
    <div className="userRow">
      <div className="userMain">
        <div>
          <strong>{user.name}</strong>
        </div>
        <div>Возраст: {user.age}</div>
      </div>
      <div className="userActions">
        <button className="btn" onClick={() => onEdit(user)}>
          Изменить
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(user.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}
