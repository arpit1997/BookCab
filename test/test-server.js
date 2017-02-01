/* eslint-env mocha */
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../app.js')
var should = chai.should()

chai.use(chaiHttp)

describe('Blobs', function () {
  this.timeout(60000)
  it('should generate data on /api/drivers/generate ', function (done) {
    chai.request(server)
            .get('/api/drivers/generate')
            .end(function (err, res) {
              if (err) {
                console.log(err)
                done()
              }
              res.should.have.status(200)
              res.should.be.json
              res.body.should.be.a('array')
              done()
            })
  })
  it('should return region on /api/region ', function (done) {
    chai.request(server)
            .get('/api/region')
            .end(function (err, res) {
              if (err) {
                console.log(err)
                done()
              }
              res.should.have.status(200)
              res.should.be.json
              res.body.should.have.a.property('lat')
              res.body.should.have.a.property('lng')
              done()
            })
  })
})
