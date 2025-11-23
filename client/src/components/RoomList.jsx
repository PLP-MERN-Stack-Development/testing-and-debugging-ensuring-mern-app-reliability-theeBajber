import React from 'react';

const RoomList = ({ rooms, activeRoom, onRoomClick }) => {
  return (
    <div className="room-list">
      {rooms.map(room => (
        <div
          key={room.id}
          className={`room-item ${activeRoom === room.id ? 'active' : ''}`}
          onClick={() => onRoomClick(room)}
        >
          <div className="room-icon">#</div>
          <div className="room-info">
            <span className="room-name">{room.name}</span>
            <span className="room-members">{room.userCount || room.users?.size || 0} members</span>
          </div>
          {room.isPrivate && <span className="private-badge">🔒</span>}
        </div>
      ))}
    </div>
  );
};

export default RoomList;