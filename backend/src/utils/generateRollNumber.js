import StudentProfile from '../models/StudentProfile.model.js';

export const generateRollNumber = async (institute, department, session) => {
  const instituteCode = institute.code.toUpperCase();
  const deptCode = department.code.toUpperCase();
  const sessionYear = new Date(session.startYear).getFullYear().toString().slice(-2);

  // Find the latest roll number for this combination
  const prefix = `${instituteCode}-${deptCode}-${sessionYear}`;

  const lastStudent = await StudentProfile.findOne({
    rollNumber: { $regex: `^${prefix}` },
  })
    .sort({ rollNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastStudent) {
    const lastNumber = parseInt(lastStudent.rollNumber.split('-').pop(), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
};

export const generateRegistrationNumber = async (program, session) => {
  const programCode = program.code.toUpperCase();
  const year = session.startYear;

  const lastStudent = await StudentProfile.findOne({
    registrationNumber: { $regex: `^${year}-${programCode}` },
  })
    .sort({ registrationNumber: -1 })
    .lean();

  let nextNumber = 1;
  if (lastStudent) {
    const parts = lastStudent.registrationNumber.split('-');
    nextNumber = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${year}-${programCode}-${String(nextNumber).padStart(4, '0')}`;
};