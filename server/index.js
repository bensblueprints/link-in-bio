const PORT = Number(process.env.PORT) || 5307;
const APP_MODE = process.env.APP_MODE || 'single';

if (APP_MODE === 'multi') {
  const { runMigrations } = require('../scripts/migrate-pg');
  const { createMultiApp } = require('./app-multi');
  runMigrations()
    .then(() => {
      const app = createMultiApp();
      app.listen(PORT, () => {
        console.log(`LinkLeaf (hosted, multi-tenant) running on :${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Migration failed, refusing to start:', err.message);
      process.exit(1);
    });
} else {
  const { createApp } = require('./app');
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Link-in-Bio running`);
    console.log(`  Public page : http://localhost:${PORT}/`);
    console.log(`  Admin panel : http://localhost:${PORT}/admin`);
  });
}
