import express from 'express'
import opn from 'opn'
import path from 'path'

const app = express()
const port = 5000

app.use('/', express.static(`${__dirname}/proofs`))

app.get('/bundle.js', (request, response) => {
  response.sendFile('dist/blockstack.js', { root: path.resolve('./') })
})
app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  opn('http://localhost:5000')
  return console.log(`server is listening on ${port}`)
})
