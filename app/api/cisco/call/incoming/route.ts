import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: "Missing phone parameter" }, { status: 400 });
  }

  // Em um ambiente real com WebSockets ou SSE, notificaríamos o cliente
  // Como estamos testando client-side simulando a integração, este endpoint funciona
  // apenas para mock de recebimento (o client-side pode chamar um evento window para teste)
  console.log(`Recebendo chamada de ${phone}`);

  return NextResponse.json({ success: true, message: `Call notification for ${phone} processed on server` });
}
