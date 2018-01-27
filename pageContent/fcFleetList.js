module.exports = function(payloadContent, cb) {
/*
Fleet object format:

{
	fc: user object,
	backseat: user object,
	type: "hq",
	status: "text",
	location: {
		id: id,
		name: "Jita"
	},
	members: [user objects],
	size: members.length,
	url: "hhttps://esi.tech.ccp.is..."
}

*/

var fleets = "";
  for (var i = 0; i < payloadContent.fleets.length; i++) {
  	fleets += `
    <tr>
      <td><img src="${payloadContent.fleets[i].fc.avatar}" alt="FCs Avatar" height=30%></td>
      <td><a href="#">${payloadContent.fleets[i].fc.name}</a></td>
      <td><a href="#">${payloadContent.fleets[i].backseat.name || "None"}</a>
      <td>${payloadContent.fleets[i].type}</td>
      <td>${payloadContent.fleets[i].status}</td>
      <td><a href="#">${payloadContent.fleets[i].location.name || "Unknown"}</a></td>
      <td>${payloadContent.fleets[i].members.length}</td>
      <td><a href="/commander/${payloadContent.fleets[i].id}"><button class="btn btn-sm btn-info"><i class="fa fa-binoculars"></i></button></a></td>
    </tr>
  	`
  }

  cb(`
      <!-- Page Content -->
      <div class="page-content">
        <div class="page-header">
          <div class="container-fluid">
            <h2 class="h5 no-margin-bottom">Fleet Management</h2>
          </div>
        </div>
        <section class="no-padding-top no-padding-bottom">
          <div class="container-fluid">
            <div class="row">
              <!-- Create Fleet -->
              <div class="col-md-12 col-sm-12">
                <div class="statistic-block block">
                <form action="/commander" method="POST" role="form">
                  <div class="vertical-input-group">
                    <div class="input-group">
                      <!--<span class="input-group-addon" data-toggle="tooltip" title="The pilot must log in at least once before you can add them to the team."><i class="fas fa-info-circle"></i></span>-->
                      <span class="input-group-addon">Fleet Boss: ${payloadContent.user.name}</span>
                      <input type="text" name="url" class="form-control" autocomplete="off" placeholder="https://esi.tech.ccp.is/v1/fleets/...../?datasource=tranquility" style="max-width:45%" autofocus/>
                      <select name="type" class="form-control dropdown">
                        <option value="Vanguards">Vanguards</option>
                        <option value="Assaults">Assaults</option>
                        <option value="Headquarters" selected>Headquarters</option>
                      </select>
                      <button class="btn btn-success" type="submit"><i class="fas fa-edit"></i> Register</button>
                    </div>
                  </div>
                  </form>
                </div>
              </div>
              <!-- Fleet List -->
              <div class="col-md-12 col-sm-12">
                <div class="statistic-block block">
                  <div class="progress-details d-flex align-items-end justify-content-between">
                    <table class="table table-striped table-hover table-sm">
                      <thead>
                        <tr>
                          <th class="tr35"></th>
                          <th>Active FC</th>
                          <th>Backseat</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Fleet Location</th>
                          <th>Size</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                      ${fleets}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  `)

}