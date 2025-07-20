/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-var */
// eslint-disable-next-line import/no-extraneous-dependencies
var express = require('express');
const cors = require('cors');

var formData = require('./formData');

var formDataList = {'0':{data: {"task_data": "[]"}}, '1':{data: {"task_data": "[]"}}, '2':{data:{"task_data": "[]"}}}

var optionsData = [
  { text: 'Text 1', value: '1' },
  { text: 'Text 2', value: '2' },
  { text: 'Text 3', value: '3' },
];

const corsOptions = {
  origin: '*',//(https://your-client-app.com)
  optionsSuccessStatus: 200,
};

var app = express();
app.use(cors(corsOptions));

app.route('/formdata/')
  .get((req, res) => {
    
    console.log(req.query);
    //console.log('get formdata: ', formData.data);
    //res.send(formData.data.task_data);
    //res.send(formDataList[req.query['cid']].data.task_data);
    res.send(formDataList[req.query['cid']].data.task_data);
  })
  .post((req, res) => {
    console.log(req.query);
    //formData.data = req.body;
    formDataList[req.query['cid']].data = req.body
    //console.log('post formdata: ', formData.data);
    res.status(200).send();
  });
app.route('/optionsdata/')
  .get((req, res) => {
    res.send(optionsData);
  });

module.exports = app;
