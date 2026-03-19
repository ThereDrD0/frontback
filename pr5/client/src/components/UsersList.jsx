import React from "react";
import UserItem from "./UserItem";

export default function UsersList({ users, onEdit, onDelete }) {
  return (
    <div className="list">
      {users.map((user) => (
        <UserItem key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
