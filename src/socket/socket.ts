import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

let socket: Socket | null = null;

export const connectSocket = (token: string | null) => {
  if (!socket && token) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
};

export const getSocket = (token: string | null = null) => {
  if (!socket && token) {
    return connectSocket(token);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
