const requiredEnvVars = [
  { key: 'NODE_ENV', description: 'Environment mode' },
  { key: 'PORT', description: 'Server port' },
  { key: 'MONGODB_URI', description: 'MongoDB connection string' },
  {
    key: 'JWT_ACCESS_SECRET',
    description: 'JWT access token secret',
    minLength: 32,
  },
  {
    key: 'JWT_REFRESH_SECRET',
    description: 'JWT refresh token secret',
    minLength: 32,
  },
  {
    key: 'JWT_EMAIL_SECRET',
    description: 'JWT email verification secret',
    minLength: 16,
  },
  {
    key: 'JWT_RESET_SECRET',
    description: 'JWT password reset secret',
    minLength: 16,
  },
  { key: 'CLIENT_URL', description: 'Frontend client URL' },
];

const optionalEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'JWT_ACCESS_EXPIRE',
  'JWT_REFRESH_EXPIRE',
  'BCRYPT_SALT_ROUNDS',
  'MAX_LOGIN_ATTEMPTS',
  'LOCK_TIME',
  'RATE_LIMIT_MAX',
  'UNIVERSITY_NAME',
];

export const validateEnv = () => {
  const missing = [];
  const warnings = [];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.key];

    if (!value) {
      missing.push(`${envVar.key} - ${envVar.description}`);
      continue;
    }

    if (envVar.minLength && value.length < envVar.minLength) {
      missing.push(
        `${envVar.key} must be at least ${envVar.minLength} characters (current: ${value.length})`
      );
    }
  }

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing or invalid required environment variables:');
    missing.forEach((v) => console.error(`   ✗ ${v}`));
    console.error('\n📋 Please check your .env file!\n');
    process.exit(1);
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️  Optional environment variables not set:');
    warnings.forEach((v) => console.warn(`   - ${v} (using defaults)`));
    console.warn('');
  }

  console.log('✅ Environment variables validated');
};