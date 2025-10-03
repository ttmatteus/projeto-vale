import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get the first (and only) system settings record
    let settings = await db.systemSettings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {},
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nomeSistema,
      logoUrl,
      corPrimaria,
      corSecundaria,
      moeda,
      formatoData,
      idioma,
      porcentagemPadrao,
      permitirEdicao,
      exigirAutenticacao,
      reservationDays,
      // Frontend field names
      company,
      description,
      externalReserveLink,
    } = body;

    // Check if settings already exist
    const existingSettings = await db.systemSettings.findFirst();

    let settings;
    if (existingSettings) {
      // Update existing settings
      const updateData: any = {
        nomeSistema: nomeSistema || company || existingSettings.nomeSistema,
        logoUrl: logoUrl !== undefined ? logoUrl : existingSettings.logoUrl,
        corPrimaria: corPrimaria || existingSettings.corPrimaria,
        corSecundaria: corSecundaria || existingSettings.corSecundaria,
        moeda: moeda || existingSettings.moeda,
        formatoData: formatoData || existingSettings.formatoData,
        idioma: idioma || existingSettings.idioma,
        porcentagemPadrao: porcentagemPadrao !== undefined ? parseFloat(porcentagemPadrao) : existingSettings.porcentagemPadrao,
        permitirEdicao: permitirEdicao !== undefined ? permitirEdicao : existingSettings.permitirEdicao,
        exigirAutenticacao: exigirAutenticacao !== undefined ? exigirAutenticacao : existingSettings.exigirAutenticacao,
        reservationDays: reservationDays !== undefined ? parseInt(reservationDays) : existingSettings.reservationDays,
        externalReserveLink: externalReserveLink !== undefined ? externalReserveLink : existingSettings.externalReserveLink,
      };
      
      settings = await db.systemSettings.update({
        where: { id: existingSettings.id },
        data: updateData,
      });
    } else {
      // Create new settings
      const createData: any = {
        nomeSistema: nomeSistema || company || "Sistema de Gestão de Lotes",
        logoUrl,
        corPrimaria: corPrimaria || "#3b82f6",
        corSecundaria: corSecundaria || "#64748b",
        moeda: moeda || "BRL",
        formatoData: formatoData || "DD/MM/YYYY",
        idioma: idioma || "pt-BR",
        porcentagemPadrao: porcentagemPadrao !== undefined ? parseFloat(porcentagemPadrao) : 10,
        permitirEdicao: permitirEdicao !== undefined ? permitirEdicao : true,
        exigirAutenticacao: exigirAutenticacao !== undefined ? exigirAutenticacao : true,
        reservationDays: reservationDays !== undefined ? parseInt(reservationDays) : 3,
        externalReserveLink: externalReserveLink || null,
      };
      
      settings = await db.systemSettings.create({
        data: createData,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}