import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket } from '../socket/socket';
import { useAuthStore } from '../store/useAuthStore';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const socketInstance = connectSocket(token);
    setSocket(socketInstance);
    
    // Optional: Connect explicitly if autoConnect is false
    if (socketInstance && !socketInstance.connected) {
        socketInstance.connect();
    }

    return () => {
      // Manage disconnection policy as needed. 
    };
  }, [token]);

  return socket;
};
