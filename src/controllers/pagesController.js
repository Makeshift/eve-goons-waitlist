const setup = require('../setup.js');
const fleets = require('../fleets.js')(setup);
const esi = require('eve-swagger');
const waitlist = require('../globalWaitlist.js')(setup);
const log = require('../logger.js')(module);

// Render Index/login Page
exports.index = function pagesController(req, res) {
  if (req.isAuthenticated()) {
    // Grab all fleets
    fleets.getFCPageList((fleets) => {
      if (!fleets) {
        res.status(403).send("No fleets found<br><br><a href='/'>Go back</a>");
        return;
      }

      let fleetCount = 0;
      for (let i = 0; i < fleets.length; i++) {
        if (fleets[i].status !== 'Not Listed') fleetCount += 1;
      }

      waitlist.getUserPosition(req.user.characterID, (position) => {
        waitlist.getCharsOnWaitlist(req.user.characterID, (charList) => {
          const userProfile = req.user;
          const sideBarSelected = 1;
          res.render('waitlist.njk', {
            userProfile, sideBarSelected, fleets, fleetCount, charList, position
          });
        });
      });
    });
  } else {
    res.render('login.html');
  }
};

// Join the waitlist
exports.joinWaitlist = function joinWaitlist(req, res) {
  function submitAddition(alt) { // Functionception
    const userAdd = {
      name: req.body.name,
      alt,
      user: req.user,
      ship: req.body.ship,
      invited: 'invite-default',
      signupTime: Date.now()
    };
    waitlist.addToWaitlist(userAdd, () => {
      res.redirect(`/?info=Character ${req.body.name} added to waitlist.`);
    });
  }

  if (req.isAuthenticated()) {
    let alt = false;
    if (req.user.name.toLowerCase() !== req.body.name.toLowerCase()) {
      esi.characters.search.strict(req.body.name).then((results) => {
        // This can be a user later
        alt = {
          name: req.body.name,
          id: results[0],
          avatar: `http://image.eveonline.com/Character/${results[0]}_128.jpg`
        };
        submitAddition(alt);
      }).catch((err) => {
        log.error('routes.post: Error for esi.characters.search', { err, name: req.body.name });
        res.redirect(`/?err=Some error happened! Does that character exist? (DEBUG: || ${err.toString().split('\n')[0]} 
        || ${err.toString().split('\n')[1]} || < Show this to Makeshift!`);
      });
    } else {
      submitAddition(alt);
    }
  }
};

// Leave the waitlist
exports.removeSelf = function removeSelf(req, res) {
  if (req.isAuthenticated()) {
    waitlist.selfRemove(req.user.characterID, () => {
      res.redirect('/');
    });
  }
};

// Logout
exports.logout = function logout(req, res) {
  req.logout();
  res.redirect('/');
};
