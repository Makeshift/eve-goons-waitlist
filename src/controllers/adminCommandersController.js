const setup = require('../setup.js');
const users = require('../users.js')(setup);
const esi = require('eve-swagger');
const log = require('../logger.js')(module);

const error403Message = `You don't have permission to view this page. If this is in dev, have you edited your data file 
to make your roleNumeric > 4? <br><br><a href='/'>Go back</a>`;

// Render FC Management Page
exports.index = function adminCommandsController(req, res) {
  function genPage(userProfile) {
    users.getFCList((fcList) => {
      const sideBarSelected = 7;
      const fcs = fcList;
      const manageUser = userProfile;
      res.render('adminFC.njk', {
        userProfile, sideBarSelected, fcs, manageUser
      });
    });
  }

  if (req.isAuthenticated() && req.user.roleNumeric > 4) {
    let userProfile = {};
    if (typeof req.query.user !== 'undefined') {
      users.findAndReturnUser(Number(req.query.user), (profile) => {
        userProfile = profile;
        genPage(userProfile);
      });
    } else {
      userProfile = req.user;
      genPage(userProfile);
    }
  } else {
    res.status(403).send(error403Message);
  }
};

// Updates a users permission level.
exports.updateUser = function updateUser(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 4) {
    esi.characters.search.strict(req.body.pilotName).then((results) => {
      users.updateUserPermission(results[0], req.body.permission, req.user, res);
      res.redirect('/admin/commanders');
    }).catch((err) => {
      log.error('routes.post: Error for esi.characters.search', { err, name: req.body.name });
      res.redirect(`/?err=Some error happened! Does that character exist? (DEBUG: || ${err.toString().split('\n')[0]} 
      || ${err.toString().split('\n')[1]} || < Show this to Makeshift!`);
    });
  } else {
    res.status(403).send(error403Message);
  }
};
