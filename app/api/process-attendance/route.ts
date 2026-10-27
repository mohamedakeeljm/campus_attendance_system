import { NextRequest, NextResponse } from 'next/server';
import { processAttendanceFile } from '@/lib/attendanceProcessor';

// Vercel serverless configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max duration

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please upload a biometric attendance Excel file (.xls or .xlsx).' },
        { status: 400 }
      );
    }

    const filename = file.name || 'attendance.xls';
    const lowerFilename = filename.toLowerCase();

    if (!lowerFilename.endsWith('.xls') && !lowerFilename.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload an Excel file (.xls or .xlsx).' },
        { status: 400 }
      );
    }

    // Convert file to in-memory Buffer (no disk I/O, fully serverless compatible)
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Process attendance using our in-memory engine
    const result = processAttendanceFile(inputBuffer, filename);

    // Check if client requested JSON summary / preview
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    const acceptHeader = request.headers.get('accept') || '';

    if (format === 'json' || acceptHeader.includes('application/json')) {
      return NextResponse.json({
        success: true,
        headerTitle: result.headerTitle,
        sheetName: result.sheetName,
        periodText: result.periodText,
        totalEmployees: result.employees.length,
        totalDates: result.dateColumns.length,
        dateColumns: result.dateColumns.map((dc) => ({
          date: dc.date,
          dayOfWeek: dc.dayOfWeek,
          isWeekend: dc.isWeekend,
        })),
        employees: result.employees.map((emp) => ({
          id: emp.id,
          shortName: emp.shortName,
          fullName: emp.fullName,
          dept: emp.dept,
          dailyStatuses: emp.dailyStatuses,
          presentCount: emp.presentCount,
          weekendCount: emp.weekendCount,
          leaveCount: emp.leaveCount,
        })),
      });
    }

    // Default: Return the generated Excel workbook as a downloadable binary blob
    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    responseHeaders.set(
      'Content-Disposition',
      'attachment; filename="Staff Attandance.xlsx"'
    );
    responseHeaders.set('Cache-Control', 'no-store, max-age=0');
    responseHeaders.set('X-Header-Title', encodeURIComponent(result.headerTitle));
    responseHeaders.set('X-Sheet-Name', encodeURIComponent(result.sheetName));
    responseHeaders.set('X-Employee-Count', String(result.employees.length));

    return new NextResponse(new Uint8Array(result.outputBuffer), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error('Error processing attendance file:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred during processing.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
