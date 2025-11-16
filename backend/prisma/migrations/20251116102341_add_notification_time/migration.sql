-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "themePreference" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'en',
    "dataProcessingAgreed" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationTime" TEXT NOT NULL DEFAULT '18:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "successLimit" INTEGER NOT NULL DEFAULT 80,
    "failureLimit" INTEGER NOT NULL DEFAULT 20
);
INSERT INTO "new_User" ("createdAt", "dataProcessingAgreed", "email", "failureLimit", "id", "language", "name", "notificationsEnabled", "password", "successLimit", "themePreference", "updatedAt") SELECT "createdAt", "dataProcessingAgreed", "email", "failureLimit", "id", "language", "name", "notificationsEnabled", "password", "successLimit", "themePreference", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
