# Database Models & Graph Engines

Crifolayer utilizes a hybrid database approach combining PostgreSQL (for structured transactional profile and audit data) with Neo4j (for high-performance relationship graphs and fraud detection).

---

## 1. Relational PostgreSQL Schema (Prisma)

Prisma is used to model relational user profiles, connected integrations, B2B keys, and consent vaults in Postgres:

```prisma
enum Role {
  USER
  ADMIN
}

enum TrustCategory {
  LOW_TRUST
  MODERATE_TRUST
  HIGH_TRUST
  VERIFIED_TRUSTED
  ENTERPRISE_TRUSTED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model User {
  id                String              @id @default(uuid())
  email             String              @unique
  fullName          String?
  role              Role                @default(USER)
  plan              String              @default("free")
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  connectedAccounts ConnectedAccount[]
  trustScores       TrustScore[]
  riskReports       RiskReport[]
  auditLogs         AuditLog[]
  walletConnections WalletConnection[]
  verificationEvents VerificationEvent[]
  developerApps     DeveloperApp[]
}

model ConnectedAccount {
  id                 String              @id @default(uuid())
  userId             String
  provider           String              // e.g. gitlab, upwork, plaid, worldid, ens
  providerAccountId  String
  accessToken        String?             @db.Text
  refreshToken       String?             @db.Text
  tokenExpiresAt     DateTime?
  scopes             String[]
  status             String              // CONNECTED, EXPIRED, REVOKED, ERROR
  lastSyncedAt       DateTime?
  metadata           Json?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TrustScore {
  id              String        @id @default(uuid())
  userId          String        @unique
  score           Int           @default(300)
  category        TrustCategory @default(LOW_TRUST)
  breakdown       Json
  fraudPenalties  Json?
  updatedAt       DateTime      @updatedAt
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model DeveloperApp {
  id                   String            @id @default(uuid())
  userId               String
  name                 String
  description          String?
  sandboxKeyHash       String?           @unique
  sandboxKeyHint       String?
  productionKeyHash    String?           @unique
  productionKeyHint    String?
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
  user                 User              @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model WebhookEndpoint {
  id        String   @id @default(uuid())
  appId     String
  url       String
  secret    String   @db.Text
  events    String[]            // e.g. trust.score.updated, fraud.detected
  isActive  Boolean  @default(true)
}
```

---

## 2. Neo4j Graph Schema

Neo4j maps trust dynamics and detects financial fraud, circular transactions, and collusion structures:

### Node Definitions:
- `(:User { id: String, email: String, plan: String, kycStatus: String, trustScore: Integer })`
- `(:IdentityProvider { provider: String, accountId: String })`
- `(:Wallet { address: String })`

### Relationships:
- `(:User)-[:CONNECTED_VIA { linkedAt: DateTime }]->(:IdentityProvider)`
- `(:User)-[:TRUSTS { weight: Float, createdAt: DateTime }]->(:User)`
- `(:Wallet)-[:SENT { txHash: String, amount: Float, network: String, timestamp: DateTime }]->(:Wallet)`

---

## 💡 Cypher Query Examples

### Neighbor-Weighted Trust Score Computation:
Calculates a user's trust score by combining 70% of their base profile score with 30% of the average trust score of other users who trust them:
```cypher
MATCH (u:User { id: $userId })
OPTIONAL MATCH (u)<-[:TRUSTS]-(v:User)
WITH u, avg(v.trustScore) AS neighborsAvg
RETURN u.trustScore AS baseScore,
       coalesce(neighborsAvg, 0) AS networkImpact
```

### Circular Transaction Fraud Detection:
Detects financial collusion or circular payments (between 2 and 5 hops) starting and ending at the same user:
```cypher
MATCH (u:User { id: $userId })
MATCH path = (u)-[:SENT|TO*2..5]->(u)
RETURN count(path) > 0 AS isFraudulent
```
