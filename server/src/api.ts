export const api = express => {
  const app = express();

  app.use((req, res, next) => {
    console.log('used!');
    next();
  });

  app.post('/login', (req, res) => {
    console.log('login route!');
    console.log(req.body);
    res.status(200).send();
  });

  return app;
};
