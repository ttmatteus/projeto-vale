import { toast } from "@/hooks/use-toast";

export interface NotificationOptions {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  showToast?: boolean;
}

export class NotificationService {
  static async create(options: NotificationOptions) {
    const { title, message, type = 'info', showToast = true } = options;

    try {
      // Criar notificação no banco de dados
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          message,
          type: type.toUpperCase(),
        }),
      });

      if (response.ok) {
        // Exibir notificação toast se solicitado
        if (showToast) {
          toast({
            title,
            description: message,
            variant: type === 'error' ? 'destructive' : 'default',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      // Fallback apenas para toast
      if (showToast) {
        toast({
          title,
          description: message,
          variant: type === 'error' ? 'destructive' : 'default',
        });
      }
    }
  }

  static async success(title: string, message: string, showToast = true) {
    return this.create({ title, message, type: 'success', showToast });
  }

  static async error(title: string, message: string, showToast = true) {
    return this.create({ title, message, type: 'error', showToast });
  }

  static async warning(title: string, message: string, showToast = true) {
    return this.create({ title, message, type: 'warning', showToast });
  }

  static async info(title: string, message: string, showToast = true) {
    return this.create({ title, message, type: 'info', showToast });
  }
}

// Modelos de notificação pré-definidos
export const NotificationTemplates = {
  lotCreated: (quadra: string, lote: string) => ({
    title: 'Novo Lote Criado',
    message: `Lote ${quadra}-${lote} foi cadastrado no sistema.`,
    type: 'success' as const,
  }),

  lotUpdated: (quadra: string, lote: string) => ({
    title: 'Lote Atualizado',
    message: `Lote ${quadra}-${lote} foi atualizado.`,
    type: 'success' as const,
  }),

  lotDeleted: (quadra: string, lote: string) => ({
    title: 'Lote Excluído',
    message: `Lote ${quadra}-${lote} foi excluído do sistema.`,
    type: 'warning' as const,
  }),

  lotReserved: (quadra: string, lote: string) => ({
    title: 'Lote Reservado',
    message: `Lote ${quadra}-${lote} foi reservado.`,
    type: 'info' as const,
  }),

  lotSold: (quadra: string, lote: string) => ({
    title: 'Venda Concluída',
    message: `Venda do lote ${quadra}-${lote} foi finalizada.`,
    type: 'success' as const,
  }),

  proposalReceived: (quadra: string, lote: string) => ({
    title: 'Nova Proposta',
    message: `Proposta recebida para o Lote ${quadra}-${lote}.`,
    type: 'success' as const,
  }),

  empreendimentoCreated: (nome: string) => ({
    title: 'Novo Empreendimento',
    message: `Empreendimento "${nome}" foi criado.`,
    type: 'success' as const,
  }),

  quadraCreated: (nome: string) => ({
    title: 'Nova Quadra',
    message: `Quadra "${nome}" foi criada.`,
    type: 'success' as const,
  }),
};