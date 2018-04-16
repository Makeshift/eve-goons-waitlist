const setup = require('../setup.js');
const bans = require('../bans.js')(setup);
const esi = require('eve-swagger');
const log = require('../logger.js')(module);

// Render Ban Page
exports.index = function adminBanController(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 3) {
    bans.getBans((activeBans) => {

      for (let i = 0; i < activeBans.length; i++) {
      activeBans[i].createdAt = new Date(activeBans[i].createdAt).toDateString();
    }

    //Sort by name then date.
    activeBans.sort(function(a,b) {
      if(a.pilotName > b.pilotName) return 1;
      if(a.createdAt > b.createdAt) return -1;
      return  0;
    });
      
      const userProfile = req.user;
      const sideBarSelected = 7;
      const banList = activeBans;
      res.render('adminBan.njk', { userProfile, sideBarSelected, banList });
    });
  } else {
    res.status(403).send("You don't have permission to view this page");
  }
};

// Add a Ban
exports.createBan = function createBan(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 4) {
    esi.characters.search.strict(req.body.pilotName).then((results) => {
      const banObject = {
        characterID: results[0],
        pilotName: req.body.pilotName,
        banType: req.body.type,
        notes: req.body.notes,
        banAdmin: req.user,
        createdAt: Date.now(),
        deletedAt: {}
      };

      bans.register(banObject, (success, errTxt) => {
        if (!success) {
          res.status(409).send(`${errTxt}<br><br><a href='/admin/bans'>Go back</a>`);
        } else {
          res.redirect(302, '/admin/bans');
        }
      });
    }).catch((err) => {
      log.error('routes.post: Error for esi.characters.search', { err, name: req.body.name });
      res.redirect(`/admin/bans?err=Some error happened! Does that character exist? (DEBUG: || 
      ${err.toString().split('\n')[0]} || ${err.toString().split('\n')[1]} || < Show this to Makeshift!`);
    });
  }
};

// Revoke a ban
exports.revokeBan = function revokeBan(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 4) {
    const { banID } = req.params;
    const banAdmin = req.user.name;

    bans.revokeBan(banID, banAdmin, () => {
      res.redirect('/admin/bans');
    });
  } else {
    res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data " +
      "file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
  }
};
