const express = require('express')  
const app = express()  
const port = 5000

app.get('/', (request, response) => {
  response.send('<a href="/proofs">Proofs</a> | <a href="/auth">Auth</a>')
})

app.use('/', express.static(__dirname))

app.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})