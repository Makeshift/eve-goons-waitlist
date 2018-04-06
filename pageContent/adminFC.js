module.exports = function(payloadContent, cb) {
    var fcTable = `
    <table class="table table-striped table-hover table-sm">
      <thead>
        <tr>
          <th class="tr35"></th>
          <th class="tr45per">Name</th>
          <th class="tr45per">Alliance</th>
          <th class="tr45per">Rank</th>
          <th></th>
        </tr>
      </thead>
      <tbody>`;

      for(i = 0; i < payloadContent.fcs.length; i++){
        console.log(payloadContent.fcs[i])
        fcTable += `
        <tr>
          <td><img src="http://image.eveonline.com/Character/${payloadContent.fcs[i].characterID}_32.jpg" alt="${payloadContent.fcs[i].name}s Avatar"></td>
          <td><a href="/esi/ui/info/${payloadContent.fcs[i].characterID}">${payloadContent.fcs[i].name}</a></td>
          <td><a href="/esi/ui/info/${payloadContent.fcs[i].alliance.id}">${payloadContent.fcs[i].alliance ? payloadContent.fcs[i].alliance.name : "No alliance in DB"}</a></td>
          <td>${payloadContent.fcs[i].role}</td>
          <td><a class="btn btn-sm btn-default" href="/admin/commanders/?user=${payloadContent.fcs[i].characterID}" style="color:black"><i class="fa fa-info-circle"></i> Manage</a></td>
        </tr>`;
      }

      fcTable += `
          </tbody>
        </table>
      </div>`;

    var managePilot ="";
    if(payloadContent.manageUser.name != null) {
      managePilot = `
          <ul class="list-unstyled">
            <li><a href="/esi/ui/info/${payloadContent.manageUser.characterID}">${payloadContent.manageUser.name || ""}</a></li>
            <li>${payloadContent.manageUser.role || ""}</li>
            <li><strike>FCed for:</strike> </li>
          </ul>
          <form  method="post" action="/admin/commanders/update">
          <input type="hidden" name="pilotName" value="${payloadContent.manageUser.name}">
            <div class="form-group">
              <label for="updatePermission">Update Permission</label>
              <select id="updatePermission" class="form-control" name="permission">
                <optgroup label="FC Permissions">
                  <option value="${payloadContent.manageUser.roleNumeric || ""}" selected>Choose Rank</option>
                  <option value="1" required>Trainee</option>
                  <option value="3" required>Fleet Commander</option>
                  <option value="5" required>Leadership</option>
                </optgroup>
                <optgroup label="Demote to Pilot">
                  <option value="0">Remove FC Access</option>
                </optgroup>
              </select>
            </div>
            <button class="btn btn-success float-right">Update Permissions</button>
          </form>
          <strong>All Pilots</strong>
          <table class="table table-striped table-hover table-sm">
            <thead>
              <tr>
                <th class="tr40"></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><img src="http://image.eveonline.com/Character/96304094_32.jpg" alt="Pilot Avatar"></td>
                <td><a href="#"><strike>Caitlin Viliana</strike></a></td>
                <td><strike>Something Useful</strike></td>
              </tr>
            </tbody>
          </table>
          </div>`
      } else {
        managePilot = `<h4 class="text-danger">No FC Selected</h4>`
      }

      cb(`
      <!-- Page Content -->
      <div class="page-content">
        <div class="page-header">
          <div class="container-fluid">
            <h2 class="h5 no-margin-bottom">FC Management</h2>
          </div>
        </div>
        <section class="no-padding-top no-padding-bottom">
          <div class="container-fluid">
            <div class="row">
              <!-- Add/View FCs -->
              <div class="col-md-8 col-sm-12">
                <div class="statistic-block block">
                  <button class="btn btn-default" data-toggle="modal" data-target="#addFC" accesskey="h"><i class="fas fa-user-plus"></i> Add FC</button>
                  <div class="progress-details d-flex align-items-end justify-content-between">
                    ${fcTable}  
                  </div>
                </div>
              
              <!-- FC Management Section -->
              <div class="col-md-4 col-sm-12">
                <div class="statistic-block block">
                  ${managePilot}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- New FC Modal -->
        <div class="modal fade" id="addFC" role="dialog" tabindex="-1">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Add a new Fleet Commander</h4><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button></div>
                    <div class="modal-body">
                        <form method="post" action="/admin/commanders/update">
                          <div class="form-group">
                            <label for="name">Commander's Name:</label>
                            <input type="text" id="name" class="form-control" name="pilotName" required/>
                          </div>

                          <div class="form-group">
                            <label for="name">Set permission:</label>
                            <select class="form-control" name="permission">
                              <option value="0" selected required>Choose Rank</option>
                              <option value="1">Trainee</option>
                              <option value="3">Fleet Commander</option>
                              <option value="5">Leadership</option>
                            </select>
                          </div>  
                      </div>
                    <div class="modal-footer"><button class="btn btn-light" type="button" data-dismiss="modal">Cancel</button><button class="btn btn-primary" type="submit"><i clas="fas fa-check"></i> Add FC</button></div>
                    </form>
                </div>
            </div>
        </div>
        <!-- New End FC Modal -->
      `)  
    }