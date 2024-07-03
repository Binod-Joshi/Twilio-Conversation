const Router = require('express').Router;

const tokenGenerator = require('./token_generator');

const router = new Router();

router.get('/token/:id?', async(req, res) => {
  const id = req.params.id;
  console.log(id);
  const token = await tokenGenerator(id);
  console.log(token);
  res.send(token);
});





module.exports = router;
