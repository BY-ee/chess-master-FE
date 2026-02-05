import React from 'react';
import { Users, Clock } from 'lucide-react';
import type { Room } from '../../hooks/useRooms';

interface RoomItemProps {
    room: Room;
    onJoin: (id: string) => void;
    getRelativeTime: (dateString: string) => string;
}

export const RoomItem = React.memo(({ room, onJoin, getRelativeTime }: RoomItemProps) => (
    <div
        className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 transition-colors border border-zinc-700 hover:border-zinc-600 group cursor-pointer"
        onClick={() => onJoin(room.roomId)}
    >
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1 text-zinc-100 group-hover:text-blue-400 transition-colors">
                    {room.roomName}
                </h3>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {room.hostUsername}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getRelativeTime(room.createdAt)}
                    </span>
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onJoin(room.roomId);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium text-sm text-white"
            >
                Join
            </button>
        </div>
    </div>
));

RoomItem.displayName = 'RoomItem';
