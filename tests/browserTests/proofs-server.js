const express = require('express')  
const app = express()  
const port = 5000

app.use('/', express.static(__dirname + '/proofs'))
app.get('/bundle.js', (request, response) => {
  response.sendFile('bundle.js')
})
app.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})