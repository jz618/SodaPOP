const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const moment = require('moment');
const { pool } = require('../database')

const DIST_DIR = path.join(__dirname, '..', 'client', 'dist');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.use(express.static(DIST_DIR));

app.post('/api/newBeverage', (req, res) => {
  const { beverage, numberServings, servingSize, date } = req.body;
  const totalOz = Number(servingSize) * Number(numberServings);
  let gramSugar = 0;
  let calorie = 0;

  if (beverage === 'Sprite') {
    gramSugar = Math.floor((38/12) * totalOz);
    calorie = gramSugar * 4;
  } else if (beverage === 'Coke') {
    gramSugar = Math.floor((39/12) * totalOz);
    calorie = gramSugar * 4;
  }
  
  const values = [date, 'masterTest', beverage, gramSugar, calorie];
  const text = `INSERT INTO 
    beverages(
      date,
      username,
      beverage,
      gramSugar,
      calorie
      ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    )` 

  pool
    .query(text, values)
    .then(() => {
      res.status(201).send('the query was a success')
    })
    .catch(() => {
      res.send(500);
    })
});

app.get('/api/getInfo', (req, res) => {
  let thisMonth = new Date();
  thisMonth = thisMonth.getMonth() + 1;

  const text = `SELECT * FROM beverages WHERE EXTRACT(MONTH FROM date) = ${thisMonth}`

  pool
    .query(text)
    .then((results) => {
      console.log(results);
      const getSum = (total, num, param) => {
        return total + num[param];
      }

      let totalSugar = 0;
      let weeklySugar = 0;
      let weeklyCalorie = 0;
      const thisWeek = moment(new Date()).week();

      for (let i = 0; i < results.rows.length; i += 1) {
        totalSugar = totalSugar + results.rows[i].gramsugar;

        const entryWeek = moment(results.rows[i].date).week();
        if (entryWeek === thisWeek) {
          weeklyCalorie = weeklyCalorie + results.rows[i].calorie;
          weeklySugar = weeklySugar + results.rows[i].gramsugar;
        }
      }

      res.status(200).send({
        totalSugar,
        weeklySugar,
        weeklyCalorie
      });
    })
    .catch(() => {
      res.send(500);
    })
})

app.post('/isLoggedIn', (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  const text = `SELECT * FROM users WHERE username=$1 AND password=$2`;
  const values = [username, password];

  pool
    .query(text, values)
    .then((results) => {
      let isSuccess = false;
      if (results.rowCount === 1){
        isSuccess = true;
        res.status(200).send({isSuccess});  
      } else {
        res.status(500).send({isSuccess})
      }
    })
    .catch((err) => {
      console.log(err);
      res.send(501);
    })
}) 


app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist','index.html'))
})

module.exports = app;
