import React, { useEffect, useState } from "react";

export default function UserModal({ open, initialUser, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialUser?.name ?? "");
    setAge(initialUser?.age ?? "");
  }, [open, initialUser]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      id: initialUser?.id,
      name,
      age: Number(age)
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Имя
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="label">
            Возраст
            <input
              className="input"
              type="number"
              value={age}
              onChange={(event) => setAge(event.target.value)}
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
