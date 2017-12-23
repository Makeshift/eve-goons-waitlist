const setup = require('./setup.js');
const path = require('path');
module.exports = {
    header: header,
    footer: footer,
    sidebar: sidebar,
    generateTemplate: generateTemplate,
    pageGenerate: pageGenerate
}

function pageGenerate(payload) {
  switch(payload.template) {
    case "fcLookup":
      return generateTemplate(payload, require(path.normalize(__dirname + "/pageContent/fcLookup.js")))
    break;
    case "publicProfile":
      return generateTemplate(payload, require(path.normalize(__dirname + "/pageContent/publicProfile.js")))
    break;
    case "publicWaitlist":
      return generateTemplate(payload, require(path.normalize(__dirname + "/pageContent/publicWaitlist.js")))
    break;
  }
}

//TODO: Undecided if I like this system.
function generateTemplate(payload, content) {
    return header(payload.header) + sidebar(payload.sidebar) + content(payload.content) + footer();
}

function header(headerPayload) {
  console.log(headerPayload)
  var notifications = "";
  for (var i = 0; i < headerPayload.user.notifications.length || 0; i++) {
    notifications += `<a href="#" class="dropdown-item">
    <div class="text d-flex justify-content-between"><strong>${headerPayload.user.notifications[i].text}</strong><br>${headerPayload.user.notifications[i].time}</div></a>`
  }

  var notificationBadge = "";
  var noOfNotifications = headerPayload.user.notifications.length
  if (noOfNotifications > 0) {
    notificationBadge = `<span class="badge dashbg-3">!</span>`;
  }

    return `
  <!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Goonfleet Incursions Waitlist</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="all,follow">
    <!-- Tether -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.3/js/tether.min.js"></script>
    <!-- Bootstrap CSS-->
    <link rel="stylesheet" href="/includes/vendor/bootstrap/css/bootstrap.min.css">
    <!-- Custom Font Icons CSS-->
    <link rel="stylesheet" href="/includes/css/font.css">
    <!-- Google fonts - Muli-->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Muli:300,400,700">
    <!-- theme stylesheet-->
    <link rel="stylesheet" href="/includes/css/style.default.css" id="theme-stylesheet">
    <!-- Custom stylesheet - for your changes-->
    <link rel="stylesheet" href="/includes/css/custom.css">
    <link rel="stylesheet" href="/includes/css/waitlist-colors.css">
    <!-- Favicon-->
    <link rel="shortcut icon" href="/includes/img/favicon.ico">
    <!-- Tweaks for older IEs--><!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script><![endif]-->
    <!-- Font Awesome 5 -->
    <script defer src="includes/vendor/fontawesome-pro-5.0.2/js/fontawesome-all.js"></script>
  </head>
  <body>
    <!-- Header Navbar -->
    <header class="header">
      <nav class="navbar navbar-expand-lg">
        <div class="container-fluid d-flex align-items-center justify-content-between">
          <!-- Nav Brand -->
          <div class="navbar-header">
            <a href="index.html" class="navbar-brand">
              <div class="brand-text brand-big visible text-uppercase"><strong class="text-primary">Goon</strong><strong>Incursions</strong></div>
              <div class="brand-text brand-sm"><strong class="text-primary">G</strong><strong>I</strong></div>
            </a>
            <button class="sidebar-toggle"><i class="fas fa-bars"></i></button>
          </div>
          <!-- End Nav Brand -->
          <!-- Right Nav Bar -->
          <ul class="right-menu list-inline no-margin-bottom">
            <!-- User Notifications Feed -->
            <li class="list-inline-item dropdown">
              <a id="notifications" href="#" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="nav-link tasks-toggle"><i class="icon-new-file"></i>${notificationBadge}</a>
              <ul aria-labelledby="notifications" class="dropdown-menu tasks-list">
                <li>
                  ${notifications}
                </li>
                <li>
                  <a href="#" class="dropdown-item text-center"> <strong>See All Notifications <i class="fa fa-angle-right"></i></strong></a>
                </li>
              </ul>
            </li>
            <!-- Logout -->
            <li class="list-inline-item logout"><a id="logout" href="#" class="nav-link">Logout <i class="icon-logout"></i></a></li>
          </ul>
        </div>
      </nav>
    </header>
  `
}

