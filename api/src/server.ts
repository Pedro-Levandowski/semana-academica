import { createApp } from './app.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
