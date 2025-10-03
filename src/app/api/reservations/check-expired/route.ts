import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Get system settings to find reservation days
    const settings = await db.systemSettings.findFirst();
    const reservationDays = settings?.reservationDays || 3;

    // Calculate the cutoff date (current date minus reservation days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - reservationDays);

    // Find all reserved lots that have expired
    const expiredLots = await db.lot.findMany({
      where: {
        status: 'RESERVADO',
        reservedAt: {
          lt: cutoffDate,
        },
      },
    });

    if (expiredLots.length === 0) {
      return NextResponse.json({ 
        message: 'No expired reservations found',
        processedCount: 0 
      });
    }

    // Update expired lots to available status
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

    return NextResponse.json({ 
      message: `Processed ${expiredLots.length} expired reservations`,
      processedCount: expiredLots.length,
      updatedLots: updatedLots.map(lot => ({
        id: lot.id,
        empreendimento: lot.empreendimento,
        quadra: lot.quadra,
        lote: lot.lote,
        newStatus: lot.status
      }))
    });

  } catch (error) {
    console.error('Error processing expired reservations:', error);
    return NextResponse.json(
      { error: 'Failed to process expired reservations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get system settings to find reservation days
    const settings = await db.systemSettings.findFirst();
    const reservationDays = settings?.reservationDays || 3;

    // Calculate the cutoff date (current date minus reservation days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - reservationDays);

    // Count expired reservations
    const expiredCount = await db.lot.count({
      where: {
        status: 'RESERVADO',
        reservedAt: {
          lt: cutoffDate,
        },
      },
    });

    // Count active reservations
    const activeCount = await db.lot.count({
      where: {
        status: 'RESERVADO',
        reservedAt: {
          gte: cutoffDate,
        },
      },
    });

    // Get list of lots that will expire soon (within next 24 hours)
    const soonToExpire = new Date();
    soonToExpire.setDate(soonToExpire.getDate() - reservationDays + 1);

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

    return NextResponse.json({
      reservationDays,
      expiredCount,
      activeCount,
      expiringSoon: expiringSoon.map(lot => ({
        ...lot,
        hoursUntilExpiry: Math.max(0, Math.floor((lot.reservedAt!.getTime() + (reservationDays * 24 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60)))
      }))
    });

  } catch (error) {
    console.error('Error checking reservation status:', error);
    return NextResponse.json(
      { error: 'Failed to check reservation status' },
      { status: 500 }
    );
  }
}