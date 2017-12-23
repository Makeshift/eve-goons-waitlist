module.exports = function(payloadContent) {
  console.log(payloadContent);

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
                  <form>
                    <!-- Select Character -->
                    <div class="form-group">
                      <label for="character">Select Pilot:</label>
                      <select class="form-control" id="character" required>
                        <!--<option value="">Choose</option>-->
                        <option value="${payloadContent.user.CharacterID}" selected>${payloadContent.user.name}</option>
                        <!--<option value="2">Samuel the Terrible</option>
                        <option value="3">Samuel the Merciless</option>-->
                      </select>
                    </div>
                    <!-- Select Language -->
                    <div class="form-group">
                      <label for="lan">Language:</label>
                      <select class="form-control" id="lan">
                        <option value="">Choose</option>
                        <option value="English">English</option>
                        <option value="Chinese">Chinese</option>
                      </select>
                    </div>
                    <!-- Yes/No Options -->
                    <ul class="list-unstyled">
                      <li>
                        <label for="translator">Do you require a translator?</label>
                        <div class="form-check">
                          <label class="form-check-label">
                          <input class="form-check-input" type="radio" id="translator" name="translator" required/> Yes
                          </label>
                          <label class="form-check-label">
                          <input class="form-check-input" type="radio" name="translator"/> No
                          </label>
                        </div>
                      </li>
                      <li>
                        <label for="ingame">Are you in our in-game channel?</label>
                        <div class="form-check">
                          <label class="form-check-label">
                          <input class="form-check-input" type="radio" id="ingame" name="ingame" required/> Yes
                          </label>
                          <label class="form-check-label">
                          <input class="form-check-input" type="radio" name="ingame"/> No
                          </label>
                        </div>
                      </li>
                      <li>
                        <label for="coms">Are you on comms?</label>
                        <div class="form-check">
                          <label class="form-check-label">
                          <input class="form-check-input" type="radio" id="comms" name="oncomms" required/> Yes
                          </label>
                          <label class="form-check-label">
                          <input class="form-check-input" type="radio" name="oncoms"/> No
                          </label>
                        </div>
                      </li>
                    </ul>
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
                        <input type="text" class="form-control" id="ship">
                      </div>
                    </div>
                    <!-- Action Buttons -->
                    <button class="btn btn-success btn-block"><i class="fa fa-check"></i> Join the Waitlist</button>
                    <div class="row">
                      <!--<div class="col-xl-12 col-lg-12 col-sm-12">
                        <button class="btn btn-info btn-block"><i class="fa fa-check"></i> Update the Waitlist</button>
                      </div>-->
                      <div class="col-xl-12 col-lg-12 col-sm-12">
                        <button class="btn btn-danger btn-block"><i class="fas fa-exclamation-triangle"></i> Leave the Waitlist</button>
                      </div>
                    </div>
                  </form>
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
                        <td>## out of ##</td>
                      </tr>
                      <tr>
                        <td>Wait Time:</td>
                        <td>00H 11M</td>
                      </tr>
                    </tbody>
                  </table>
                  <!-- Fleet Info Table -->		  
                  <div class="title"  style="padding-top:25px">
                    <div class="icon"></div>
                    <strong>Fleet Info</strong>
                  </div>
                  <table class="table table-striped table-hover table-sm noselect">
                    <tbody>
                      <tr>
                        <td  class="tw60per">Fleet Commander:</td>
                        <td><a href="#">Caitlin Viliana</a></td>
                      </tr>
                      <tr>
                        <td>Secondary Fleet Commander:</td>
                        <td><a href="#"> Amariah Kai</a></td>
                      </tr>
                      <tr>
                        <td>Fleet Type:</td>
                        <td>Headquarter</td>
                      </tr>
                      <tr>
                        <td>Fleet Status:</td>
                        <td>Forming</td>
                      </tr>
                      <tr>
                        <td>Fleet Location:</td>
                        <td><a href="#">Jita</a></td>
                      </tr>
                      <tr>
                        <td>Fleet Size:</td>
                        <td>## out of ##</td>
                      </tr>
                      <tr>
                        <td>Fleet Coms:</td>
                        <td><a href="#">Incursion -> A</a></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <!-- Fleet Info -->
            </div>
          </div>
        </section>
        `;
}