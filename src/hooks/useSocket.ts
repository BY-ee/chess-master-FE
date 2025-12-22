import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = connectSocket();
    setSocket(socketInstance);
    
    // Optional: Connect explicitly if autoConnect is false
    if (!socketInstance.connected) {
        socketInstance.connect();
    }

    return () => {
      // Manage disconnection policy as needed. 
      // For now, we might want to keep it open unless explicit logout, 
      // but here we can disconnect on unmount of the root provider if we had one.
      // Or just leave it managed by the singleton.
    };
  }, []);

  return socket;
};
