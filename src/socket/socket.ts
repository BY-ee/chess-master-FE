import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (!socket) {
    const token = useAuthStore.getState().token;
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
