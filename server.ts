// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { ReservationService } from '@/lib/reservation-service';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Servidor personalizado com integração Socket.IO
async function createCustomServer() {
  let reservationInterval: NodeJS.Timeout | null = null;
  
  try {
    // Criar aplicação Next.js
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // Em produção, usar o diretório atual onde .next está localizado
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Criar servidor HTTP que irá lidar com Next.js e Socket.IO
    const server = createServer((req, res) => {
      // Pular requisições socket.io do handler Next.js
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Configurar Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Iniciar o serviço de reserva em segundo plano
    reservationInterval = ReservationService.startBackgroundService();

    // Manipulador de desligamento gracioso
    const gracefulShutdown = () => {
      console.log('Received shutdown signal, stopping services...');
      
      if (reservationInterval) {
        ReservationService.stopBackgroundService(reservationInterval);
      }
      
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
      
      // Forçar fechamento após 10 segundos
      setTimeout(() => {
        console.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Manipular sinais de desligamento
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Iniciar o servidor
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
      console.log(`> Reservation background service started`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    
    // Limpar serviços em caso de erro
    if (reservationInterval) {
      ReservationService.stopBackgroundService(reservationInterval);
    }
    
    process.exit(1);
  }
}

// Iniciar o servidor
createCustomServer();
