import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Manipular mensagens
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Eco: transmitir mensagem apenas para o cliente que enviou a mensagem
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Manipular desconexão
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Enviar mensagem de boas-vindas
    socket.emit('message', {
      text: 'Bem-vindo ao Servidor WebSocket Echo!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};