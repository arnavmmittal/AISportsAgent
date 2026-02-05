import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mock report data - in production, this would fetch from database
const mockReports: Record<string, any> = {
  '1': {
    id: '1',
    title: 'Weekly Readiness Summary',
    type: 'weekly',
    dateRange: 'Dec 23-29, 2025',
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    keyInsights: [
      'Team avg readiness: 72/100 (↓6 points from last week)',
      '3 athletes in high-risk category (readiness <50)',
      'Finals week pattern detected - stress up 45%, sleep down 2.1hrs',
      'Sarah Johnson forecast: decline to 56/100 by game day (7 days)',
    ],
    readinessAvg: 72,
    performanceCorrelation: 'r=0.78 between readiness & points scored',
  },
  '2': {
    id: '2',
    title: 'Monthly Performance Correlation',
    type: 'monthly',
    dateRange: 'December 2025',
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    keyInsights: [
      'When readiness >85: Team scores avg 78 PPG',
      'When readiness <70: Team scores avg 62 PPG (-16 PPG)',
      'Sarah Johnson: r=0.82 correlation between readiness & individual PPG',
      'Sleep quality strongest predictor of next-day performance (r=0.71)',
    ],
    readinessAvg: 75,
    performanceCorrelation: 'Strong correlation found (r=0.78, p<0.01)',
  },
  '3': {
    id: '3',
    title: 'Intervention Outcomes Report',
    type: 'monthly',
    dateRange: 'December 2025',
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    keyInsights: [
      '12 interventions completed this month',
      '9 athletes improved readiness after intervention (75% success rate)',
      'Avg readiness improvement: +18 points post-intervention',
      'Most effective: sleep optimization coaching (+22 points avg)',
    ],
    readinessAvg: 78,
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    // Get report data (in production, fetch from database)
    const report = mockReports[reportId];

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Create PDF document
    const doc = new jsPDF();

    // Set colors
    const primaryBlue: [number, number, number] = [59, 130, 246]; // blue-600
    const primaryPurple: [number, number, number] = [147, 51, 234]; // purple-600
    const textGray: [number, number, number] = [55, 65, 81]; // gray-700

    // Header
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(report.title, 15, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(report.dateRange, 15, 30);

    // Reset text color
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);

    // Report metadata section
    let yPosition = 50;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Summary', 15, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Add metadata table
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Report Type', report.type.toUpperCase()],
        ['Date Range', report.dateRange],
        ['Generated', new Date(report.generatedAt).toLocaleDateString()],
        ['Team Avg Readiness', `${report.readinessAvg}/100`],
        ...(report.performanceCorrelation
          ? [['Performance Correlation', report.performanceCorrelation]]
          : []),
      ],
      theme: 'striped',
      headStyles: {
        fillColor: primaryBlue,
        fontSize: 10,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
      },
      margin: { left: 15, right: 15 },
    });

    // Get final Y position after table
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Key Insights section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Insights', 15, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    report.keyInsights.forEach((insight: string, index: number) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Number
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text(`${index + 1}.`, 15, yPosition);

      // Insight text
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);

      // Split text if too long
      const splitText = doc.splitTextToSize(insight, 170);
      doc.text(splitText, 25, yPosition);

      yPosition += splitText.length * 6 + 4;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Flow Sports Coach - Generated on ${new Date().toLocaleDateString()}`,
        15,
        290
      );
      doc.text(`Page ${i} of ${pageCount}`, 195, 290, { align: 'right' });
    }

    // Generate PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${reportId}-${report.dateRange.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
