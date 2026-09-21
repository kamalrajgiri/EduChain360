# 1. Set up database
mysql -u root -p < Server/src/config/schema.sql

# 2. Configure environment
cp Server/.env.example Server/.env
# Edit .env — set DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD

# 3. Bootstrap (roles + 1 admin)
cd Server
npm install
npm run bootstrap

# 4. Start servers
npm run dev                              # Server
cd ../Client && npm run dev              # Client

# 5. Log in as admin → create everything through the UI

