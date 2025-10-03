import { db } from '@/lib/db';

export interface ReservationStatus {
  reservationDays: number;
  expiredCount: number;
  activeCount: number;
  expiringSoon: Array<{
    id: string;
    empreendimento: string;
    quadra: string;
    lote: string;
    reservedAt: Date;
    reservedBy: string;
    hoursUntilExpiry: number;
  }>;
}

export class ReservationService {
  /**
   * Verificar reservas expiradas e atualizar seu status para disponível
   */
  static async checkAndProcessExpiredReservations(): Promise<{
    processedCount: number;
    updatedLots: Array<{
      id: string;
      empreendimento: string;
      quadra: string;
      lote: string;
      newStatus: string;
    }>;
  }> {
    try {
      // Obter configurações do sistema para encontrar dias de reserva
      const settings = await db.systemSettings.findFirst();
      const reservationDays = settings?.reservationDays || 3;

      // Calcular a data limite (data atual menos dias de reserva)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - reservationDays);
      cutoffDate.setHours(23, 59, 59, 999); // Final do dia

      // Encontrar todos os lotes reservados que expiraram
      const expiredLots = await db.lot.findMany({
        where: {
          status: 'RESERVADO',
          reservedAt: {
            lt: cutoffDate,
          },
        },
      });

      if (expiredLots.length === 0) {
        return { processedCount: 0, updatedLots: [] };
      }

      // Atualizar lotes expirados para status disponível
      const updatePromises = expiredLots.map(lot =>
        db.lot.update({
          where: { id: lot.id },
          data: {
            status: 'DISPONÍVEL',
            reservedAt: null,
            reservedBy: null,
          },
        })
      );

      const updatedLots = await Promise.all(updatePromises);

      return {
        processedCount: expiredLots.length,
        updatedLots: updatedLots.map(lot => ({
          id: lot.id,
          empreendimento: lot.empreendimento,
          quadra: lot.quadra,
          lote: lot.lote,
          newStatus: lot.status,
        })),
      };
    } catch (error) {
      console.error('Erro ao processar reservas expiradas:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas atuais do status de reservas
   */
  static async getReservationStatus(): Promise<ReservationStatus> {
    try {
      // Obter configurações do sistema para encontrar dias de reserva
      const settings = await db.systemSettings.findFirst();
      const reservationDays = settings?.reservationDays || 3;

      // Calcular a data limite (data atual menos dias de reserva)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - reservationDays);
      cutoffDate.setHours(23, 59, 59, 999); // Final do dia

      // Contar reservas expiradas
      const expiredCount = await db.lot.count({
        where: {
          status: 'RESERVADO',
          reservedAt: {
            lt: cutoffDate,
          },
        },
      });

      // Contar reservas ativas
      const activeCount = await db.lot.count({
        where: {
          status: 'RESERVADO',
          reservedAt: {
            gte: cutoffDate,
          },
        },
      });

      // Obter lista de lotes que expirarão em breve (próximas 24 horas)
      const soonToExpire = new Date();
      soonToExpire.setDate(soonToExpire.getDate() - reservationDays + 1);
      soonToExpire.setHours(0, 0, 0, 0); // Início do dia

      const expiringSoon = await db.lot.findMany({
        where: {
          status: 'RESERVADO',
          reservedAt: {
            lt: soonToExpire,
            gte: cutoffDate,
          },
        },
        select: {
          id: true,
          empreendimento: true,
          quadra: true,
          lote: true,
          reservedAt: true,
          reservedBy: true,
        },
      });

      return {
        reservationDays,
        expiredCount,
        activeCount,
        expiringSoon: expiringSoon.map(lot => {
          const expiryTime = lot.reservedAt!.getTime() + (reservationDays * 24 * 60 * 60 * 1000);
          const hoursUntilExpiry = Math.max(0, Math.floor((expiryTime - Date.now()) / (1000 * 60 * 60)));
          
          return {
            ...lot,
            reservedAt: lot.reservedAt,
            reservedBy: lot.reservedBy || '',
            hoursUntilExpiry,
          };
        }),
      };
    } catch (error) {
      console.error('Erro ao obter status de reserva:', error);
      throw error;
    }
  }

  /**
   * Reservar um lote e definir o timestamp da reserva
   */
  static async reserveLot(lotId: string, reservedBy: string): Promise<void> {
    try {
      await db.lot.update({
        where: { id: lotId },
        data: {
          status: 'RESERVADO',
          reservedAt: new Date(),
          reservedBy,
        },
      });
    } catch (error) {
      console.error('Erro ao reservar lote:', error);
      throw error;
    }
  }

  /**
   * Cancelar uma reserva de lote
   */
  static async cancelReservation(lotId: string): Promise<void> {
    try {
      await db.lot.update({
        where: { id: lotId },
        data: {
          status: 'DISPONÍVEL',
          reservedAt: null,
          reservedBy: null,
        },
      });
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      throw error;
    }
  }

  /**
   * Iniciar o serviço em segundo plano para verificar reservas expiradas
   */
  static startBackgroundService(): NodeJS.Timeout {
    // Verificar a cada hora (3600000 ms)
    const intervalMs = 60 * 60 * 1000;
    
    console.log(`Iniciando serviço de reserva em segundo plano (verificando a cada ${intervalMs / 1000 / 60} minutos)`);
    
    const interval = setInterval(async () => {
      try {
        const result = await this.checkAndProcessExpiredReservations();
        if (result.processedCount > 0) {
          console.log(`Processadas ${result.processedCount} reservas expiradas:`, result.updatedLots);
        }
      } catch (error) {
        console.error('Erro no serviço de reserva em segundo plano:', error);
      }
    }, intervalMs);

    // Executar imediatamente ao iniciar
    this.checkAndProcessExpiredReservations().catch(console.error);

    return interval;
  }

  /**
   * Parar o serviço em segundo plano
   */
  static stopBackgroundService(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    console.log('Serviço de reserva em segundo plano parado');
  }
}