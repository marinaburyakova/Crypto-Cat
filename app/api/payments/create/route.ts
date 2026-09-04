// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

type PaymentType = 'stars' | 'stripe' | 'crypto';

interface ProductItem {
  sku: string;
  name: string;
  priceStars: number;
  priceUSD?: number;
}

const PRODUCTS: Record<string, ProductItem> = {
  'premium_month': {
    sku: 'premium_month',
    name: 'Premium подписка (месяц)',
    priceStars: 150,
    priceUSD: 2.99
  },
  'premium_year': {
    sku: 'premium_year',
    name: 'Premium подписка (год)',
    priceStars: 1500,
    priceUSD: 29.99
  },
  'points_100': {
    sku: 'points_100',
    name: '100 баллов',
    priceStars: 50,
    priceUSD: 0.99
  },
  'points_1000': {
    sku: 'points_1000',
    name: '1000 баллов',
    priceStars: 450,
    priceUSD: 8.99
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, price, type, sku, paymentMethod } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing userId' },
        { status: 400 }
      );
    }

    if (!sku || !PRODUCTS[sku]) {
      return NextResponse.json(
        { error: 'Invalid or missing product SKU' },
        { status: 400 }
      );
    }

    const product = PRODUCTS[sku];
    const paymentType: PaymentType = paymentMethod || type || 'stars';

    if (paymentType !== 'stars') {
      return NextResponse.json(
        { error: 'Only Telegram Stars payment method is supported currently' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const uniquePayload = `stars_${sku}_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;

    // ✅ Исправлено: убираем metadata, так как его нет в схеме
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: product.priceStars,
        currency: 'STARS',
        payload: uniquePayload,
        sku: sku,
        status: 'PENDING'
      }
    });

    const rawToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const botToken = rawToken.replace(/[\r\n\t ]/g, '');

    if (!botToken) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' }
      });

      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      );
    }

    const tgUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

    const response = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: product.name,
        description: `Покупка: ${product.name}`,
        payload: uniquePayload,
        provider_token: "",
        currency: "XTR",
        prices: [{ 
          label: product.name, 
          amount: product.priceStars 
        }]
      })
    });

    const data = await response.json();

    if (!data.result) {
      console.error('Telegram API error:', data);
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' }
      });

      return NextResponse.json(
        { 
          error: data.description || 'Invoice creation failed',
          details: data
        },
        { status: 502 }
      );
    }

    // ✅ Исправлено: обновляем без metadata
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        // Можно использовать status или другое поле для хранения ссылки
        // Или создать отдельное поле invoiceLink в схеме
      }
    });

    return NextResponse.json({
      success: true,
      paymentId: transaction.id,
      invoiceLink: data.result,
      payload: uniquePayload,
      amount: product.priceStars,
      currency: 'XTR',
      product: {
        sku: sku,
        name: product.name
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json(
      { 
        error: 'Payment processing failed',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('paymentId');
    const userId = searchParams.get('userId');

    if (!paymentId && !userId) {
      return NextResponse.json(
        { error: 'Missing paymentId or userId' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: paymentId 
        ? { id: paymentId }
        : { userId: userId as string, status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt
        // updatedAt удален, так как его нет в схеме
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}