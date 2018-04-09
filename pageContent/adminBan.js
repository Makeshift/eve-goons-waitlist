module.exports = function(payloadContent, cb) {
  var banTable = "";
  for (var i = 0; i < payloadContent.banList.length; i++) {
     banTable += `<tr>
     <td><img src="https://image.eveonline.com/Character/${payloadContent.banList[i].characterID}_32.jpg" alt="Caitlin Vilianas Avatar"></td>
     <td><a href="/esi/ui/info/${payloadContent.banList[i].characterID}">${payloadContent.banList[i].pilotName}</a></td>
     <td>${payloadContent.banList[i].banType}</td>
     <td><a href="/esi/ui/info/${payloadContent.banList[i].banAdmin.characterID}">${payloadContent.banList[i].banAdmin.name}</a></td>
     <td>${payloadContent.banList[i].createdAt}</td>
     <td>${payloadContent.banList[i].notes}</td>
     <td><a class="btn btn-sm btn-success" href="/admin/bans/${payloadContent.banList[i]._id}"><i class="fa fa-gavel"></i> Revoke</a></td>
   </tr>`
  }

    cb(`
      <!-- Page Content -->
      <div class="page-content">
      <div class="page-header">
        <div class="container-fluid">
          <h2 class="h5 no-margin-bottom">Ban Management</h2>
        </div>
      </div>
      <div role="alert" class="alert alert-primary global-banner-inactive noselect">
        <strong>Partial Functionality:</strong> Only SQUAD bans are implemented at this time! Any other bans will be ignored.
      </div>
      <section class="no-padding-top no-padding-bottom">
        <div class="container-fluid">
          <div class="row">
            <!-- Add/View Bans -->
            <div class="col-md-12">
              <div class="statistic-block block">
                <button class="btn btn-danger" data-toggle="modal" data-target="#addBan" accesskey="n"><i class="fas fa-user-times"></i> Ban Pilot</button>
                <div class="progress-details d-flex align-items-end justify-content-between">  
                  <table class="table table-striped table-hover table-sm">
                    <thead>
                      <tr>
                        <th class="tr35"></th>
                        <th class="tr35per">Name</th>
                        <th class="tr15per">Ban Type</th>
                        <th class="tr35per">Banned By</th>
                        <th class="tr15per">Date</th>
                        <th>Notes</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${banTable}
                    </tbody>
                  </table>
                </div>  
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- New Ban Modal -->
      <div class="modal fade" id="addBan" role="dialog" tabindex="-1">
          <div class="modal-dialog" role="document">
              <div class="modal-content">
                  <div class="modal-header">
                      <h4 class="modal-title">Add a new Ban</h4><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button></div>
                  <div class="modal-body">
                      <form method="post" action="/admin/bans">
                        <div class="form-group">
                          <label for="name">Pilot's Name:</label>
                          <input type="text" id="name" class="form-control" name="pilotName" required/>
                        </div>

                        <div class="form-group">
                          <label for="type">Ban from:</label>
                          <select class="form-control" name="type">
                            <option value="Squad" selected required>Squad</option>
                            <option value="ArseFleet">ArseFleet</option>
                            <option value="Logistics">Logistics</option>
                            <option value="Multiboxing">Multiboxing</option>
                          </select>
                        </div>

                        <div class="form-group">
                          <label for="notes">Notes:</label>
                          <textarea id="notes" class="form-control" name="notes" maxlength="120" rows="4" placeholder="Private notes (max 120)"></textarea>
                        </div>  
                    </div>
                  <div class="modal-footer"><button class="btn btn-light" type="button" data-dismiss="modal">Cancel</button><button class="btn btn-primary" type="submit"><i class="fas fa-gavel"></i> Issue Ban</button></div>
                  </form>
              </div>
          </div>
      </div>
      <!-- New End Ban Modal -->
      `)  
    }