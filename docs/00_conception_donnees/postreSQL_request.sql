CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "Role" AS ENUM ('CLIENT', 'TECHNICIAN', 'ADMIN');

CREATE TYPE "InterventionStatus" AS ENUM (
  'PENDING',
  'SCHEDULED',
  'EN_ROUTE',
  'ON_SITE',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "User" (
  "id"          VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerkId"     VARCHAR   UNIQUE NOT NULL,
  "email"       VARCHAR   UNIQUE NOT NULL,
  "firstName"   VARCHAR,
  "lastName"    VARCHAR,
  "phone"       VARCHAR,
  "role"        "Role"    NOT NULL DEFAULT 'CLIENT',
  "isBlocked"   BOOLEAN   NOT NULL DEFAULT FALSE,
  "isAvailable" BOOLEAN   NOT NULL DEFAULT TRUE,
  "avatar"      VARCHAR,
  "lat"         FLOAT,
  "lng"         FLOAT,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "PushSubscription" (
  "id"        VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    VARCHAR   NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "endpoint"  VARCHAR   UNIQUE NOT NULL,
  "p256dh"    VARCHAR   NOT NULL,
  "auth"      VARCHAR   NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Bike" (
  "id"          VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  "brand"       VARCHAR   NOT NULL,
  "modelName"   VARCHAR,
  "type"        VARCHAR,
  "photos"      TEXT[]    NOT NULL DEFAULT '{}'::TEXT[],
  "imageUrl"    VARCHAR,
  "bikeIndexId" VARCHAR,
  "notes"       VARCHAR,
  "userId"      VARCHAR   NOT NULL REFERENCES "User"("id"),
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "ServicePackage" (
  "id"           VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"        VARCHAR   NOT NULL,
  "description"  VARCHAR   NOT NULL,
  "price"        FLOAT     NOT NULL,
  "duration_min" INT       NOT NULL DEFAULT 30,
  "image"        VARCHAR,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "RepairRequest" (
  "id"               VARCHAR              PRIMARY KEY DEFAULT gen_random_uuid(),
  "address"          VARCHAR              NOT NULL,
  "lat"              FLOAT,
  "lng"              FLOAT,
  "description"      VARCHAR              NOT NULL,
  "bikePhotos"       TEXT[]               NOT NULL DEFAULT '{}'::TEXT[],
  "issuePhotos"      TEXT[]               NOT NULL DEFAULT '{}'::TEXT[],
  "bikeDetails"      JSON                 DEFAULT '{}'::JSON,
  "bikeImageUrl"     VARCHAR,
  "bikeIndexId"      VARCHAR,
  "clientFirstName"  VARCHAR,
  "clientLastName"   VARCHAR,
  "clientEmail"      VARCHAR,
  "clientPhone"      VARCHAR,
  "scheduledAt"      TIMESTAMP,
  "status"           "InterventionStatus" NOT NULL DEFAULT 'PENDING',
  "isChatOpen"       BOOLEAN              NOT NULL DEFAULT TRUE,
  "userId"           VARCHAR   REFERENCES "User"("id"),
  "bikeId"           VARCHAR   REFERENCES "Bike"("id"),
  "technicianId"     VARCHAR   REFERENCES "User"("id"),
  "servicePackageId" VARCHAR   REFERENCES "ServicePackage"("id"),
  "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Message" (
  "id"          VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  "requestId"   VARCHAR   NOT NULL REFERENCES "RepairRequest"("id"),
  "senderId"    VARCHAR   NOT NULL,
  "senderRole"  "Role"    NOT NULL,
  "content"     VARCHAR   NOT NULL,
  "attachments" TEXT[]    NOT NULL DEFAULT '{}'::TEXT[],
  "reactions"   JSON      NOT NULL DEFAULT '[]'::JSON,
  "isEdited"    BOOLEAN   NOT NULL DEFAULT FALSE,
  "isDeleted"   BOOLEAN   NOT NULL DEFAULT FALSE,
  "isRead"      BOOLEAN   NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Product" (
  "id"          VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"        VARCHAR   NOT NULL,
  "description" VARCHAR,
  "price"       FLOAT     NOT NULL,
  "image"       VARCHAR,
  "category"    VARCHAR,
  "isActive"    BOOLEAN   NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "InterventionProduct" (
  "id"        VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  "requestId" VARCHAR   NOT NULL REFERENCES "RepairRequest"("id") ON DELETE CASCADE,
  "productId" VARCHAR   NOT NULL REFERENCES "Product"("id"),
  "quantity"  INT       NOT NULL DEFAULT 1,
  "price"     FLOAT     NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Sector" (
  "id"        VARCHAR   PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      VARCHAR   UNIQUE NOT NULL,
  "boundary"  geometry,
  "color"     VARCHAR   DEFAULT '#3bb2d0',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "_TechnicianSectors" (
  "A" VARCHAR NOT NULL REFERENCES "Sector"("id") ON DELETE CASCADE,
  "B" VARCHAR NOT NULL REFERENCES "User"("id")   ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

CREATE INDEX "sector_boundary_idx" ON "Sector" USING GIST ("boundary");