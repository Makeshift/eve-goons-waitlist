module.exports = function(vars) {
	return `
          <!-- Page Content -->
      <div class="page-content">
        <div class="page-header">
          <div class="container-fluid">
            <form>
              <input class="form-control" type="search" name="search" placeholder="Who are you searching for..." autofocus style="max-width: 350px; display:inline;"> 
              <button class="btn btn-link btn-lg" type="submit"><i class="icon-magnifying-glass-browser"></i></button>
            </form>
          </div>
        </div>
        <section class="no-padding-top no-padding-bottom">
          <div class="container-fluid">
            <div class="row">
              <!-- User Profile -->
              <div class="col-md-6 col-sm-12">
                <div class="statistic-block block">
                  <div class="row">
                    <div class="col-md-4 col-sm-12 text-center">
                      <img src="http://image.eveonline.com/Character/96304094_128.jpg" alt="DYNAMICs avatar">
                      <ul class="list-unstyled">
                        <li><a href="#">DYNAMIC</a></li>
                        <li>
                          <p>DYNAMIC</p>
                        </li>
                      </ul>
                      <button class="btn btn-danger"><i class="fa fa-warning"></i> Reset Name</button>
                    </div>
                    <div class="col-md-8 col-sm-12">
                      <p>Known Alts:</p>
                      <table class="table table-striped table-hover table-sm noselect">
                        <thead>
                          <tr>
                            <td class="tw35"></td>
                            <td></td>
                            <td>Linked On:</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><img src="http://image.eveonline.com/Character/96304094_32.jpg" alt="Pilot Avatar"></td>
                            <td><a href="#">Caitlin Viliana</a></td>
                            <td>DD-MM-YYYY</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <!-- FC Comments -->
                <div class="statistic-block block">
                  <p>FC Comments:</p>
                  <form>
                    <div class="form-group">
                      <textarea class="form-control" style="resize:none;" placeholder="Notes about this pilot FCs may need to know about!" required></textarea>
                    </div>
                    <button class="btn btn-success btn-sm position-right"><i class="fa fa-check-circle"></i> Save Comment</button>
                  </form>
                  <hr>
                  <div class="row">
                    <div class="col-md-12">
                      <p><a href="#"> DYNAMIC</p>
                      <hr/ >
                    </div>
                  </div>
                </div>
              </div>
              <!-- Fits and Stats -->
              <div class="col-md-6 col-sm-12">
                <!-- Active Fits -->
                <div class="statistic-block block">
                  <div class="row">
                    <div class="col-md-12 col-sm-12">
                      <p>Active Fits:</p>
                      <table class="table table-striped table-hover table-sm noselect">
                        <thead>
                          <tr>
                            <td class="tw35"></td>
                            <td></td>
                            <td>Fit added on:</td>
                            <td>Last used:</td>
                            <td></td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><img src="https://image.eveonline.com/Render/17738_32.png" alt="Ship Icon"></td>
                            <td><a href="#">Machariel</a></td>
                            <td>DD-MM-YYYY</td>
                            <td>10 Days Ago</td>
                            <td><a href="#">View Fit</a></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <!-- Fits & Player Stats -->
                <div class="statistic-block block">
                  <div class="row">
                    <div class="col-md-12 col-sm-12">
                      <p>Player Stats:</p>
                      <div class="bar-chart block chart">
                        <div class="bar-chart chart">
                          <canvas id="barChartCustom1"></canvas>
                        </div>
                      </div>
                      <!-- Metric Tabs -->
                      <div>
                        <ul class="nav nav-tabs">
                          <li class="nav-item"><a role="tab" data-toggle="tab" href="#tab-1" class="nav-link">Pilot Overview</a></li>
                          <li class="nav-item"><a role="tab" data-toggle="tab" href="#tab-2" class="nav-link">Site Numbers</a></li>
                        </ul>
                        <div class="tab-content">
                          <!-- Pilot Overview -->
                          <div role="tabpanel" class="tab-pane active" id="tab-1">
                            <table class="table table-striped table-hover table-sm noselect">
                              <tbody>
                                <tr>
                                  <td class="tw40per">Hours in Fleet:</td>
                                  <td>DYNAMIC</td>
                                </tr>
                                <tr>
                                  <td>Isk made (Est):</td>
                                  <td>DYNAMIC times.</td>
                                </tr>
                                <tr>
                                  <td>Number of Deaths:</td>
                                  <td>DYNAMIC</td>
                                </tr>
                                <tr>
                                  <td>SRP Requests</td>
                                  <td><a href="#">View All</a></td>
                                </tr>
                                <tr>
                                  <td>Kicked from fleet:</td>
                                  <td>DYNAMIC times.</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <!-- Site Metrics --> 
                          <div role="tabpanel" class="tab-pane" id="tab-2">
                            <table class="table table-striped table-hover table-sm noselect">
                              <tbody>
                                <tr>
                                  <td class="tw40per">Number of HQs:</td>
                                  <td>DYNAMIC</td>
                                </tr>
                                <tr>
                                  <td>Number of Assaults:</td>
                                  <td>DYNAMIC times.</td>
                                </tr>
                                <tr>
                                  <td>Number of Vanguards:</td>
                                  <td>DYNAMIC</td>
                                </tr>
                                <tr>
                                  <td>Sites as Fleet Commander:</td>
                                  <td>N/A</td>
                                </tr>
                                <tr>
                                  <td>Sites as Backseat:</td>
                                  <td>N/A</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <!-- End Tabs -->
                    </div>
                  </div>
                </div>
                <!-- Right Col -->
              </div>
            </div>
        </section>
	`;
}