//TODO: Dynamically select which page we're on for selection
function sidebar(sidebarPayload) {

    return `
    <!-- Nav - Sidebar -->
    <div class="d-flex align-items-stretch">
      <nav id="sidebar">
        <div class="sidebar-header d-flex align-items-center">
          <div class="avatar"><img src="${sidebarPayload.user.avatar}" alt="..." class="img-fluid rounded-circle"></div>
          <div class="title">
            <h1 class="h5">${sidebarPayload.user.name}</h1>
            <p>${sidebarPayload.user.role}</p>
          </div>
        </div>
        <span class="heading">Pilot</span>
        <ul class="list-unstyled">
          <li ${sidebarPayload.selected === 1 ? 'class="active"' : ''}><a href="#"><i class="far fa-hourglass-half"></i> Waitlist</a></li>
          <li ${sidebarPayload.selected === 2 ? 'class="active"' : ''}>
            <a href="#myaccount" aria-expanded="${sidebarPayload.selected === 2 ? 'true' : 'false'}" data-toggle="collapse" class="${sidebarPayload.selected === 2 ? '' : 'collapsed'}"><i class="fa fa-user"></i> My Account</a>
            <ul id="myaccount" class="collapse list-unstyled ${sidebarPayload.selected === 2 ? 'show' : ''}">
              <li><a href="#">My Alts & Fits</a></li>
              <li><a href="#">My Stats</a></li>
              <li><a href="#">My SRP</a></li>
            </ul>
          </li>
          <li ${sidebarPayload.selected === 3 ? 'class="active"' : ''}>
            <a href="#squadtools" aria-expanded="false" data-toggle="collapse" class="collapsed"><i class="fas fa-star"></i> Squad Stuff</a>
            <ul id="squadtools" class="collapse list-unstyled" ${sidebarPayload.selected === 3 ? 'show' : ''}>
              <li><a href="#">Squad Fittings</a></li>
              <li><a href="#">Squad Roles</a></li>
              <li><a href="#">Squad Stats</a></li>
              <li><a href="#">NewBro Guide</a></li>
            </ul>
          </li>
          <li> <a href="#"><i class="fas fa-link"></i> Incursion Forums</a></li>
        </ul>
        <span class="heading">Fleet Commander</span>
        <ul class="list-unstyled">
          <li ${sidebarPayload.selected === 5 ? 'class="active"' : ''}> <a href="#"><i class="far fa-cogs"></i> Fleet Management</a></li>
          <li ${sidebarPayload.selected === 6 ? 'class="active"' : ''}> 
              <a href="#">
                <span class="fa-layers fa-fw">
                  <i class="fas fa-user"></i>
                  <i class="fas fa-search" data-fa-transform="shrink-3 down-5 right-4" style="color:#C82333"></i>
                </span>
              Pilot Lookup</a>
          </li>
          <li ${sidebarPayload.selected === 7 ? 'class="active"' : ''}>
            <a href="#squadmanagement" aria-expanded="false" data-toggle="collapse" class="collapsed'><i class="fas fa-key"></i> Squad L</a>
            <ul id="squadmanagement" class="collapse list-unstyled ${sidebarPayload.selected === 3 ? 'show' : ''}">
              <li><a href="#">Ban List</a></li>
              <li><a href="#">FC Management</a></li>
              <li><a href="#">White List</a></li>
            </ul>
          </li>
        </ul>
      </nav>
`;
}

function footer(footerPayload) {
    return `
        <!-- Footer-->
        <footer class="footer">
            <div class="footer__block block no-margin-bottom">
              <div class="container-fluid text-center">
                <p class="no-margin-bottom"><a href="#" data-toggle="modal" data-target="#legal">Legal Notices</a></p>
              </div>
            </div>
            <!-- Legal Notices  Modal -->
            <div role="dialog" tabindex="-1" class="modal fade" id="legal">
              <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h4 class="modal-title"><strong class="text-primary">Goon</strong><strong>Incursions</strong></h4>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                  </div>
                  <div class="modal-body">
                    <p>EVE Online and the EVE logo are the registered trademarks of CCP hf. All rights are reserved worldwide. All other trademarks are the property of their respective owners. EVE Online, the EVE logo, EVE and all associated logos and designs are the intellectual property of CCP hf. All artwork, screenshots, characters, vehicles, storylines, world facts or other recognizable features of the intellectual property relating to these trademarks are likewise the intellectual property of CCP hf. CCP hf. has granted permission to DYNAMIC. CCP is in no way responsible for the content on or functioning of this website, nor can it be liable for any damage arising from the use of this website.</p>
                    <ul class="list-unstyled text-center">
                      <li><small>Design by <a href="#">Caitlin  Viliana</a>, theme by: <a href="https://bootstrapious.com">Bootstrapious</a></small></li>
                      <li><small>Website developed and maintained by: <a href="#">Makeshift Storque</a></small></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    <!-- Javascript files-->
    <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js"> </script>
    <script src="/includes/vendor/bootstrap/js/bootstrap.min.js"></script>
    <script src="/includes/vendor/jquery.cookie/jquery.cookie.js"> </script>
    <script src="/includes/vendor/chart.js/Chart.min.js"></script>
    <script src="/includes/js/charts-home.js"></script>
    <script src="/includes/js/front.js"></script>
    <script>
    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    })
</script>
    </body>
  </html>
`;
}