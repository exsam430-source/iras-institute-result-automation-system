import StudentProfile from '../models/StudentProfile.model.js';
import AuditLog from '../models/AuditLog.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { HTTP_STATUS, ROLES } from '../utils/constants.js';
import { gatherTranscriptData } from '../services/transcript.service.js';
import PDFDocument from 'pdfkit';

// ─── HELPER: Get student profile ID ───────────────────────────
const getStudentProfileId = async (req, paramId = null) => {
  if (req.user.role === ROLES.STUDENT) {
    const profile = await StudentProfile.findOne({ user: req.user._id }).lean();
    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found');
    }
    return profile._id;
  }
  if (!paramId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Student ID is required');
  }
  return paramId;
};

// ─── GET CURRENT SEMESTER TRANSCRIPT ─────────────────────────
export const getCurrentSemesterTranscript = asyncHandler(
  async (req, res, next) => {
    let profileId;
    try {
      profileId = await getStudentProfileId(req, req.params.studentId);
    } catch (err) {
      return next(err);
    }

    const studentProfile = await StudentProfile.findById(profileId).lean();
    if (!studentProfile) {
      return next(
        new ApiError(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
      );
    }

    const transcriptData = await gatherTranscriptData({
      studentProfileId: profileId,
      semester: studentProfile.currentSemester,
    });

    if (transcriptData.semesters.length === 0) {
      return next(
        new ApiError(
          HTTP_STATUS.NOT_FOUND,
          'No published results found for the current semester.'
        )
      );
    }

    await AuditLog.log({
      user: req.user._id,
      userSnapshot: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
      },
      action: 'TRANSCRIPT_GENERATED',
      resource: 'transcript',
      newData: {
        studentId: profileId,
        type: 'current-semester',
        semester: studentProfile.currentSemester,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { transcript: transcriptData },
        'Current semester transcript data fetched successfully'
      )
    );
  }
);

// ─── GET COMPLETE TRANSCRIPT ──────────────────────────────────
export const getCompleteTranscript = asyncHandler(async (req, res, next) => {
  let profileId;
  try {
    profileId = await getStudentProfileId(req, req.params.studentId);
  } catch (err) {
    return next(err);
  }

  const transcriptData = await gatherTranscriptData({
    studentProfileId: profileId,
  });

  if (transcriptData.semesters.length === 0) {
    return next(
      new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'No published results found. At least one semester must be published.'
      )
    );
  }

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'TRANSCRIPT_GENERATED',
    resource: 'transcript',
    newData: {
      studentId: profileId,
      type: 'complete',
      semesters: transcriptData.semesters.length,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { transcript: transcriptData },
      'Complete transcript data fetched successfully'
    )
  );
});

// ─── GET SPECIFIC SEMESTER TRANSCRIPT ────────────────────────
export const getSemesterTranscript = asyncHandler(async (req, res, next) => {
  const { semester } = req.params;

  let profileId;
  try {
    profileId = await getStudentProfileId(req, req.params.studentId);
  } catch (err) {
    return next(err);
  }

  const transcriptData = await gatherTranscriptData({
    studentProfileId: profileId,
    semester: parseInt(semester),
  });

  if (transcriptData.semesters.length === 0) {
    return next(
      new ApiError(
        HTTP_STATUS.NOT_FOUND,
        `No published result found for semester ${semester}`
      )
    );
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { transcript: transcriptData },
      `Semester ${semester} transcript data fetched successfully`
    )
  );
});

