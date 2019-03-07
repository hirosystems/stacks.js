import express from 'express'
import opn from 'opn'
import path from 'path'

const app = express()
const port = 5000

function allowCrossDomain(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
}

app.use(allowCrossDomain)
app.use('/', express.static(`${__dirname}/auth`))
app.get('/bundle.js', (request, response) => {
  response.sendFile(path.resolve(__dirname, '../../dist/blockstack.js'))
})
app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  opn('http://localhost:5000')
  return console.log(`server is listening on ${port}`)
})
