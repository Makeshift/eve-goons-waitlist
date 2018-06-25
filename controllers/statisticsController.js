const setup = require('../setup.js');
const users = require('../models/users.js')(setup);
const db = require('../dbHandler.js').db.collection('users');

exports.index = function(req,res){
    if(req.isAuthenticated()){
        var userProfile = req.user;
        var sideBarSelected = 3;
        res.render('squadStats.njk', {userProfile, sideBarSelected});
    } else {
        res.status(401).redirect("/");
    }
}

/*
* Returns an array of registered users.
* @query: sort=desc
* @return user[] {characterID, name, corporationID, registrationDate}
*/
exports.getMemberList = function(req, res){
    if(req.isAuthenticated()){
        db.find({}).sort({registrationDate: (req.query.sort === "desc")? -1 : 1}).toArray(function (err, docs) {
            if(!err){
                var userArray = [];
                for(var i = 0; i < docs.length; i++){
                    userArray.push({
                        characterID: docs[i].characterID,
                        name: docs[i].name,
                        corporationID: docs[i].corporation.id,
                        registrationDate: docs[i].registrationDate
                    })
                }
                res.status(200).send(userArray);
            } else {
                res.status(400).send(err);
            }
        })
    } else {
        res.status(401).send("API Requires authentication");
    }//End Authentication Check
}

/*
* Returns an array of registered corporations.
* @query: sort=desc
* @return corporation[] {corporationID, name, memberCount}
*/
exports.getCorporationList = function(req, res){
    if(req.isAuthenticated()){
        //Returns an array of corporations {id, name} with a count
        db.aggregate([
            {"$group" : {_id: {corpID:"$corporation.id",corpName:"$corporation.name"}, 
                count:{$sum:1}}},{$sort:{"count": (req.query.sort === "desc")? -1 : 1}}
        ]).toArray(function (err, docs) {
            if(!err){
                res.status(200).send(docs);
            } else {
                res.status(400).send(err);
            }
        })
    } else {
        res.status(401).send("API Requires authentication");
    }//End Authentication Check
}

/*
* Returns an array of the total number of users that signed up over 6 months.
* @return corporation[] {corporationID, name, memberCount}
*/
exports.getMontlySignups = function(req, res){
    if(req.isAuthenticated()){
        
        var lastSix = new Date();
        lastSix.setMonth(lastSix.getMonth() - 5);
        db.find({ 
            'registrationDate': {
                $gte: lastSix,
                $lt: new Date()
            } 
        }).sort({'registrationDate': -1}).toArray( (err, docs) => {
            if (!!err) {
                console.log("Error! " + err)
                res.status(400).send(err);
                return
            }

            var counts = {};

            for(let i = 0; i < docs.length; i++) {
                
                let d = docs[i];
                let m = d.registrationDate.getMonth()

                if(!counts[m]) {
                    counts[m] = 0
                }
                counts[m] += 1;
            }
            res.status(200).send(counts);
        });
    } else {
        res.status(401).send("API Requires authentication");
    }//End Authentication Check
}