const request = require('supertest');
const assert = require('assert');
const mongoose = require("mongoose");
const app = require('../app/index');
const Item = require('../models/item');
const Purchase = require('../models/purchase')

//Stores item id generated by first test for use by later tests
let firstItemId = '';

describe("GET /api/customer/items", function () {
    before(function () {
        //TODO: Clear purchases
        return Item.remove({})
            .then(function () {
                return Item.insertMany([
                    {
                        "description": "Corn chips",
                        "cost": 65,
                        "quantity": 4
                    },
                    {
                        "description": "Gum",
                        "cost": 35,
                        "quantity": 10
                    },
                ]).then(function() {
                    return Purchase.remove({});
                });
            });
    });
    
    it("returns a list of items and properties from the database", function (done) {
        request(app)
            .get('/api/customer/items')
            .expect(200)
            .expect(function (res) {
                firstItemId = res.body['data'][0]['_id'];
                //console.dir(res.body);
                let testresults = {status: "success", data: [
                        {   
                            "_id": res.body['data'][0]['_id'],
                            "__v": res.body['data'][0]['__v'],
                            "description": "Corn chips",
                            "cost": 65,
                            "quantity": 4
                        },
                        {
                            "_id": res.body['data'][1]['_id'],
                            "__v": res.body['data'][1]['__v'],
                            "description": "Gum",
                            "cost": 35,
                            "quantity": 10
                        },
                    ]};
                assert.equal(JSON.stringify(res.body), JSON.stringify(testresults));
            })
            .end(done);
    })
})

describe("POST item ID and money_given to /api/customer/items/:itemId/purchases", function() {
    it("should accept exact change", function(done) {
        request(app)
            .post('/api/customer/items/' + firstItemId + '/purchases')
            .set("Connection", "keep alive")
            .set("Content-Type", "application/json")
            .type("form")
            .send({ money_given: 65 })
            .expect(function(res) {
                let testresult = { status: "success", data: {money_given: 65, money_required: 65, change_given: 0} };
                assert.equal(JSON.stringify(res.body), JSON.stringify(testresult));
            })
            .end(done);
    })
        
    it("should return correct change", function(done) {
        request(app)
            .post('/api/customer/items/'+ firstItemId + '/purchases')
            .set("Connection", "keep alive")
            .set("Content-Type", "application/json")
            .type("form")
            .send({ money_given: 105 })
            .expect(function(res) {
                let testresult = { status: "success", data: {money_given: 105, money_required: 65, change_given: 40} };
                assert.equal(JSON.stringify(res.body), JSON.stringify(testresult));
            })
            .end(done);
    })
    
    it("should respond with an error if not enough money was provided", function(done) {
        request(app)    
            .post('/api/customer/items/'+ firstItemId + '/purchases')
            .set("Connection", "keep alive")
            .set("Content-Type", "application/json")
            .type("form")
            .send({ money_given: 55 })
            .expect(function(res) {
                let testresult = { status: "fail", data: {money_given: 55, money_required: 65} };
                assert.equal(JSON.stringify(res.body), JSON.stringify(testresult));
            })
            .end(done);
    })
})

describe("GET /api/vendor/purchases", function() {
    //There should be two purchases from previous tests
    it("should return a list of all purchases and their date/time", function(done) {
        request(app)
            .get('/api/vendor/purchases')
            .expect(200)
            .expect(function (res) {
                //console.dir(res.body);
                let testresults = {status: "success", data: [
                        {   
                            "_id": res.body['data'][0]['_id'],
                            "itemId": firstItemId,
                            "total": 65,
                            "timestamp": res.body['data'][0]['timestamp'],
                            "__v": res.body['data'][0]['__v']
                        },
                        {
                            "_id": res.body['data'][1]['_id'],
                            "itemId": firstItemId,
                            "total": 65,
                            "timestamp": res.body['data'][1]['timestamp'],
                            "__v": res.body['data'][1]['__v']
                        },
                    ]};
                assert.equal(JSON.stringify(res.body), JSON.stringify(testresults));
            })
            .end(done);
    })
})

describe("GET /api/vendor/money", function() {
    it("should return a total amount of money from all purchases accepted", function(done) {
        request(app)
            .get('/api/vendor/money')
            .expect(200)
            .expect(function (res) {
                console.dir(res.body);
                let testresults = {status: "success", data: {total_money: 130}};
                assert.equal(JSON.stringify(res.body), JSON.stringify(testresults));
            })
            .end(done);
    })
})

describe("POST /api/vendor/items", function() {
    it("should add a new item not previously existing in the machine", function(done) {
        request(app)   
            .post('/api/vendor/items')
            .set("Connection", "keep alive")
            .set("Content-Type", "application/json")
            .type("form")
            .send({ description: "25c Beer", cost: 25, quantity: 20 })
            .expect(function(res) {
                //console.dir(res.body);
                let testresult = { status: "success", data: {
                    "__v": res.body['data']['__v'],
                    "description": "25c Beer",
                    "cost": 25,
                    "quantity": 20,
                    "_id": res.body['data']['_id']
                } };
                assert.equal(JSON.stringify(res.body), JSON.stringify(testresult));
            })
            .end(done);
    })
})

describe("PUT /api/vendor/items/:itemId", function() {
    it("should update item quantity, description, and cost", function(done) {
        request(app)
            .put('/api/vendor/items/' + firstItemId)
            .set("Connection", "keep alive")
            .set("Content-Type", "application/json")
            .type("form")
            .send({description: "Doritos", cost: 75, quantity: 10})
            .expect(function(res) {
                //console.dir(res.body);
                let testresult = { status: "success", data: {
                    "__v": res.body['data']['__v'],
                    "description": "Doritos",
                    "cost": 75,
                    "quantity": 10,
                    "_id": res.body['data']['_id']
                }};
            })
            .end(done);
    })
})
