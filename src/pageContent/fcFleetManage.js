const setup = require('../setup.js');
const cache = require('../cache.js')(setup);
const waitlist = require('../globalWaitlist.js')(setup);
const users = require('../users.js')(setup);

module.exports = function fcFleetManage(payloadContent, cb) {
  const ships = [];
  let fleetLength;
  // TODO: UGH!
  if (payloadContent.fleet) {
    if (payloadContent.fleet.members) {
      fleetLength = payloadContent.fleet.members.length || 0;
    } else {
      fleetLength = 0;
    }
  } else {
    fleetLength = 0;
  }
  for (let i = 0; i < fleetLength; i++) {
    ships.push(payloadContent.fleet.members[i].ship_type_id);
  }

  // Shamelessly stolen from stackoverflow
  const distribution = ships.reduce((acum, cur) => Object.assign(acum, { [cur]: (acum[cur] | 0) + 1 }), {});
  let shiptable = '';

  const numOfShips = Object.keys(distribution).length;
  let counter = 0;
  // TODO: Asyncyfy
  // Unpleasant hack for dealing with async for loops because I really should learn promises and await...
  for (let i = 0; i < numOfShips; i++) {
    cache.get(Object.keys(distribution)[i], (item) => {
      counter += 1;
      shiptable +=
        `<td class="tw35"><img src="https://image.eveonline.com/Render/${item.id || item}_32.png" alt="Ship Icon"></td>
         <td class="tw20per"><a href="#">${item.name || item || 'CacheError'}</a>
         <td>${distribution[item.id]}</td>`;
      if (counter % 3 === 0) {
        shiptable += '</tr><tr>';
      }
      if (counter >= numOfShips) {
        contWaitlistGenerate(fleetLength, payloadContent.fleet.id, cb);
      }
    });
  }

  function contWaitlistGenerate(fleetLength, fleetid, cb) {
    let waitlistHTML = '';
    waitlist.get((usersOnWaitlist) => {
      const usersNeeded = usersOnWaitlist.length;
      let count = 0;
      for (let i = 0; i < usersNeeded; i++) {
        // TODO: This is a bit sketchy, we're asking for a new location every time we load? This should be background
        // and grabbed from the DB
        // Stupid hack because things were coming back in the wrong order, ugh
        users.getLocation(usersOnWaitlist[i].user, () => {});
        const entry = usersOnWaitlist[i];
        count += 1;
        let { characterID, name, role } = entry.user;
        const tableID = entry._id;
        let invited = 'invite-default';
        if (entry.invited === true) {
          invited = 'invite-sent';
        }
        if (typeof entry.alt === 'object') {
          characterID = entry.alt.id;
          // eslint-disable-next-line prefer-destructuring
          name = entry.alt.name;
          role = `Alt of: ${entry.user.name}`;
        }

        let signuptime = Math.floor((Date.now() - entry.signupTime) / 1000 / 60);
        let signupHours = 0;
        while (signuptime > 59) {
          signuptime -= 60;
          signupHours += 1;
        }
        waitlistHTML += `
          <tr class="${invited}">
                            <td>
                              <img src="https://image.eveonline.com/Character/${characterID}_32.jpg" alt="avatar"> 
                            </td>
                            <td>
                              <a href="/esi/ui/info/${characterID}">${name}</a>
                              <p>${role}</p>
                            </td>
                            <td>
                              <a href="/commander/${fleetid}/invite/${characterID}/${tableID}">
                                <button class="btn btn-success btn-sm" title="Invite to Fleet">
                                  <i class="fa fa-plus"></i>
                                </button>
                              </a>
                            </td>
                            <td>
                              <div class="dropdown">
                                <button class="btn btn-info btn-sm dropdown-toggle" data-toggle="dropdown" 
                                aria-expanded="false" type="button">
                                  <i class="fas fa-caret-circle-down" style="margin-right:-50%"></i>
                                </button>
                                <div class="dropdown-menu" role="menu">
                                  <a class="dropdown-item" href="#">View Pilot Profile</a>
                                  <a class="dropdown-item" href="#">View Pilot Skills</a>
                                </div>
                              </div>
                            </td>
                            <td>
                              <button class="btn btn-sm" title="Browser Alarm"><i class="fa fa-bell"></i></button>
                            </td>
                            <td>
                              <a href="/commander/${fleetid}/remove/${tableID}/">
                                <button class="btn btn-danger btn-sm" title="Remove from Waitlist">
                                  <i class="fa fa-minus"></i>
                                </button>
                              </a>
                            </td>
                            <td>
                              <a href="#">${entry.ship}</a>
                            </td>
                            <td><a href="#">${'Unknown'}</a></td>
                            <td>${signupHours}H ${signuptime}M</td>
                          </tr>
          `;
        if (count >= usersNeeded) {
          genPage(waitlistHTML, usersNeeded, fleetLength, cb);
        }
      }
      if (usersNeeded === 0) {
        genPage('', usersNeeded, fleetLength, cb);
      }
    });
  }

  function genPage(waitlistHTML, usersNeededWaitlist, fleetLength, cb) {
    let commsChannels = `<script>function post(path, params) {
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", path);
    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);
            form.appendChild(hiddenField);
        }
    }
    document.body.appendChild(form);
    form.submit();
}
</script>`;
    for (let i = 0; i < setup.fleet.comms.length; i++) {
      if (payloadContent.fleet.comms.name !== setup.fleet.comms[i].name) {
        commsChannels += `
          <a id="commsbutton-${i}" class="dropdown-item">${setup.fleet.comms[i].name}</a>
          <script>
            document.getElementById("commsbutton-${i}").addEventListener("click", function () {
              post("/commander/${payloadContent.fleet.id}/update/comms", 
              {name: "${setup.fleet.comms[i].name}", 
              url: "${setup.fleet.comms[i].url}"});
            });
          </script>
          `;
      }
    }

    const fleetTypeList = ['Scouts', 'Vanguards', 'Assaults', 'Headquarters', 'Kundalini', 'ARSEFleet'];
    let fleetType = '';
    for (let i = 0; i < fleetTypeList.length; i++) {
      if (payloadContent.fleet.type !== fleetTypeList[i]) {
        fleetType += `<a class="dropdown-item" id="fleetTypeButton-${i}" href="#">${fleetTypeList[i]}</a>
          <script>
            document.getElementById("fleetTypeButton-${i}").addEventListener("click", function () {
              post("/commander/${payloadContent.fleet.id}/update/type", {type: "${fleetTypeList[i]}"});
            });
          </script>
        `;
      }
    }

    const fleetStatusList = ['Not Listed', 'Forming', 'Running', 'Docking Soon', 'Short Break'];
    let fleetStatus = '';
    for (let i = 0; i < fleetStatusList.length; i++) {
      if (payloadContent.fleet.status !== fleetStatusList[i]) {
        fleetStatus += `<a class="dropdown-item" id="fleetStatus-${i}" href="#">${fleetStatusList[i]}</a>
          <script>
            document.getElementById("fleetStatus-${i}").addEventListener("click", function () {
              post("/commander/${payloadContent.fleet.id}/update/status", {status: "${fleetStatusList[i]}"});
            });
          </script>
        `;
      }
    }

    let updateFC = '';
    updateFC += '<button class="btn btn-sm btn-block" id="updateFC">I\'m the FC</button>';
    updateFC += `<script>
      document.getElementById("updateFC").addEventListener("click", function () {
        post("/commander/${payloadContent.fleet.id}/update/commander", 
        // TODO: What is i ?
        // eslint-disable-next-line no-undef
        {status: "${fleetStatusList[i]}"});
      });
    </script>`;

    let updateBackseat = '';
    updateBackseat += '<button class="btn btn-sm btn-block" id="updateBackseat">Update Backseat</button>';
    updateBackseat += `<script>
    document.getElementById("updateBackseat").addEventListener("click", function () {
      post("/commander/${payloadContent.fleet.id}/update/backseat", 
      // TODO: What is i ?        
      // eslint-disable-next-line no-undef
      {status: "${fleetStatusList[i]}"});
    });
  </script>`;

    let notListedBanner = '';
    if (payloadContent.fleet.status === 'Not Listed') {
      notListedBanner = `<div role="alert" class="alert alert-primary global-banner-inactive noselect">
          <strong>This fleet is not listed:</strong> Pilots cannot see this fleet. If this is the only fleet pilots 
          will be unable to join the waitlist!
        </div>`;
    }

    cb(`
      <!-- Page Content -->
      <div class="page-content">
        <div class="page-header">
          <div class="container-fluid">
            <h2 class="h5 no-margin-bottom">Fleet Management</h2>
          </div>
        </div>
        ${notListedBanner}
        <section class="no-padding-top no-padding-bottom">
          <div class="container-fluid">
            <!-- Upper Fleet Panel -->
            <div class="row">
              <div class="col-md-6 col-sm-12">
                <div class="statistic-block block">
                  <div class="title">
                    <div class="icon"></div>
                    <strong>Fleet Info</strong>
                  </div>
                  <!-- Fleet Settings Table -->
                  <table class="table table-striped table-sm">
                    <tbody>
                      <tr>
                        <td>FC (Boss):</td>
                        <td><a href="/esi/ui/info/${payloadContent.fleet.fc.characterID}">
                          ${payloadContent.fleet.fc.name}</a></td>
                        <td>${updateFC}</td>
                      </tr>
                      <tr>
                        <td>Backseating FC:</td>
                        <td><a href="/esi/ui/info/${payloadContent.fleet.backseat.characterID || 'undefined'}">
                          ${payloadContent.fleet.backseat.name || 'None'}</a></td>
                        <td>${updateBackseat}</td>
                      </tr>
                      <tr>
                        <td>Fleet Status:</td>
                        <td>${payloadContent.fleet.status}</td>
                        <td>
                          <div class="dropdown">
                            <button class="btn btn-default btn-sm btn-block dropdown-toggle" data-toggle="dropdown" 
                            aria-expanded="false" type="button">Update Status 
                              <i class="fas fa-sort-down float-right"></i>
                            </button>
                            <div class="dropdown-menu" role="menu">
                              ${fleetStatus}
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Fleet Type:</td>
                        <td>${payloadContent.fleet.type}</td>
                        <td>
                          <div class="dropdown">
                            <button class="btn btn-default btn-sm btn-block dropdown-toggle" data-toggle="dropdown" 
                            aria-expanded="false" type="button">Change Type 
                              <i class="fas fa-sort-down float-right"></i>
                            </button>
                            <div class="dropdown-menu" role="menu">
                              ${fleetType}
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Fleet Comms:</td>
                        <td><a href="${payloadContent.fleet.comms.url || '#'}">${payloadContent.fleet.comms.name}</a>
                        </td>
                        <td>
                          <div class="dropdown">
                            <button class="btn btn-default btn-sm btn-block dropdown-toggle" data-toggle="dropdown" 
                            aria-expanded="false" type="button">Change Channel 
                              <i class="fas fa-sort-down float-right"></i>
                            </button>
                            <div class="dropdown-menu" role="menu">
                              ${commsChannels}
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Fleet System:</td>
                        <td colspan="2"><a href="/esi/ui/waypoint/${payloadContent.fleet.fc.location.id}">
                          ${payloadContent.fleet.location}</a></td>
                      </tr>
                      <tr>
                        <td colspan="3">
                          <form action="/commander/${payloadContent.fleet.id}/delete">
                            <button class="btn btn-danger btn-sm btn-block" type="submit">
                              <i class="fas fa-exclamation-triangle"></i> Close the Fleet! 
                              <i class="fas fa-exclamation-triangle"></i>
                            </button>
                          </form>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <!-- End Upper Fleet Panel -->
              <!-- Fleet Comp Overview -->              
              <div class="col-md-6 col-sm-12">
                <div class="statistic-block block">
                  <div>
                      <strong>Fleet at a Glance</strong>
                    <div class="tab-content">
                      <div role="tabpanel" class="tab-pane active" id="tab-1">
                        <table class="table table-striped table-sm">
                          <tbody>
                            <tr>
                            ${shiptable}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Waitlist Section -->
            <div class="row">
              <div class="col-md-12 col-sm-12">
                <div class="statistic-block block">
                
                <!-- Waitlist Navigation Tabs -->
                <div>
                <ul class="nav nav-pills nav-justified">
                    <li class="nav-item"><a role="tab" data-toggle="pill" href="#waitlist" class="nav-link active">
                    <div class="badge badge-dark">${usersNeededWaitlist}</div> Fleet Waitlist</a></li>
                    <li class="nav-item"><a role="tab" data-toggle="pill" href="#fleetlist" class="nav-link">
                    <div class="badge badge-dark">${fleetLength}</div> Fleet Comp</a></li>
                </ul>
                <div class="tab-content">
                <!-- Fleet Waitlist -->
                  <div role="tabpanel" class="tab-pane fade show active" id="waitlist">                
                    <table class="table table-striped table-hover table-sm">
                      <thead>
                        <tr>
                          <th class="tw30"></th>
                          <th class="tw20per">Name</th>
                          <th class="tw30"></th>
                          <th class="tw30"></th>
                          <th class="tw30"></th>
                          <th class="tw30"></th>
                          <th class="tw80">Fits</th>
                          <th>System</th>
                          <th>Wait Time</th>
                        </tr>
                      </thead>
                      <tbody>
                      ${waitlistHTML}
                      </tbody>
                    </table>
                    <!-- End Fleet Waitlist -->
                    
                    <hr />
                    
                    <!-- Alt Waitlist -->
                    <table class="table table-striped table-hover table-sm">
                      <thead>
                        <tr>
                          <th class="tw30 text-right">Alt</th>
                          <th class="tw20per">Name // Main in Fleet</th>
                          <th class="tw30"></th>
                          <th class="tw30"></th>
                          <th class="tw30"></th>
                          <th class="tw30"></th>
                          <th class="tw80">Fits</th>
                          <th>System</th>
                          <th>Wait Time</th>
                          <th>Language</th>
                          <th>Alts in Fleet</th>
                        </tr>
                      </thead>
                      <tbody>
                      Alt waitlist will go here!
                        <!--<tr class="invite-default">
                          <td>
                            <img src="http://image.eveonline.com/Character/96304094_32.jpg" alt="avatar"> 
                          </td>
                          <td>
                            <a href="#">Caitlin Viliana</a>
                            <p>Newbro</p>
                          </td>
                          <td>
                            <button class="btn btn-success btn-sm" title="Invite to Fleet"><i class="fa fa-plus"></i>
                            </button>
                          </td>
                          <td>
                            <div class="dropdown">
                              <button class="btn btn-info btn-sm dropdown-toggle" data-toggle="dropdown" 
                              aria-expanded="false" type="button"><i class="fa fa-cog"></i> </button>
                              <div class="dropdown-menu" role="menu">
                                <a class="dropdown-item" href="#">View Pilot Profile</a>
                                <a class="dropdown-item" href="#">View Pilot Skills</a>
                              </div>
                            </div>
                          </td>
                          <td>
                            <button class="btn btn-sm" title="Browser Alarm"><i class="fa fa-bell"></i></button>
                          </td>
                          <td>
                            <button class="btn btn-danger btn-sm" title="Remove from Waitlist"><i class="fa fa-minus">
                            </i></button>
                          </td>
                          <td>
                            <a href="#"><img src="https://image.eveonline.com/Render/17740_32.png" title="Vindicator" 
                            alt="Vindicator"></a>
                            <a href="#"><img src="https://image.eveonline.com/Render/17920_32.png" title="Bhaalgorn" 
                            alt="Bhaalgorn"></a>
                            <a href="#"><img src="https://image.eveonline.com/Render/11987_32.png" title="Guardian" 
                            alt="Guardian"></a>
                            <a href="#"><img src="https://image.eveonline.com/Render/23913_32.png" title="Nyx" 
                            alt="Nyx"></a>
                          </td>
                          <td><a href="#">Jita</a></td>
                          <td>00M 00H</td>
                          <td>English</td>
                          <td>##</td>-->
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <!-- End Alt Waitlist -->

                  <!-- Fleetlist -->
                  <div role="tabpanel" class="tab-pane fade" id="fleetlist">
                  Todo
                  <!--<table class="table table-striped table-hover table-sm">
                    <thead>
                      <tr>
                        <th class="tw30"></th>
                        <th class="tw20per">Name</th>
                        <th class="tw30"></th>
                        <th class="tw30"></th>
                        <th>Current Ship</th>
                        <th>Wing // Squad</th>
                        <th class="tw15per">Waitlisted With</th>
                        <th>System</th>
                        <th>Fleet Time</th>
                        <th>Language</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="invite-default">
                        <td>
                          <img src="http://image.eveonline.com/Character/96304094_32.jpg" alt="avatar"> 
                        </td>
                        <td>
                          <a href="#">Caitlin Viliana</a>
                          <p>Newbro</p>
                        </td>   
                        <td>
                          <div class="dropdown">
                            <button class="btn btn-info btn-sm dropdown-toggle" data-toggle="dropdown" 
                            aria-expanded="false" type="button"><i class="fa fa-cog"></i> </button>
                            <div class="dropdown-menu" role="menu">
                              <a class="dropdown-item" href="#">View Pilot Profile</a>
                              <a class="dropdown-item" href="#">View Pilot Skills</a>
                            </div>
                          </div>
                        </td>
                        <td>
                          <button class="btn btn-danger btn-sm" title="Remove from Waitlist"><i class="fa fa-minus"></i>
                          </button>
                        </td>
                        <th><a href="#">Thanatos</a></th>
                        <td>Active // Logi</td>
                        <td>
                          <a href="#"><img src="https://image.eveonline.com/Render/17740_32.png" title="Vindicator" 
                          alt="Vindicator"></a>
                          <a href="#"><img src="https://image.eveonline.com/Render/17920_32.png" title="Bhaalgorn" 
                          alt="Bhaalgorn"></a>
                          <a href="#"><img src="https://image.eveonline.com/Render/11987_32.png" title="Guardian" 
                          alt="Guardian"></a>
                          <a href="#"><img src="https://image.eveonline.com/Render/23913_32.png" title="Nyx" 
                          alt="Nyx"></a>
                        </td>
                        <td><a href="#">Jita</a></td>
                        <td>00M 00H</td>
                        <td>English</td>
                      </tr>
                      <tr class="invite-default">
                          <td></td>
                          <td>
                            &nbsp;&nbsp;<a href="#">404 Viliana</a>
                          </td>
                          <td>
                            <div class="dropdown">
                              <button class="btn btn-info btn-sm dropdown-toggle" data-toggle="dropdown" 
                              aria-expanded="false" type="button"><i class="fa fa-cog"></i> </button>
                              <div class="dropdown-menu" role="menu">
                                <a class="dropdown-item" href="#">View Pilot Profile</a>
                                <a class="dropdown-item" href="#">View Pilot Skills</a>
                              </div>
                            </div>
                          </td>
                          <td>
                            <button class="btn btn-danger btn-sm" title="Remove from Waitlist"><i class="fa fa-minus">
                            </i></button>
                          </td>                          
                          <th><a href="#">Thanatos</a></th>
                          <td>Active // Logi</td>
                          <td>
                            <a href="#"><img src="https://image.eveonline.com/Render/17740_32.png" title="Vindicator" 
                            alt="Vindicator"></a>
                            <a href="#"><img src="https://image.eveonline.com/Render/17920_32.png" title="Bhaalgorn" 
                            alt="Bhaalgorn"></a>
                            <a href="#"><img src="https://image.eveonline.com/Render/11987_32.png" title="Guardian" 
                            alt="Guardian"></a>
                            <a href="#"><img src="https://image.eveonline.com/Render/23913_32.png" title="Nyx" 
                            alt="Nyx"></a>
                          </td>
                          <td><a href="#">Jita</a></td>
                          <td>00M 00H</td>
                          <td>English</td>
                        </tr>                                       
                    </tbody>
                  </table>-->
                </div>
              </div>
            </div>
          </div>
          <!-- End Waitlist Section -->
        </div>
      </section>
  `);
  }
};
