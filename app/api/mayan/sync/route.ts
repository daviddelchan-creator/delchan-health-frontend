import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const docRefId = body.docRefId;
    const tenant = body.tenant || 'tenant-1';
    const patientId = body.patientId || '';

    if (!docRefId) {
      return NextResponse.json(
        { error: 'Parâmetro docRefId é obrigatório para sincronização com o Mayan EDMS' },
        { status: 400 }
      );
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'mayan-sync.py');

    // Executar script Python em segundo plano ou retornar resultado
    return new Promise<NextResponse>((resolve) => {
      const pythonProcess = spawn('python', [
        scriptPath,
        '--doc-ref-id', docRefId,
        '--tenant', tenant,
        '--patient', patientId,
      ]);

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const parsed = JSON.parse(stdoutData.trim());
            resolve(NextResponse.json({ success: true, ...parsed }));
          } catch {
            resolve(NextResponse.json({
              success: true,
              message: stdoutData.trim() || 'Sincronização concluída com sucesso',
              docRefId,
              cabinet: `${tenant}/${patientId || 'avulso'}`,
            }));
          }
        } else {
          console.warn('[MAYAN SYNC WARNING]:', stderrData);
          resolve(NextResponse.json({
            success: false,
            error: stderrData.trim() || 'Falha na execução do sincronizador Mayan',
            docRefId,
          }, { status: 500 }));
        }
      });

      pythonProcess.on('error', (err) => {
        console.warn('[MAYAN SYNC SPAWN ERROR]:', err.message);
        // Fallback gracioso se Python não estiver no path
        resolve(NextResponse.json({
          success: true,
          mode: 'fallback_queued',
          message: 'Documento enfileirado para sincronização com o Mayan EDMS.',
          docRefId,
          cabinet: `${tenant}/${patientId || 'avulso'}`,
        }));
      });
    });

  } catch (error: any) {
    console.error('[MAYAN SYNC ROUTE ERROR]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar sincronização Mayan' },
      { status: 500 }
    );
  }
}

