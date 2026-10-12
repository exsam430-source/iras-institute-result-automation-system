import ExcelJS from 'exceljs';

export const parseExcelBuffer = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file');
  }

  const rows = [];
  const headers = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        const val = cell.value
          ? cell.value.toString().trim().toLowerCase().replace(/\s+/g, '_')
          : '';
        headers.push(val);
      });
    } else {
      const rowData = {};
      let hasValue = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          let value = cell.value;

          if (value && typeof value === 'object' && value.result !== undefined) {
            value = value.result;
          }
          if (value && typeof value === 'object' && value.richText) {
            value = value.richText.map((rt) => rt.text).join('');
          }
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          }

          const strValue =
            value !== null && value !== undefined
              ? value.toString().trim()
              : null;

          rowData[header] = strValue;
          if (strValue) hasValue = true;
        }
      });

      if (hasValue) rows.push(rowData);
    }
  });

  return { headers, rows };
};

export const generateStudentImportTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students Import Template');

  worksheet.columns = [
    { header: 'First Name*', key: 'first_name', width: 20 },
    { header: 'Last Name*', key: 'last_name', width: 20 },
    { header: 'Email*', key: 'email', width: 30 },
    { header: 'Password*', key: 'password', width: 20 },
    { header: 'Father Name*', key: 'father_name', width: 25 },
    { header: 'CNIC', key: 'cnic', width: 20 },
    { header: 'Father CNIC', key: 'father_cnic', width: 20 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Gender (male/female)', key: 'gender', width: 22 },
    { header: 'Date of Birth (YYYY-MM-DD)', key: 'date_of_birth', width: 28 },
    { header: 'Blood Group', key: 'blood_group', width: 15 },
    { header: 'Guardian Phone', key: 'guardian_phone', width: 18 },
    { header: 'Admission Type', key: 'admission_type', width: 18 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 30;

  const sampleRow = worksheet.addRow({
    first_name: 'Ali',
    last_name: 'Khan',
    email: 'ali.khan@example.com',
    password: 'Password@123',
    father_name: 'Raheem Khan',
    cnic: '12345-1234567-1',
    father_cnic: '12345-1234567-2',
    phone: '03001234567',
    gender: 'male',
    date_of_birth: '2000-01-15',
    blood_group: 'A+',
    guardian_phone: '03001234567',
    admission_type: 'regular',
  });

  sampleRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEF2FF' },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const generateMarksExcel = async (assignmentData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Award List');

  const { course, teacher, session, semester, department, institute, entries } =
    assignmentData;

  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'UNIVERSITY OF SWAT - AWARD LIST';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8EFF8' },
  };
  worksheet.getRow(1).height = 35;

  worksheet.mergeCells('A2:E2');
  worksheet.getCell('A2').value = `Course: ${course?.name || 'N/A'} (${course?.code || 'N/A'})`;
  worksheet.getCell('A2').font = { bold: true, size: 11 };

  worksheet.mergeCells('F2:J2');
  worksheet.getCell('F2').value = `Teacher: ${teacher?.firstName || ''} ${teacher?.lastName || ''}`;

  worksheet.mergeCells('A3:E3');
  worksheet.getCell('A3').value = `Department: ${department?.name || 'N/A'} | Semester: ${semester || 'N/A'}`;

  worksheet.mergeCells('F3:J3');
  worksheet.getCell('F3').value = `Session: ${session?.name || 'N/A'} | Institute: ${institute?.name || 'N/A'}`;

  worksheet.addRow([]);

  worksheet.columns = [
    { key: 'sno', width: 6 },
    { key: 'rollNumber', width: 22 },
    { key: 'studentName', width: 28 },
    { key: 'fatherName', width: 28 },
    { key: 'program', width: 12 },
    { key: 'midTerm', width: 14 },
    { key: 'internal', width: 14 },
    { key: 'finalTerm', width: 16 },
    { key: 'total', width: 12 },
    { key: 'grade', width: 10 },
  ];

  const headers = [
    'S#', 'Roll Number', 'Student Name', 'Father Name', 'Program',
    'Mid-Term (/20)', 'Internal (/20)', 'Final Term (/60)', 'Total (/100)', 'Grade',
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 30;

  (entries || []).forEach((entry, index) => {
    const row = worksheet.addRow({
      sno: index + 1,
      rollNumber: entry.rollNumber || '',
      studentName: entry.studentName || '',
      fatherName: entry.fatherName || '',
      program: entry.program || '',
      midTerm: entry.midTermMarks ?? '',
      internal: entry.internalMarks ?? '',
      finalTerm: entry.finalTermMarks ?? '',
      total: entry.totalMarks ?? '',
      grade: entry.grade ?? '',
    });

    const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor },
      };
      cell.border = {
        top: { style: 'hair' },
        bottom: { style: 'hair' },
        left: { style: 'hair' },
        right: { style: 'hair' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const gradeCell = row.getCell(10);
    if (['A', 'A-'].includes(entry.grade)) {
      gradeCell.font = { bold: true, color: { argb: 'FF065F46' } };
    } else if (entry.grade === 'F') {
      gradeCell.font = { bold: true, color: { argb: 'FF991B1B' } };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};