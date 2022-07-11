const express = require('express');
const path = require('path');
const app = express();
app.use('/public',express.static(path.join(__dirname,'static')));
let age = Math.floor(Math.random() * 75) + 1;
let names = ["A", "B", "C", "D", "E"];
let name = names[Math.floor(Math.random() * 5)];
let things = ["V", "W", "X", "Y", "Z"];
let thing1 = things[Math.floor(Math.random() * 5)];
let thing2 = names[Math.floor(Math.random() * 5)] + things[Math.floor(Math.random() * 5)];

app.get('/',(req,res)=>{
  res.send(`<a href="/example">Route 1</a><br/><a href="/example/${ name }/${ age }?${ thing1 }=${ thing2 }">Route 2</a><br/><a href="/testpage">Route 3</a>`);
});
app.listen('3000');

app.get('/example',(req,res)=>{
  res.send('Changed information; use 2 to view<br/><a href="/">Go back?</a>');
  age = Math.floor(Math.random() * 75) + 1
  name = names[Math.floor(Math.random() * 5)];
  thing1 = things[Math.floor(Math.random() * 5)];
  thing2 = names[Math.floor(Math.random() * 5)] + things[Math.floor(Math.random() * 5)];
});

app.get('/example/:name/:age',(req,res)=>{
  console.log(req.params);
  console.log(req.query);
  res.send(`<h1>Hello, ${ name }.</h1><h2>Your age: ${ age }</h2><h3>${ thing2 } as ${ thing1 }</h3>One out of 46875 possibilities.<br/><a href="/">Go back?</a>`);
});

app.get('/static',(req,res)=>{
  res.sendFile(path.join(__dirname,'static','example2.png'));
  console.log('Image requested');
});

app.get('/testpage',(req,res)=>{
  res.send(`<img src="/static" width="807" height="74"><br/>Yes, this is a real article. <a href="https://en.wikipedia.org/wiki/Buffalo_buffalo_Buffalo_buffalo_buffalo_buffalo_Buffalo_buffalo">Don't believe me? Click here to be directed to it.</a><br/><a href="/">Go back?</a>`)
  //example: 488x156
  //example2: 1614x148 or 807x74
});