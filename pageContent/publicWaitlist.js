var setup = require('../setup.js');
var waitlist = require('../globalWaitlist.js')(setup);

module.exports = function(payloadContent) {
  console.log(payloadContent);

var fleets = "";
  for (var i = 0; i < payloadContent.fleets.length; i++) {
    fleets += `
                  <div class="title"  style="padding-top:25px">
                    <div class="icon"></div>
                    <strong>Fleet Info</strong>
                  </div>
                  <table class="table table-striped table-hover table-sm noselect">
                    <tbody>
                      <tr>
                        <td  class="tw60per">Fleet Commander:</td>
                        <td><a href="#">${payloadContent.fleets[i].fc.name}</a></td>
                      </tr>
                      <tr>
                        <td>Secondary Fleet Commander:</td>
                        <td><a href="#">${payloadContent.fleets[i].backseat.name || "None"}</a></td>
                      </tr>
                      <tr>
                        <td>Fleet Type:</td>
                        <td>${payloadContent.fleets[i].type}</td>
                      </tr>
                      <tr>
                        <td>Fleet Status:</td>
                        <td>${payloadContent.fleets[i].status}</td>
                      </tr>
                      <tr>
                        <td>Fleet Location:</td>
                        <td><a href="#">${payloadContent.fleets[i].location.name}</a></td>
                      </tr>
                      <tr>
                        <td>Fleet Size:</td>
                        <td>${payloadContent.fleets[i].members.length}</td>
                      </tr>
                      <tr>
                        <td>Fleet Comms:</td>
                        <td><a href="#">${payloadContent.fleets[i].comms}</a></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
    `
  }

  var position = waitlist.getUserPositionSync(payloadContent.user.characterID);

      return `
      <!-- Page Content -->
      <div class="page-content">
        <div class="page-header">
          <div class="container-fluid">
            <h2 class="h5 no-margin-bottom"><strong class="text-primary">THE</strong><strong>WAITLIST</strong></h2>
          </div>
        </div>
        <!-- Banner Message -->
        <section>
          <div role="alert" class="alert alert-dark global-banner">
            <strong>PLEASE NOTE:</strong> This waitlist is in heavy, heavy alpha. Most things do not work, wording will be incorrect and things will break. Click <a href="https://github.com/Makeshift/eve-goons-waitlist/issues/new">HERE</a> to submit a bug report.
          </div>
        </section>
        <!-- Main Content -->
        <section class="no-padding-top padding-bottom">
          <div class="container-fluid">
            <!-- Waitlist Panel -->
            <div class="row">
              <!-- Waitlist Panel -->
              <div class="col-md-4 col-sm-6">
                <div class="statistic-block block">
                  <div class="title">
                    <div class="icon"></div>
                    <strong>Join the Waitlist</strong>
                  </div>
                    <!-- Select Character -->
                    <form method="POST" action="/" role="form">
                      <div class="form-group">
                        <label for="character">Select Pilot:</label>
                        <select name="user" class="form-control" id="character">
                          <!--<option value="">Choose</option>-->
                          <option value="${payloadContent.user.name}" selected>${payloadContent.user.name}</option>
                          <!--<option value="2">Samuel the Terrible</option>
                          <option value="3">Samuel the Merciless</option>-->
                        </select>
                      </div>
                      <!-- Select Language -->
                      <!--<div class="form-group">
                        <label for="lan">Language:</label>
                        <select name="language" class="form-control" id="lan">
                          <option value="">Choose</option>
                          <option value="English">English</option>
                          <option value="Chinese">Chinese</option>
                        </select>
                      </div>-->
                      <!-- Yes/No Options -->
                      <!--<ul class="list-unstyled">
                        <li>
                          <label for="translator">Do you require a translator?</label>
                          <div class="form-check">
                            <label class="form-check-label">
                            <input class="form-check-input" type="radio" id="translator" name="translator" value="true" required/> Yes
                            </label>
                            <label class="form-check-label">
                            <input class="form-check-input" type="radio" name="translator" value="false"/> No
                            </label>
                          </div>
                        </li>
                        <li>
                          <label for="ingame">Are you in our in-game channel?</label>
                          <div class="form-check">
                            <label class="form-check-label">
                            <input class="form-check-input" type="radio" id="ingame" name="ingame" value="true" required/> Yes
                            </label>
                            <label class="form-check-label">
                            <input class="form-check-input" type="radio" value="false" name="ingame"/> No
                            </label>
                          </div>
                        </li>
                        <li>
                          <label for="coms">Are you on comms?</label>
                          <div class="form-check">
                            <label class="form-check-label">
                            <input class="form-check-input" type="radio" id="comms" name="oncomms" value="true" required/> Yes
                            </label>
                            <label class="form-check-label">
                            <input class="form-check-input" type="radio" value="false" name="oncoms"/> No
                            </label>
                          </div>
                        </li>
                      </ul>-->
                      <!-- Select Fits -->
                      <div id="fits">
                        <!--<strong>Select your fits <i class="fa fa-info-circle" data-toggle="tooltip" data-placement="top" title="Please select up to four fits you're willing to bring. You can manage your fits from the 'My Account' option on the menu."></i> </strong>-->
                        <!--<ul class="list-unstyled">
                          <li>
                            <button class="btn btn-sm btn-block fit" type="button">a</button>
                            <button class="btn btn-sm btn-block fit" type="button">b</button>
                            <button class="btn btn-sm btn-block fit" type="button">c</button>
                            <button class="btn btn-sm btn-block fit" type="button">d</button>
                          </li>
                        </ul>-->
                        <div class="form-group">
                          <label for="ship">Ship Type: </labl>
                          <input type="text" name="ship" class="form-control" id="ship">
                        </div>
                      </div>
                      <!-- Action Buttons -->
                      <button class="btn btn-success btn-block" type="submit"><i class="fa fa-check"></i> Join the Waitlist</button>
                    </form>
                    <div class="row">
                      <!--<div class="col-xl-12 col-lg-12 col-sm-12">
                        <button class="btn btn-info btn-block"><i class="fa fa-check"></i> Update the Waitlist</button>
                      </div>-->
                      <div class="col-xl-12 col-lg-12 col-sm-12">
<<<<<<< HEAD
                        <button class="btn btn-danger btn-block" onclick="location.href='/remove';"><i class="fa fa-warning"></i> Leave the Waitlist</button>
=======
                        <button class="btn btn-danger btn-block"><i class="fas fa-exclamation-triangle"></i> Leave the Waitlist</button>
>>>>>>> f5646c55a60dceef873fce044277e708a18d9214
                      </div>
                    </div>
                </div>
              </div>
              <!-- End Waitlist Panel -->
              <!-- Fleet Info -->
              <div class="col-md-4 col-sm-6">
                <div class="statistic-block block">
                  <div class="title">
                    <div class="icon"></div>
                    <strong>Queue Info</strong>
                  </div>
                  <!-- Your Position Table -->
                  <table class="table table-striped table-hover table-sm noselect">
                    <tbody>
                      <tr>
                        <td class="tw60per">Your Position:</td>
                        <td>${position.position || "##"} out of ${position.length || "##"}</td>
                      </tr>
                      <!--<tr>
                        <td>Wait Time:</td>
                        <td>00H 11M</td>
                      </tr>-->
                    </tbody>
                  </table>
                  <!-- Fleet Info Table -->		  
                  ${fleets}
              <!-- Fleet Info -->
            </div>
          </div>
        </section>
        `;
}