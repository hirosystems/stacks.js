const express = require('express')
const opn = require('opn')
const app = express()  
const port = 5000

function allowCrossDomain(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
}

app.use(allowCrossDomain)
app.use('/', express.static(__dirname + '/auth'))
app.get('/bundle.js', (request, response) => {
  response.sendFile(__dirname + '/bundle.js')
})
app.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
  opn('http://localhost:5000')
})