const express = require('express')  
const app = express()  
const port = 5000

app.get('/', (request, response) => {
  response.send('<a href="/proofs">Proofs</a> | <a href="/auth">Auth</a>')
})

app.get('/proofs', (request, response) => {  
  response.sendFile(__dirname + '/lib/testing/browser/proofsTest.html')
})

app.get('/auth', (request, response) => {  
  response.sendFile(__dirname + '/lib/testing/browser/authTest.html')
})

app.get('/blockstack-bundle.js', (request, response) => {  
  response.sendFile(__dirname + '/lib/testing/browser/blockstack-bundle.js')
})

app.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})