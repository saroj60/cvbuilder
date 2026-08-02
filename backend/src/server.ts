import fs from 'fs';
import path from 'path';
 
// Global error logger to capture startup crashes in the File Manager on Hostinger
const logPath = path.join(__dirname, '../hostinger-debug.log');
function logErrorToFile(errorType: string, error: any) {
  try {
    const time = new Date().toISOString();
    const stack = error?.stack || error?.message || String(error);
    const logMessage = `[${time}] [${errorType}] ${stack}\n\n`;
    fs.appendFileSync(logPath, logMessage, 'utf8');
  } catch (e) {
    // ignore
  }
}
 
process.on('uncaughtException', (err) => {
  logErrorToFile('UNCAUGHT_EXCEPTION', err);
  process.exit(1);
});
 
process.on('unhandledRejection', (reason) => {
  logErrorToFile('UNHANDLED_REJECTION', reason);
  process.exit(1);
});
 
// Polyfill DOMMatrix for pdfjs-dist Node compatibility
if (typeof (global as any).DOMMatrix === 'undefined') {
  try {
    const { DOMMatrix } = require('canvas');
    (global as any).DOMMatrix = DOMMatrix || class DOMMatrix {};
  } catch (e) {
    (global as any).DOMMatrix = class DOMMatrix {};
  }
}
 
import app from './app';
import { env } from './config/env';
import { prisma, setDbConnected } from './config/prisma';
import bcrypt from 'bcryptjs';

const PORT = env.PORT || 5000;

async function startServer() {
  // Start Express server immediately so that Hostinger's proxy can connect to it without timeouts (resolves 503)
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on http://localhost:${PORT}`);
  });
 
  // Attempt PostgreSQL connection and seeding asynchronously in the background
  prisma.$connect()
    .then(async () => {
      setDbConnected(true);
      console.log(' Successfully connected to PostgreSQL Database');
 
      // Seed Admin User
      try {
        const adminEmail = 'nepalhrsolution@gmail.com';
        const adminPassword = 'nepalhrsolution';
        
        let adminRole = await prisma.role.findFirst({
          where: { name: 'ADMIN' },
        });
        if (!adminRole) {
          adminRole = await prisma.role.create({
            data: {
              name: 'ADMIN',
              description: 'Administrator role with full system access',
            },
          });
        }
 
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await prisma.user.upsert({
          where: { email: adminEmail },
          update: {
            password: hashedPassword,
            roleId: adminRole.id,
          },
          create: {
            name: 'Nepal HR Solution',
            email: adminEmail,
            password: hashedPassword,
            roleId: adminRole.id,
            isActive: true,
          },
        });
        console.log(`👤 Admin user ${adminEmail} verified/created in database.`);
      } catch (seedErr: any) {
        console.warn('⚠️ Admin database seeding failed:', seedErr.message);
      }
    })
    .catch((error: any) => {
      setDbConnected(false);
      console.warn('⚠️ PostgreSQL database offline. Server active in Instant Demo Mode. Detail:', error.message);
    });
}
 
startServer();