// ─── DOWNLOAD TRANSCRIPT PDF ──────────────────────────────────
export const downloadTranscriptPDF = asyncHandler(async (req, res, next) => {
  const { type = 'complete', semester } = req.query;

  // Use params.studentId for admin routes, query for student self
  const paramStudentId = req.params.studentId || req.query.studentId;

  let profileId;
  try {
    profileId = await getStudentProfileId(req, paramStudentId);
  } catch (err) {
    return next(err);
  }

  const options = {};
  if (type === 'semester' && semester) {
    options.semester = parseInt(semester);
  }

  const transcriptData = await gatherTranscriptData({
    studentProfileId: profileId,
    ...options,
  });

  if (transcriptData.semesters.length === 0) {
    return next(
      new ApiError(
        HTTP_STATUS.NOT_FOUND,
        'No published results found to generate PDF'
      )
    );
  }

  const pdfBuffer = await generateTranscriptPDF(transcriptData);

  const fileName = `transcript-${transcriptData.student.rollNumber}-${type}${
    semester ? `-sem${semester}` : ''
  }.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  await AuditLog.log({
    user: req.user._id,
    userSnapshot: {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
    action: 'TRANSCRIPT_GENERATED',
    resource: 'transcript',
    newData: { type, semester, format: 'PDF' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.send(pdfBuffer);
});

// ─── PDF GENERATION ───────────────────────────────────────────
const generateTranscriptPDF = async (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
      info: {
        Title: `Official Transcript - ${data.student.fullName}`,
        Author: data.university.name,
        Subject: 'Academic Transcript',
        Creator: 'IRAS - University of Swat',
      },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const primaryColor = '#1E3A5F';
    const secondaryColor = '#F59E0B';
    const textGray = '#4B5563';
    const lightGray = '#F3F4F6';
    const borderColor = '#E5E7EB';

    // ─── HEADER ──────────────────────────────────────────────
    doc.rect(doc.page.margins.left, 30, pageWidth, 5).fill(primaryColor);
    doc.rect(doc.page.margins.left, 35, pageWidth, 2).fill(secondaryColor);

    doc.moveDown(1.2);
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(primaryColor)
      .text(data.university.name.toUpperCase(), { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(textGray)
      .text(data.university.address || '', { align: 'center' });

    const contactParts = [
      data.university.phone && `Phone: ${data.university.phone}`,
      data.university.email && `Email: ${data.university.email}`,
      data.university.website && `Web: ${data.university.website}`,
    ].filter(Boolean);

    if (contactParts.length > 0) {
      doc.fontSize(9).text(contactParts.join('   |   '), { align: 'center' });
    }

    doc.moveDown(0.5);
    doc.rect(doc.page.margins.left, doc.y, pageWidth, 1).fill(borderColor);
    doc.moveDown(0.3);

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(primaryColor)
      .text(
        data.transcriptSettings?.headerText ||
          'OFFICIAL TRANSCRIPT OF ACADEMIC RECORD',
        { align: 'center' }
      );

    doc.moveDown(0.3);
    doc.rect(doc.page.margins.left, doc.y, pageWidth, 1).fill(primaryColor);
    doc.moveDown(0.6);

    // ─── STUDENT INFO BOX ─────────────────────────────────────
    const boxTop = doc.y;
    const boxPadding = 12;
    const colWidth = (pageWidth - boxPadding * 2) / 2;

    doc
      .rect(doc.page.margins.left, boxTop, pageWidth, 120)
      .fillAndStroke(lightGray, borderColor);

    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        'STUDENT INFORMATION',
        doc.page.margins.left + boxPadding,
        boxTop + 8
      );

    const infoStartY = boxTop + 22;
    const leftCol = doc.page.margins.left + boxPadding;
    const rightCol = doc.page.margins.left + boxPadding + colWidth + 10;

    const leftInfo = [
      ['Student Name', data.student.fullName],
      ["Father's Name", data.student.fatherName],
      ['Roll Number', data.student.rollNumber],
      ['Registration No.', data.student.registrationNumber],
    ];

    const rightInfo = [
      [
        'Program',
        `${data.academic.degreeType || ''} ${data.academic.program || ''}`.trim(),
      ],
      ['Department', data.academic.department || 'N/A'],
      ['Institute', data.academic.institute || 'N/A'],
      ['Session', data.academic.session || 'N/A'],
    ];

    leftInfo.forEach(([label, value], i) => {
      const yPos = infoStartY + i * 22;
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(primaryColor)
        .text(label + ':', leftCol, yPos, { width: 90 });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#1F2937')
        .text(value || 'N/A', leftCol + 95, yPos, {
          width: colWidth - 95,
        });
    });

    rightInfo.forEach(([label, value], i) => {
      const yPos = infoStartY + i * 22;
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(primaryColor)
        .text(label + ':', rightCol, yPos, { width: 80 });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#1F2937')
        .text(value || 'N/A', rightCol + 85, yPos, {
          width: colWidth - 85,
        });
    });

    doc.y = boxTop + 128;
    doc.moveDown(0.5);

    // ─── SEMESTER RESULTS ─────────────────────────────────────
    for (const semData of data.semesters) {
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
        doc.moveDown(1);
      }

      const semHeaderY = doc.y;
      doc
        .rect(doc.page.margins.left, semHeaderY, pageWidth, 18)
        .fill(primaryColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('white')
        .text(
          `SEMESTER ${semData.semester}   |   Session: ${semData.session || 'N/A'}`,
          doc.page.margins.left + 8,
          semHeaderY + 5
        );

      doc.y = semHeaderY + 22;

      // Table header
      const tableHeaderY = doc.y;

      const drawTableHeader = (yPos) => {
        doc.rect(doc.page.margins.left, yPos, pageWidth, 16).fill('#334155');

        const headers = [
          { text: 'S#', x: doc.page.margins.left + 4, width: 24 },
          { text: 'Code', x: doc.page.margins.left + 32, width: 60 },
          { text: 'Course Title', x: doc.page.margins.left + 97, width: 155 },
          { text: 'Cr.H', x: doc.page.margins.left + 252, width: 40 },
          { text: 'Grade', x: doc.page.margins.left + 292, width: 42 },
          { text: 'G.Pts', x: doc.page.margins.left + 334, width: 42 },
          { text: 'Qual.Pts', x: doc.page.margins.left + 376, width: 48 },
        ];

        headers.forEach(({ text, x, width }) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor('white')
            .text(text, x, yPos + 4, { width, align: 'center' });
        });
      };

      drawTableHeader(tableHeaderY);
      doc.y = tableHeaderY + 18;

      semData.courses.forEach((course, idx) => {
        if (doc.y > doc.page.height - 150) {
          doc.addPage();
          drawTableHeader(doc.y);
          doc.y += 18;
        }

        const rowY = doc.y;
        const rowBg = idx % 2 === 0 ? 'white' : '#F8FAFC';

        doc.rect(doc.page.margins.left, rowY, pageWidth, 16).fill(rowBg);
        doc
          .rect(doc.page.margins.left, rowY, pageWidth, 16)
          .stroke(borderColor);

        const gradeColor = !course.isPassed
          ? '#EF4444'
          : ['A', 'A-'].includes(course.grade)
          ? '#059669'
          : textGray;

        const rowData = [
          { text: String(idx + 1), x: doc.page.margins.left + 4, width: 24, align: 'center' },
          { text: course.code || '', x: doc.page.margins.left + 32, width: 60, align: 'left' },
          { text: course.name || '', x: doc.page.margins.left + 97, width: 155, align: 'left' },
          { text: String(course.creditHours || ''), x: doc.page.margins.left + 252, width: 40, align: 'center' },
          { text: course.grade || '', x: doc.page.margins.left + 292, width: 42, align: 'center', color: gradeColor },
          { text: course.gradePoints?.toFixed(2) || '', x: doc.page.margins.left + 334, width: 42, align: 'center' },
          { text: course.qualityPoints?.toFixed(2) || '', x: doc.page.margins.left + 376, width: 48, align: 'center' },
        ];

        rowData.forEach(({ text, x, width, align, color }) => {
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor(color || '#1F2937')
            .text(text, x, rowY + 4, { width, align: align || 'left' });
        });

        doc.y = rowY + 16;
      });

      // Semester totals
      const totalsY = doc.y;
      doc
        .rect(doc.page.margins.left, totalsY, pageWidth, 18)
        .fillAndStroke('#EFF6FF', '#BFDBFE');

      doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor);

      doc.text(
        `Credits: Attempted ${semData.totalCreditHoursAttempted} | Earned ${semData.totalCreditHoursEarned}`,
        doc.page.margins.left + 6,
        totalsY + 5,
        { width: 250 }
      );

      doc.text(
        `Semester GPA: ${semData.semesterGPA?.toFixed(2) || '0.00'}`,
        doc.page.margins.left + 260,
        totalsY + 5,
        { width: 130 }
      );

      doc.text(
        `CGPA: ${semData.cumulativeGPA?.toFixed(2) || '0.00'}`,
        doc.page.margins.left + 390,
        totalsY + 5,
        { width: 110 }
      );

      doc.y = totalsY + 22;
      doc.moveDown(0.3);
    }

    // ─── SUMMARY ──────────────────────────────────────────────
    if (doc.y > doc.page.height - 180) doc.addPage();

    doc.moveDown(0.5);
    const summaryY = doc.y;

    doc
      .rect(doc.page.margins.left, summaryY, pageWidth, 18)
      .fill(primaryColor);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('white')
      .text('CUMULATIVE SUMMARY', doc.page.margins.left + 8, summaryY + 5);

    doc.y = summaryY + 22;
    const summaryBoxY = doc.y;

    doc
      .rect(doc.page.margins.left, summaryBoxY, pageWidth, 50)
      .fillAndStroke('#EFF6FF', '#BFDBFE');

    const summaryItems = [
      ['Total Cr.H Attempted', String(data.academic.totalCreditHoursAttempted || 0)],
      ['Total Cr.H Earned', String(data.academic.totalCreditHoursEarned || 0)],
      ['Cumulative GPA', `${data.academic.cumulativeGPA?.toFixed(2) || '0.00'} / 4.00`],
      ['Status', (data.student.enrollmentStatus || '').toUpperCase()],
    ];

    const summaryColW = pageWidth / 4;
    summaryItems.forEach(([label, value], i) => {
      const xPos = doc.page.margins.left + i * summaryColW + 8;
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(primaryColor)
        .text(label, xPos, summaryBoxY + 8, { width: summaryColW - 10 });
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#1F2937')
        .text(value, xPos, summaryBoxY + 28, { width: summaryColW - 10 });
    });

    doc.y = summaryBoxY + 58;
    doc.moveDown(0.8);

    // ─── GRADING SCALE ────────────────────────────────────────
    if (
      data.transcriptSettings?.showGradingScale !== false &&
      data.gradingScale?.length
    ) {
      if (doc.y > doc.page.height - 200) doc.addPage();

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(primaryColor)
        .text('GRADING SCALE', doc.page.margins.left, doc.y);

      doc.y += 14;
      const gsHeaderY = doc.y;

      doc.rect(doc.page.margins.left, gsHeaderY, pageWidth, 14).fill('#334155');

      ['Grade', 'Percentage', 'Grade Points', 'Description'].forEach(
        (h, i) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(7)
            .fillColor('white')
            .text(h, doc.page.margins.left + i * (pageWidth / 4) + 4, gsHeaderY + 3, {
              width: pageWidth / 4 - 8,
              align: 'center',
            });
        }
      );

      doc.y = gsHeaderY + 16;

      data.gradingScale.forEach((scale, i) => {
        const gsRowY = doc.y;
        doc
          .rect(doc.page.margins.left, gsRowY, pageWidth, 12)
          .fillAndStroke(i % 2 === 0 ? 'white' : '#F8FAFC', borderColor);

        [
          scale.grade,
          `${scale.minPercentage}% - ${scale.maxPercentage}%`,
          scale.gradePoints?.toFixed(2),
          scale.description,
        ].forEach((val, j) => {
          doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor('#1F2937')
            .text(
              String(val || ''),
              doc.page.margins.left + j * (pageWidth / 4) + 4,
              gsRowY + 2,
              { width: pageWidth / 4 - 8, align: 'center' }
            );
        });

        doc.y = gsRowY + 12;
      });

      doc.moveDown(0.5);
    }

    // ─── SIGNATURES ───────────────────────────────────────────
    if (doc.y > doc.page.height - 120) doc.addPage();

    doc.moveDown(1);
    const sigY = doc.y;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(textGray)
      .text(
        `Date of Issue: ${new Date().toLocaleDateString('en-PK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        doc.page.margins.left,
        sigY
      )
      .text(
        `Transcript No: ${data.transcriptNumber}`,
        doc.page.margins.left,
        sigY + 12
      );

    const sigColW = pageWidth / 3;
    const sig1X = doc.page.margins.left + sigColW;
    const sig2X = doc.page.margins.left + sigColW * 2;
    const sigLineY = sigY + 40;

    doc
      .moveTo(sig1X, sigLineY)
      .lineTo(sig1X + sigColW - 20, sigLineY)
      .stroke(primaryColor);

    doc
      .moveTo(sig2X, sigLineY)
      .lineTo(sig2X + sigColW - 10, sigLineY)
      .stroke(primaryColor);

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(primaryColor)
      .text(
        data.transcriptSettings?.controllerExamName || 'Controller of Examinations',
        sig1X,
        sigLineY + 4,
        { width: sigColW - 20, align: 'center' }
      )
      .text(
        data.transcriptSettings?.registrarName || 'Registrar',
        sig2X,
        sigLineY + 4,
        { width: sigColW - 10, align: 'center' }
      );

    // Footer
    const footerY = doc.page.height - doc.page.margins.bottom - 20;
    doc
      .rect(doc.page.margins.left, footerY - 8, pageWidth, 1)
      .fill(borderColor);

    doc
      .font('Helvetica-Oblique')
      .fontSize(7.5)
      .fillColor(textGray)
      .text(
        data.transcriptSettings?.footerText ||
          'This is an official document of the University of Swat. Any alteration renders it invalid.',
        doc.page.margins.left,
        footerY,
        { width: pageWidth, align: 'center' }
      );

    doc
      .rect(doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 5, pageWidth, 3)
      .fill(primaryColor);

    doc
      .rect(doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 8, pageWidth, 2)
      .fill(secondaryColor);

    doc.end();
  });
};