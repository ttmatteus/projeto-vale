"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useLotsData } from "@/hooks/use-lots-data";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [empreendimentos, setEmpreendimentos] = useState<Array<{
    id: string;
    nome: string;
  }>>([]);
  const { user } = useAuth();
  const { lots } = useLotsData();

  // Obter ID do usuário atual logado
  const currentUserId = user?.id || "user1";

  // Carregar empreendimentos
  useEffect(() => {
    const loadEmpreendimentos = async () => {
      try {
        const response = await fetch('/api/empreendimentos');
        if (response.ok) {
          const data = await response.json();
          setEmpreendimentos(data);
        }
      } catch (error) {
        console.error('Erro ao carregar empreendimentos:', error);
      }
    };

    loadEmpreendimentos();
  }, []);

  // Função para obter nome do empreendimento pelo ID
  const getEmpreendimentoNome = useCallback((empreendimentoId: string) => {
    const empreendimento = empreendimentos.find(emp => emp.id === empreendimentoId);
    return empreendimento?.nome || empreendimentoId || "Desconhecido";
  }, [empreendimentos]);

  // Gerar notificações baseadas nos dados do usuário
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];

      // Lotes disponíveis recentemente (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentLots = lots.filter(lot => {
        const lotDate = new Date(lot.createdAt);
        return lot.status === 'DISPONÍVEL' && lotDate >= sevenDaysAgo;
      });

      if (recentLots.length > 0) {
        newNotifications.push({
          id: 'recent-lots',
          title: 'Novos lotes disponíveis',
          description: `${recentLots.length} novos lotes foram adicionados recentemente`,
          time: 'Agora pouco',
          type: 'info',
          read: false
        });
      }

      // Reservas do usuário próximas de expirar
      const userReservedLots = lots.filter(lot => 
        lot.status === 'RESERVADO' && lot.reservedBy === currentUserId
      );

      const now = new Date();
      
      // Verificar reservas que expiram em diferentes períodos
      const expiringToday = userReservedLots.filter(lot => {
        if (!lot.reservedAt) return false;
        const reservedDate = new Date(lot.reservedAt);
        const expirationDate = new Date(reservedDate);
        expirationDate.setDate(expirationDate.getDate() + 7); // Reserva expira em 7 dias
        
        // Verifica se expira hoje
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return expirationDate <= today;
      });

      const expiringTomorrow = userReservedLots.filter(lot => {
        if (!lot.reservedAt) return false;
        const reservedDate = new Date(lot.reservedAt);
        const expirationDate = new Date(reservedDate);
        expirationDate.setDate(expirationDate.getDate() + 7);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return expirationDate > today && expirationDate <= tomorrow;
      });

      const expiringIn3Days = userReservedLots.filter(lot => {
        if (!lot.reservedAt) return false;
        const reservedDate = new Date(lot.reservedAt);
        const expirationDate = new Date(reservedDate);
        expirationDate.setDate(expirationDate.getDate() + 7);
        
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(23, 59, 59, 999);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        return expirationDate > tomorrow && expirationDate <= threeDaysFromNow;
      });

      const expiringIn7Days = userReservedLots.filter(lot => {
        if (!lot.reservedAt) return false;
        const reservedDate = new Date(lot.reservedAt);
        const expirationDate = new Date(reservedDate);
        expirationDate.setDate(expirationDate.getDate() + 7);
        
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        sevenDaysFromNow.setHours(23, 59, 59, 999);
        
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(0, 0, 0, 0);
        
        return expirationDate > threeDaysFromNow && expirationDate <= sevenDaysFromNow;
      });

      // Gerar notificações específicas para cada período
      if (expiringToday.length > 0) {
        const lotDetails = expiringToday.map(lot => 
          `Lote ${lot.quadra}${lot.lote} (${getEmpreendimentoNome(lot.empreendimento)})`
        ).join(', ');
        
        newNotifications.push({
          id: 'expiring-today',
          title: '⚠️ RESERVAS EXPIRAM HOJE!',
          description: `Atenção urgente: ${expiringToday.length} reserva(s) expiram hoje! ${lotDetails}`,
          time: 'Expira hoje',
          type: 'error',
          read: false
        });
      }

      if (expiringTomorrow.length > 0) {
        const lotDetails = expiringTomorrow.map(lot => 
          `Lote ${lot.quadra}${lot.lote}`
        ).join(', ');
        
        newNotifications.push({
          id: 'expiring-tomorrow',
          title: '⏰ Reservas expiram amanhã',
          description: `${expiringTomorrow.length} reserva(s) expiram amanhã: ${lotDetails}`,
          time: 'Expira amanhã',
          type: 'warning',
          read: false
        });
      }

      if (expiringIn3Days.length > 0) {
        newNotifications.push({
          id: 'expiring-3days',
          title: '📅 Reservas próximas do vencimento',
          description: `${expiringIn3Days.length} reserva(s) expiram nos próximos 3 dias`,
          time: 'Próximos 3 dias',
          type: 'warning',
          read: false
        });
      }

      if (expiringIn7Days.length > 0) {
        newNotifications.push({
          id: 'expiring-7days',
          title: '📋 Reservas a vencer esta semana',
          description: `${expiringIn7Days.length} reserva(s) expiram nos próximos 7 dias`,
          time: 'Esta semana',
          type: 'info',
          read: false
        });
      }

      // Notificação geral se houver qualquer reserva próxima de vencer
      const totalExpiringSoon = expiringToday.length + expiringTomorrow.length + expiringIn3Days.length;
      if (totalExpiringSoon > 0 && expiringToday.length === 0) {
        newNotifications.push({
          id: 'expiring-soon',
          title: '⏳ Suas reservas estão próximas de vencer',
          description: `Você tem ${totalExpiringSoon} reserva(s) que vencem em breve. Não perca seus lotes!`,
          time: 'Ação necessária',
          type: 'warning',
          read: false
        });
      }

      // Propostas em andamento
      const userProposedLots = lots.filter(lot => 
        lot.status === 'EM PROPOSTA' && lot.reservedBy === currentUserId
      );

      if (userProposedLots.length > 0) {
        newNotifications.push({
          id: 'pending-proposals',
          title: 'Propostas aguardando resposta',
          description: `Você tem ${userProposedLots.length} propostas em análise`,
          time: 'Em andamento',
          type: 'info',
          read: false
        });
      }

      // Oportunidades (lotes com boas condições)
      const availableLots = lots.filter(lot => lot.status === 'DISPONÍVEL');
      const opportunities = availableLots.filter(lot => 
        lot.area > 300 || lot.valor < 500000
      );

      if (opportunities.length > 0) {
        newNotifications.push({
          id: 'opportunities',
          title: 'Oportunidades imperdíveis',
          description: `${opportunities.length} lotes com condições especiais disponíveis`,
          time: 'Disponível agora',
          type: 'success',
          read: false
        });
      }

      setNotifications(newNotifications);
    };

    generateNotifications();
  }, [lots, currentUserId, getEmpreendimentoNome]);

  // Contador de notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Marcar todas as notificações como lidas
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Remover uma notificação
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('notifications-dropdown');
      const button = document.getElementById('notifications-button');
      
      if (isOpen && dropdown && !dropdown.contains(event.target as Node) && !button?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
    }
  };

  return (
    <div className="relative">
      {/* Botão do sino */}
      <Button
        id="notifications-button"
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown de notificações */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para fechar ao clicar fora */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Card de notificações */}
            <motion.div
              id="notifications-dropdown"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute right-0 top-12 z-50 w-80 origin-top-right"
            >
              <div className="bg-background border rounded-lg shadow-lg shadow-black/10 dark:shadow-black/30">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-lg">Notificações</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs h-7 px-2"
                      >
                        Marcar todas como lidas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-7 w-7"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Conteúdo das notificações */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground text-center">
                        Nenhuma notificação
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer relative ${
                            !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                          onClick={() => {
                            // Marcar como lida ao clicar
                            if (!notification.read) {
                              setNotifications(prev => 
                                prev.map(n => 
                                  n.id === notification.id ? { ...n, read: true } : n
                                )
                              );
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`font-medium text-sm ${
                                  !notification.read ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {notification.title}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="h-6 w-6 flex-shrink-0 opacity-0 hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.description}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-2">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}