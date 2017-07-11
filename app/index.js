const Item = require('../models/item');
const Purchase = require('../models/purchase');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const env = process.env.NODE_ENV || "development";
const config = require('../config.json')[env];

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

mongoose.connect(config.mongoUrl);


app.get('/api/customer/items', function (req, res) {
    Item.find().then((items) => {
        res.json({
            status: "success",
            data: items
        });
    }).catch(err => {
        console.log("There was an error:", err);
    })
})

app.post('/api/customer/items/:itemId/purchases', function (req, res) {
    let itemId = req.params.itemId,
        money_given = parseInt(req.body.money_given);

    if (!itemId || !money_given) res.json({
        status: "fail",
        message: "Item id or money_given not provided."
    })
    else {
        Item.findOne({
            _id: itemId
        }, function (err, item) {

            //Error
            if (err) res.json({
                status: "fail",
                message: "Error looking up itemid: " + itemId + ", err -> " + err
            });

            //Item not found
            else if (!item) res.json({
                status: "fail",
                message: "Could not find itemid: " + itemId
            });

            //Success
            else if (item) {
                if (money_given >= item.cost) {
                    let change_given = money_given - item.cost;

                    //Add purchase to collection
                    let purchase = new Purchase({
                        itemId: item._id,
                        total: item.cost,
                        timestamp: new Date()
                    });

                    purchase.save(function (err) {
                        if (err) res.json({
                            status: "fail",
                            message: "Error adding item to purchases: " + item._id + ", err -> " + err
                        });
                        else {
                            res.json({
                                status: "success",
                                data: {
                                    money_given: money_given,
                                    money_required: item.cost,
                                    change_given: change_given
                                }
                            });
                        }
                    });

                    //Not enough dough    
                } else {
                    res.json({
                        status: "fail",
                        data: {
                            money_given: money_given,
                            money_required: item.cost
                        }
                    });
                }
            }
        });
    }

})

app.get('/api/vendor/purchases', function (req, res) {
    Purchase.find({}, function (err, purchases) {

        if (err) res.json({
            status: "fail",
            message: "Error getting purchases."
        });

        else if (!purchases) res.json({
            status: "fail",
            message: "No purchases found."
        });

        else if (purchases) {
            res.json({
                status: "success",
                data: purchases
            });
        }

    })
})

app.get('/api/vendor/money', function (req, res) {
    Purchase.find({}, function (err, purchases) {

        if (err) res.json({
            status: "fail",
            message: "Error getting purchases."
        });

        else if (!purchases) res.json({
            status: "success",
            data: {
                total_money: 0
            }
        });

        else if (purchases) {
            //Total all purchases
            let total = 0;
            for (var i = 0; i < purchases.length; i++)
                total += purchases[i].total;

            res.json({
                status: "success",
                data: {
                    total_money: total
                }
            });
        }

    })
})

app.post('/api/vendor/items', function (req, res) {
    let description = req.body.description,
        cost = parseInt(req.body.cost),
        quantity = parseInt(req.body.quantity);

    if (!(description && cost && quantity)) {
        res.json({
            status: "fail",
            message: "Not all required fields were provided."
        });
    } else {
        let newitem = new Item({
            description: description,
            cost: cost,
            quantity: quantity
        });

        newitem.save(function (err) {
            if (err) res.json({
                status: "fail",
                message: "Error adding new item to collection."
            });
            else {
                res.json({
                    status: "success",
                    data: newitem
                });
            }
        })
    }
})

app.put('/api/vendor/items/:itemId', function (req, res) {
    let itemId = req.params.itemId,
        description = req.body.description,
        cost = parseInt(req.body.cost),
        quantity = parseInt(req.body.quantity);

    if (!(description && cost && quantity)) {
        res.json({
            status: "fail",
            message: "Not all required fields were provided."
        });
    } else {
        Item.findOne({
            _id: itemId
        }, function (err, item) {
            
            if (err) res.json({
                status: "fail",
                message: "Error looking up item by id."
            });
            
            else if (!item) res.json({
                status: "fail",
                message: "Could not find item by id provided."
            });
            
            else if (item) {
                item.description = description;
                item.cost = cost;
                item.quantity = quantity;
                item.save(function (err) {
                    if (err) res.json({
                        status: "fail",
                        message: "Error adding new item to collection."
                    });
                    else {
                        res.json({
                            status: "success",
                            data: item
                        });
                    }
                });
            }
        })
    }
})

app.listen(3000, () => {
    console.log("App listening on 3000");
})

module.exports = app;
