# Trust Score Calculation Logic

Trust scores are calculated dynamically inside the `trustScoreService.js` file based on user verification status, integration counts, subscription plans, and behavior flags.

---

## 📈 Score Breakdown Matrix

A user's trust score ranges from **300 (minimum)** to **1000 (maximum)** points. The score is aggregated from the following components:

### 1. Identity Anchor (KYC)
- **Verified KYC status**: Adds **300 points**. This is the highest trust weight component and requires document verification.
- **Pending KYC status**: Adds **100 points** (temporary grace score).

### 2. Social & Integration Links
- Every connected account (e.g., GitHub, LinkedIn, Plaid, WorldID) adds **50 points**.
- This social/integration category is capped at a maximum of **200 points** (up to 4 linked integrations).

### 3. Behavioral Anomaly Penalties
To prevent bots and gaming, the platform tracks rate of change:
- **Rate-limit alert**: If a user attempts a rapid verification burst (e.g., linking >5 integrations within a short timeframe), a high-severity alert is logged in `risk_logs`.
- **Integrations Penalty**: The user's trust score is immediately penalized by **-100 points**.

### 4. Subscription Plan Gates
The maximum achievable score is limited based on the user's active billing tier:
- **Free Plan**: Restricted to static identity and social verification scores, capped at a maximum of **500 points**.
- **Pro/Enterprise Plans**: Unlocks financial data validation via Stripe/Plaid (+200 points) and professional developer activity verification (+150 points), allowing the user to reach the maximum score of **1000 points**.

### 5. Admin Score Modifiers
- System administrators can manually adjust scores up or down using the `admin_score_modifier` field in the Postgres database, overrides any automated scoring rules for compliance purposes.
