// server.ts - Next.js Standalone + Socket.IO
import { config } from 'dotenv';
import { setupSocket } from '@/lib/socket';
import { ReservationService } from '@/lib/reservation-service';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

// Carregar variáveis de ambiente
config();

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
      conf: dev ? undefined : { distDir: './.next' },
      // Garantir que o middleware seja carregado
      customServer: true
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Criar servidor HTTP que irá lidar com Next.js e Socket.IO
    const server = createServer(async (req, res) => {
      // Pular requisições socket.io do handler Next.js
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      
      try {
        // Usar o handler do Next.js que inclui o middleware
        await handle(req, res);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
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
    const gracefulShutdown = (signal: string) => {
      console.log(`\nReceived ${signal}, stopping services...`);
      
      if (reservationInterval) {
        ReservationService.stopBackgroundService(reservationInterval);
      }
      
      // Fechar o servidor
      server.close((err) => {
        if (err) {
          console.error('Error during server shutdown:', err);
          process.exit(1);
        }
        console.log('Server closed successfully');
        process.exit(0);
      });
      
      // Forçar fechamento após 5 segundos
      setTimeout(() => {
        console.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 5000);
    };

    // Manipular sinais de desligamento
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Manipular erros não capturados
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

    // Iniciar o servidor
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
      console.log(`> Reservation background service started`);
    });

    // Tratar erro de porta em uso
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${currentPort} is already in use.`);
        console.error('Please stop the existing process or use a different port.');
        console.error('You can kill the process with: taskkill /F /IM node.exe');
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
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
