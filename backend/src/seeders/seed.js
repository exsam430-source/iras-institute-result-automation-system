import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';
import User from '../models/User.model.js';
import Institute from '../models/Institute.model.js';
import Department from '../models/Department.model.js';
import Program from '../models/Program.model.js';
import Session from '../models/Session.model.js';
import Course from '../models/Course.model.js';
import StudentProfile from '../models/StudentProfile.model.js';
import SystemSettings from '../models/SystemSettings.model.js';
import { ROLES, GRADING_SCALE } from '../utils/constants.js';

// ─── COLORS FOR CONSOLE ───────────────────────────────────────
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

const log = (color, msg) =>
  console.log(`${colors[color]}${msg}${colors.reset}`);

// ─── SEED DATA ────────────────────────────────────────────────
const seedData = {
  // System settings
  systemSettings: {
    universityName: 'University of Swat',
    universityShortName: 'UoS',
    universityAddress: 'Mingora, Swat, Khyber Pakhtunkhwa, Pakistan',
    universityPhone: '+92-946-710487',
    universityEmail: 'info@uswat.edu.pk',
    universityWebsite: 'https://www.uswat.edu.pk',
    universityEstablishedYear: 2001,
    currentAcademicYear: new Date().getFullYear().toString(),
    gradingScale: GRADING_SCALE,
    marksSettings: {
      midTermTotal: 20,
      internalTotal: 20,
      finalTermTotal: 60,
      passingPercentage: 45,
      passingGrade: 'D',
    },
    transcriptSettings: {
      headerText: 'OFFICIAL TRANSCRIPT OF ACADEMIC RECORD',
      footerText:
        'This is an official document of the University of Swat. Any alteration renders it invalid.',
      controllerExamName: 'Controller of Examinations',
      registrarName: 'Registrar',
      showGradingScale: true,
      showCGPA: true,
      watermarkText: 'UNIVERSITY OF SWAT',
    },
    allowStudentResultView: true,
    allowTranscriptDownload: true,
    emailNotificationsEnabled: true,
  },

  // Super Admin
  superAdmin: {
    firstName: 'System',
    lastName: 'Administrator',
    email: 'superadmin@uswat.edu.pk',
    password: 'SuperAdmin@123',
    role: ROLES.SUPER_ADMIN,
    gender: 'male',
    isEmailVerified: true,
    isActive: true,
  },

  // Admin
  admin: {
    firstName: 'University',
    lastName: 'Admin',
    email: 'admin@uswat.edu.pk',
    password: 'Admin@123456',
    role: ROLES.ADMIN,
    gender: 'male',
    isEmailVerified: true,
    isActive: true,
  },

  // Institutes
  institutes: [
    {
      name: 'Institute of Computing',
      code: 'IOC',
      shortName: 'Computing',
      description:
        'The Institute of Computing at University of Swat offers cutting-edge programs in Computer Science, Software Engineering, Artificial Intelligence, and Information Technology.',
      vision:
        'To be a leading center of excellence in computing education and research.',
      mission:
        'To provide quality education in computing disciplines and produce graduates who can contribute to the technological advancement of society.',
      establishedYear: 2005,
      location: { building: 'Block-A', floor: '1st-3rd', campus: 'Main Campus' },
      contactEmail: 'ioc@uswat.edu.pk',
      contactPhone: '+92-946-710488',
    },
    {
      name: 'Institute of Management Sciences',
      code: 'IMS',
      shortName: 'Management',
      description:
        'The Institute of Management Sciences provides quality education in business administration, commerce, and economics.',
      establishedYear: 2006,
      location: { building: 'Block-B', floor: '1st-2nd', campus: 'Main Campus' },
      contactEmail: 'ims@uswat.edu.pk',
    },
    {
      name: 'Institute of Natural Sciences',
      code: 'INS',
      shortName: 'Sciences',
      description:
        'The Institute of Natural Sciences offers programs in Mathematics, Physics, Chemistry, and Biology.',
      establishedYear: 2007,
      location: { building: 'Block-C', floor: '1st-3rd', campus: 'Main Campus' },
      contactEmail: 'ins@uswat.edu.pk',
    },
  ],

  // Departments (for IOC)
  departments: [
    {
      name: 'Computer Science',
      code: 'CS',
      instituteCode: 'IOC',
      description: 'Department of Computer Science offering BS, MS programs.',
    },
    {
      name: 'Software Engineering',
      code: 'SE',
      instituteCode: 'IOC',
      description: 'Department of Software Engineering.',
    },
    {
      name: 'Artificial Intelligence',
      code: 'AI',
      instituteCode: 'IOC',
      description: 'Department of Artificial Intelligence.',
    },
    {
      name: 'Information Technology',
      code: 'IT',
      instituteCode: 'IOC',
      description: 'Department of Information Technology.',
    },
  ],

  // HoDs (one per department)
  hods: [
    {
      firstName: 'Dr. Ahmad',
      lastName: 'Ali Khan',
      email: 'hod.cs@uswat.edu.pk',
      password: 'HoD@123456',
      role: ROLES.HOD,
      gender: 'male',
      phone: '03001234567',
      departmentCode: 'CS',
      isEmailVerified: true,
    },
    {
      firstName: 'Dr. Sara',
      lastName: 'Nawaz',
      email: 'hod.se@uswat.edu.pk',
      password: 'HoD@123456',
      role: ROLES.HOD,
      gender: 'female',
      phone: '03001234568',
      departmentCode: 'SE',
      isEmailVerified: true,
    },
    {
      firstName: 'Dr. Bilal',
      lastName: 'Zafar',
      email: 'hod.ai@uswat.edu.pk',
      password: 'HoD@123456',
      role: ROLES.HOD,
      gender: 'male',
      phone: '03001234569',
      departmentCode: 'AI',
      isEmailVerified: true,
    },
    {
      firstName: 'Dr. Fatima',
      lastName: 'Rehman',
      email: 'hod.it@uswat.edu.pk',
      password: 'HoD@123456',
      role: ROLES.HOD,
      gender: 'female',
      phone: '03001234570',
      departmentCode: 'IT',
      isEmailVerified: true,
    },
  ],

  // Teachers (for CS department)
  teachers: [
    {
      firstName: 'Prof. Usman',
      lastName: 'Tariq',
      email: 'usman.tariq@uswat.edu.pk',
      password: 'Teacher@123',
      role: ROLES.TEACHER,
      gender: 'male',
      departmentCode: 'CS',
      isEmailVerified: true,
    },
    {
      firstName: 'Ms. Ayesha',
      lastName: 'Malik',
      email: 'ayesha.malik@uswat.edu.pk',
      password: 'Teacher@123',
      role: ROLES.TEACHER,
      gender: 'female',
      departmentCode: 'CS',
      isEmailVerified: true,
    },
    {
      firstName: 'Mr. Imran',
      lastName: 'Hussain',
      email: 'imran.hussain@uswat.edu.pk',
      password: 'Teacher@123',
      role: ROLES.TEACHER,
      gender: 'male',
      departmentCode: 'CS',
      isEmailVerified: true,
    },
  ],

  // Programs
  programs: [
    {
      name: 'Bachelor of Science in Computer Science',
      code: 'BSCS',
      degreeType: 'BS',
      totalSemesters: 8,
      totalCreditHours: 130,
      departmentCode: 'CS',
      instituteCode: 'IOC',
      description: 'A comprehensive 4-year program in Computer Science.',
      duration: '4 Years (8 Semesters)',
      eligibility: 'FSc Pre-Engineering / ICS with minimum 45% marks',
    },
    {
      name: 'Bachelor of Science in Software Engineering',
      code: 'BSSE',
      degreeType: 'BS',
      totalSemesters: 8,
      totalCreditHours: 132,
      departmentCode: 'SE',
      instituteCode: 'IOC',
      description: 'A comprehensive 4-year program in Software Engineering.',
      duration: '4 Years (8 Semesters)',
    },
    {
      name: 'Bachelor of Science in Artificial Intelligence',
      code: 'BSAI',
      degreeType: 'BS',
      totalSemesters: 8,
      totalCreditHours: 130,
      departmentCode: 'AI',
      instituteCode: 'IOC',
      description: 'A comprehensive 4-year program in Artificial Intelligence.',
      duration: '4 Years (8 Semesters)',
    },
    {
      name: 'Bachelor of Science in Information Technology',
      code: 'BSIT',
      degreeType: 'BS',
      totalSemesters: 8,
      totalCreditHours: 128,
      departmentCode: 'IT',
      instituteCode: 'IOC',
      description: 'A comprehensive 4-year program in Information Technology.',
      duration: '4 Years (8 Semesters)',
    },
  ],

  // Courses for BSCS Semester 1
  bscsCoursesS1: [
    {
      name: 'Introduction to Computing',
      code: 'CS-101',
      creditHours: 3,
      type: 'theory',
      category: 'core',
      semester: 1,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Calculus and Analytical Geometry',
      code: 'MATH-101',
      creditHours: 3,
      type: 'theory',
      category: 'general',
      semester: 1,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'English Composition and Comprehension',
      code: 'ENG-101',
      creditHours: 3,
      type: 'theory',
      category: 'general',
      semester: 1,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Islamic Studies / Ethics',
      code: 'ISL-101',
      creditHours: 2,
      type: 'theory',
      category: 'general',
      semester: 1,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Pakistan Studies',
      code: 'PST-101',
      creditHours: 2,
      type: 'theory',
      category: 'general',
      semester: 1,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
  ],

  // Courses for BSCS Semester 2
  bscsCoursesS2: [
    {
      name: 'Programming Fundamentals',
      code: 'CS-102',
      creditHours: 3,
      type: 'theory+lab',
      category: 'core',
      semester: 2,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Discrete Mathematics',
      code: 'MATH-102',
      creditHours: 3,
      type: 'theory',
      category: 'core',
      semester: 2,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Digital Logic Design',
      code: 'CS-103',
      creditHours: 3,
      type: 'theory+lab',
      category: 'core',
      semester: 2,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Communication Skills',
      code: 'ENG-102',
      creditHours: 2,
      type: 'theory',
      category: 'general',
      semester: 2,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
  ],

  // Courses for BSCS Semester 3
  bscsCoursesS3: [
    {
      name: 'Object Oriented Programming',
      code: 'CS-201',
      creditHours: 3,
      type: 'theory+lab',
      category: 'core',
      semester: 3,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Data Structures and Algorithms',
      code: 'CS-202',
      creditHours: 3,
      type: 'theory+lab',
      category: 'core',
      semester: 3,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Database Systems',
      code: 'CS-203',
      creditHours: 3,
      type: 'theory+lab',
      category: 'core',
      semester: 3,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
    {
      name: 'Linear Algebra',
      code: 'MATH-201',
      creditHours: 3,
      type: 'theory',
      category: 'general',
      semester: 3,
      marksDistribution: { midTerm: 20, internal: 20, finalTerm: 60 },
    },
  ],
};

// ─── MAIN SEED FUNCTION ───────────────────────────────────────
const runSeed = async () => {
  try {
    log('cyan', '\n🌱 Starting Database Seeder...\n');

    await connectDB();

    // ─── SYSTEM SETTINGS ──────────────────────────────────
    log('yellow', '⚙️  Seeding System Settings...');
    await SystemSettings.findOneAndUpdate(
      {},
      seedData.systemSettings,
      { upsert: true, new: true, runValidators: false }
    );
    log('green', '✅ System Settings seeded');

    // ─── SUPER ADMIN ───────────────────────────────────────
    log('yellow', '👑 Seeding Super Admin...');
    const existingSuperAdmin = await User.findOne({
      email: seedData.superAdmin.email,
    });

    let superAdmin;
    if (!existingSuperAdmin) {
      superAdmin = await User.create({
        ...seedData.superAdmin,
        mustChangePassword: false,
      });
      log('green', `✅ Super Admin created: ${seedData.superAdmin.email}`);
    } else {
      superAdmin = existingSuperAdmin;
      log('blue', `ℹ️  Super Admin already exists: ${seedData.superAdmin.email}`);
    }

    // ─── ADMIN ─────────────────────────────────────────────
    log('yellow', '🔑 Seeding Admin...');
    const existingAdmin = await User.findOne({
      email: seedData.admin.email,
    });

    let adminUser;
    if (!existingAdmin) {
      adminUser = await User.create({
        ...seedData.admin,
        createdBy: superAdmin._id,
        mustChangePassword: false,
      });
      log('green', `✅ Admin created: ${seedData.admin.email}`);
    } else {
      adminUser = existingAdmin;
      log('blue', `ℹ️  Admin already exists: ${seedData.admin.email}`);
    }

    // ─── INSTITUTES ────────────────────────────────────────
    log('yellow', '🏛️  Seeding Institutes...');
    const instituteMap = {};

    for (const instData of seedData.institutes) {
      const existing = await Institute.findOne({ code: instData.code });
      if (!existing) {
        const institute = await Institute.create({
          ...instData,
          createdBy: superAdmin._id,
        });
        instituteMap[instData.code] = institute;
        log('green', `  ✅ Institute: ${instData.name}`);
      } else {
        instituteMap[instData.code] = existing;
        log('blue', `  ℹ️  Institute exists: ${instData.name}`);
      }
    }

    // ─── DEPARTMENTS ───────────────────────────────────────
    log('yellow', '🏢 Seeding Departments...');
    const departmentMap = {};

    for (const deptData of seedData.departments) {
      const institute = instituteMap[deptData.instituteCode];
      if (!institute) continue;

      const existing = await Department.findOne({
        code: deptData.code,
        institute: institute._id,
      });

      if (!existing) {
        const dept = await Department.create({
          name: deptData.name,
          code: deptData.code,
          institute: institute._id,
          description: deptData.description,
          createdBy: superAdmin._id,
        });
        departmentMap[deptData.code] = dept;
        log('green', `  ✅ Department: ${deptData.name}`);
      } else {
        departmentMap[deptData.code] = existing;
        log('blue', `  ℹ️  Department exists: ${deptData.name}`);
      }
    }

    // ─── HODs ──────────────────────────────────────────────
    log('yellow', '👨‍💼 Seeding HoDs...');
    for (const hodData of seedData.hods) {
      const dept = departmentMap[hodData.departmentCode];
      const institute = dept
        ? await Institute.findById(dept.institute)
        : null;

      const existing = await User.findOne({ email: hodData.email });

      if (!existing) {
        const hod = await User.create({
          firstName: hodData.firstName,
          lastName: hodData.lastName,
          email: hodData.email,
          password: hodData.password,
          role: ROLES.HOD,
          gender: hodData.gender,
          phone: hodData.phone,
          department: dept?._id || null,
          institute: institute?._id || null,
          isEmailVerified: true,
          mustChangePassword: false,
          createdBy: superAdmin._id,
        });

        // Assign as HoD of department
        if (dept) {
          dept.hod = hod._id;
          await dept.save();
        }

        log('green', `  ✅ HoD: ${hodData.firstName} ${hodData.lastName} → ${hodData.departmentCode}`);
      } else {
        log('blue', `  ℹ️  HoD exists: ${hodData.email}`);
      }
    }

    // ─── TEACHERS ──────────────────────────────────────────
    log('yellow', '👨‍🏫 Seeding Teachers...');
    for (const teacherData of seedData.teachers) {
      const dept = departmentMap[teacherData.departmentCode];
      const institute = dept
        ? await Institute.findById(dept.institute)
        : null;

      const existing = await User.findOne({ email: teacherData.email });

      if (!existing) {
        await User.create({
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          email: teacherData.email,
          password: teacherData.password,
          role: ROLES.TEACHER,
          gender: teacherData.gender,
          department: dept?._id || null,
          institute: institute?._id || null,
          isEmailVerified: true,
          mustChangePassword: false,
          createdBy: adminUser._id,
        });
        log('green', `  ✅ Teacher: ${teacherData.firstName} ${teacherData.lastName}`);
      } else {
        log('blue', `  ℹ️  Teacher exists: ${teacherData.email}`);
      }
    }

    // ─── PROGRAMS ──────────────────────────────────────────
    log('yellow', '📚 Seeding Programs...');
    const programMap = {};

    for (const progData of seedData.programs) {
      const dept = departmentMap[progData.departmentCode];
      const institute = dept
        ? await Institute.findById(dept.institute)
        : null;

      if (!dept || !institute) continue;

      const existing = await Program.findOne({
        code: progData.code,
        department: dept._id,
      });

      if (!existing) {
        const program = await Program.create({
          name: progData.name,
          code: progData.code,
          degreeType: progData.degreeType,
          totalSemesters: progData.totalSemesters,
          totalCreditHours: progData.totalCreditHours,
          department: dept._id,
          institute: institute._id,
          description: progData.description,
          duration: progData.duration,
          eligibility: progData.eligibility,
          createdBy: superAdmin._id,
        });
        programMap[progData.code] = program;
        log('green', `  ✅ Program: ${progData.name}`);
      } else {
        programMap[progData.code] = existing;
        log('blue', `  ℹ️  Program exists: ${progData.name}`);
      }
    }

    // ─── SESSION ───────────────────────────────────────────
    log('yellow', '📅 Seeding Session (2023-2027 for BSCS)...');
    const bscsProgram = programMap['BSCS'];
    const csDept = departmentMap['CS'];
    const iocInstitute = instituteMap['IOC'];

    let bscsSession;
    if (bscsProgram && csDept && iocInstitute) {
      const existingSession = await Session.findOne({
        name: '2023-2027',
        program: bscsProgram._id,
      });

      if (!existingSession) {
        bscsSession = await Session.create({
          name: '2023-2027',
          startYear: 2023,
          endYear: 2027,
          program: bscsProgram._id,
          department: csDept._id,
          institute: iocInstitute._id,
          currentSemester: 1,
          isCurrent: true,
          isActive: true,
          admissionDate: new Date('2023-09-01'),
          createdBy: superAdmin._id,
        });
        log('green', '  ✅ Session: 2023-2027 (BSCS)');
      } else {
        bscsSession = existingSession;
        log('blue', '  ℹ️  Session exists: 2023-2027 (BSCS)');
      }
    }

    // ─── COURSES ───────────────────────────────────────────
    log('yellow', '📖 Seeding Courses (BSCS Semesters 1-3)...');
    const allCourses = [
      ...seedData.bscsCoursesS1,
      ...seedData.bscsCoursesS2,
      ...seedData.bscsCoursesS3,
    ];

    for (const courseData of allCourses) {
      if (!bscsProgram || !csDept || !iocInstitute) continue;

      const existing = await Course.findOne({
        code: courseData.code,
        program: bscsProgram._id,
      });

      if (!existing) {
        await Course.create({
          ...courseData,
          program: bscsProgram._id,
          department: csDept._id,
          institute: iocInstitute._id,
          createdBy: superAdmin._id,
        });
        log('green', `  ✅ Course: ${courseData.code} - ${courseData.name}`);
      } else {
        log('blue', `  ℹ️  Course exists: ${courseData.code}`);
      }
    }

    // ─── SAMPLE STUDENTS ───────────────────────────────────
    log('yellow', '👨‍🎓 Seeding Sample Students (5 for BSCS 2023-2027)...');
    if (bscsProgram && csDept && iocInstitute && bscsSession) {
      const sampleStudents = [
        {
          firstName: 'Ali', lastName: 'Khan', email: 'ali.khan.2023@uswat.edu.pk',
          fatherName: 'Raheem Khan', gender: 'male', cnic: '12345-1234561-1',
        },
        {
          firstName: 'Sara', lastName: 'Ahmed', email: 'sara.ahmed.2023@uswat.edu.pk',
          fatherName: 'Usman Ahmed', gender: 'female', cnic: '12345-1234562-2',
        },
        {
          firstName: 'Bilal', lastName: 'Zafar', email: 'bilal.zafar.2023@uswat.edu.pk',
          fatherName: 'Zafar Iqbal', gender: 'male', cnic: '12345-1234563-3',
        },
        {
          firstName: 'Hina', lastName: 'Malik', email: 'hina.malik.2023@uswat.edu.pk',
          fatherName: 'Malik Nawaz', gender: 'female', cnic: '12345-1234564-4',
        },
        {
          firstName: 'Omar', lastName: 'Farooq', email: 'omar.farooq.2023@uswat.edu.pk',
          fatherName: 'Farooq Ahmad', gender: 'male', cnic: '12345-1234565-5',
        },
      ];

      for (let i = 0; i < sampleStudents.length; i++) {
        const s = sampleStudents[i];
        const existing = await User.findOne({ email: s.email });

        if (!existing) {
          const studentUser = await User.create({
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            password: 'Student@123',
            role: ROLES.STUDENT,
            gender: s.gender,
            cnic: s.cnic,
            department: csDept._id,
            institute: iocInstitute._id,
            isEmailVerified: true,
            mustChangePassword: true,
            createdBy: adminUser._id,
          });

          const rollNumber = `IOC-CS-23-${String(i + 1).padStart(3, '0')}`;
          const regNumber = `2023-BSCS-${String(i + 1).padStart(4, '0')}`;

          await StudentProfile.create({
            user: studentUser._id,
            rollNumber,
            registrationNumber: regNumber,
            institute: iocInstitute._id,
            department: csDept._id,
            program: bscsProgram._id,
            session: bscsSession._id,
            currentSemester: 1,
            fatherName: s.fatherName,
            enrollmentStatus: 'active',
            admissionDate: new Date('2023-09-01'),
            admissionType: 'regular',
            createdBy: adminUser._id,
          });

          log('green', `  ✅ Student: ${s.firstName} ${s.lastName} (${rollNumber})`);
        } else {
          log('blue', `  ℹ️  Student exists: ${s.email}`);
        }
      }
    }

    // ─── SUMMARY ───────────────────────────────────────────
    log('cyan', '\n📊 Seed Summary:');
    const counts = await Promise.all([
      User.countDocuments(),
      Institute.countDocuments(),
      Department.countDocuments(),
      Program.countDocuments(),
      Session.countDocuments(),
      Course.countDocuments(),
      StudentProfile.countDocuments(),
    ]);

    const labels = ['Users', 'Institutes', 'Departments', 'Programs', 'Sessions', 'Courses', 'Student Profiles'];
    counts.forEach((count, i) => {
      log('magenta', `   ${labels[i]}: ${count}`);
    });

    log('cyan', '\n🔐 Default Credentials:');
    log('bright', '   Super Admin: superadmin@uswat.edu.pk / SuperAdmin@123');
    log('bright', '   Admin:       admin@uswat.edu.pk / Admin@123456');
    log('bright', '   HoD (CS):   hod.cs@uswat.edu.pk / HoD@123456');
    log('bright', '   Teacher:     usman.tariq@uswat.edu.pk / Teacher@123');
    log('bright', '   Student:     ali.khan.2023@uswat.edu.pk / Student@123');

    log('green', '\n✅ Database seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    log('red', `\n❌ Seed Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// ─── CLEAR DATABASE ───────────────────────────────────────────
const clearDatabase = async () => {
  try {
    log('red', '\n⚠️  Clearing Database...');
    await connectDB();

    const collections = Object.keys(mongoose.connection.collections);
    for (const name of collections) {
      await mongoose.connection.collections[name].deleteMany({});
      log('yellow', `  🗑️  Cleared: ${name}`);
    }

    log('green', '✅ Database cleared successfully!\n');
    process.exit(0);
  } catch (error) {
    log('red', `❌ Clear Error: ${error.message}`);
    process.exit(1);
  }
};

// ─── ENTRY POINT ──────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--clear')) {
  clearDatabase();
} else {
  runSeed();
}