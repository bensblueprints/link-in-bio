const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 5307;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Link-in-Bio running`);
  console.log(`  Public page : http://localhost:${PORT}/`);
  console.log(`  Admin panel : http://localhost:${PORT}/admin`);
});
