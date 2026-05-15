-- CreateTable
CREATE TABLE "cr5c7_projectcomment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "commentedBy" TEXT NOT NULL,
    "commentedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Open',
    CONSTRAINT "cr5c7_projectcomment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "cr5c7_projectmaster" ("cr5c7_ProjectMasterId") ON DELETE RESTRICT ON UPDATE CASCADE
);
