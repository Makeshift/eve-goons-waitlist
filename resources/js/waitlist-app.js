/* ESI */
function showInfo(targetID) {
    $.ajax({
      type: "POST",
      url: "/esi/ui/info/"+targetID
    });
}

function setWaypoint(systemID) {
    $.ajax({
        type: "POST",
        url: "/esi/ui/waypoint/"+systemID
    });
}

function openMarket(targetID) {
    $.ajax({
        type: "POST",
        url: "/esi/ui/market/"+targetID
    });
}

/* Pilot Search */
function openSearch() {
    document.getElementById("pilotSearchOverlay").style.display = "block";
    $(".navbar").attr("style", "display: none !important;");
    $("#pilotSearchName").focus();
}

function closeSearch() {
    document.getElementById("pilotSearchOverlay").style.display = "none";
    $(".navbar").removeAttr("style");
}

//Action the search
$(document).ready(function(){
    $("#searchForm").submit(function(e){
        e.preventDefault();
        $.ajax({
            type: "POST",
            url: "/search",
            data: $('#searchForm').serialize()
        }).done(function(data){
            if(data.url) {
                window.location.assign(data.url);
            }
        }).fail(function(data){
            $("#pilotSearchName").val('').attr("placeholder", data.responseText).focus();
            $("#searchButton").empty().append('<i class="fa fa-search"></i>');           
        });
    });
});

/* FC Banner */
function hideBanner(_id) {
    $.ajax({
        type: "POST",
        url: '/internal-api/banner/:' + _id}).done(function() {
            $('#topbanner').hide();
    }).fail(function(err) {
        console.log(err.responseText);
    });
}

$(document).ready(function(){
    $("#bannerMessage").submit(function(e){
        e.preventDefault();
    })
})

/* Tooltips + Navbar */
$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

function sideNav() {
    $.ajax({
        type: "POST",
        url: "/internal-api/account/navbar",
    }).fail(function(err){
        console.log('Error updating side bar: ' + err);
    });
}

/* Notifications */
function enableNotifications() {
    if (Notify.needsPermission && Notify.isSupported()) {
       Notify.requestPermission(function(){
           $( "#noNotify" ).hide();
           if(payloadData !== null) 
               showNotification(payloadData);
       }, function(){
           console.warn('Permission has been denied by the user');
       });
   } 
}

//Inform user that they don't get notifications.
$(document).ready(function () {
    if (Notify.needsPermission && Notify.isSupported()) {
        var noNotify = '<div role="alert" id="noNotify" class="alert alert-primary global-banner-inactive">'
        noNotify += '<i class="fas fa-bell-slash"></i> Notifications disabled: this means you may miss your invite. Click <span style="text-decoration:underline" onclick="enableNotifications()">HERE</span> to enable them.'
      noNotify += '</div>'
        $( "#alertarea" ).prepend( noNotify );
    }
   
})

function showNotification(payload) {
    var cNotification = new Notify(payload.data.appName, {
        body: payload.data.message,
        icon: payload.data.imgUrl,
        tag: payload.data.target.id,
        timeout: 30,
        notifyClick: cClick,
        notifyShow: cShow
    });

    cNotification.show();
        
    function cShow() {
        var audio = new Audio(payload.data.sound);
        audio.play();
    }
    function cClick() {
        window.location.assign(payload.data.comms.url);
    }
}

/*  WAITLIST FC MANAGE
* 
* > Update fleet info (FC, Backseat, Comms, Type)
* > Waitlist functions (Invites, Removals, Alarms)
* > Waitlist Admin (Comp Window, Clear all, Close)
* > Waitlist Tables (Pilots in Fleet)
*/
function setFC(fleetID) {
    $.ajax({
        type: "POST",
        url: '/commander/'+  fleetID +'/update/commander'
    }).done(function() {
        pollFleetInfo(fleetID)
    }).fail(function(err) {
        console.log("Error updating the backseat: ", err);
    })
}

function setBackseat(fleetID) {
    $.ajax({
        type: "POST",
        url: '/commander/'+ fleetID +'/update/backseat'
    }).done(function() {
        pollFleetInfo(fleetID);
    }).fail(function(err) {
        console.log("Error updating the backseat: ", err);
    })
}

function setCommsChannel(fleetID, commsUrl, commsName) {
    $.ajax({
        type: "POST",
        url: '/commander/'+ fleetID +'/update/comms',
        data: {
            name: commsName,
            url: commsUrl
        }
    }).done(function() {
        pollFleetInfo(fleetID)
    }).fail(function(err) {
        console.log("Error updating comms information: ", err);
    });
}

function setFleetStatus(fleetID, fleetStatus) {
    $.ajax({
        type: "POST",
        url: '/commander/'+ fleetID +'/update/status',
        data: {
            status: fleetStatus
        }
    }).done(function() {
        pollFleetInfo(fleetID)
    }).fail(function(err) {
        console.log("Error updating fleet status: ", err);
    });
}

function setFleetType(fleetID, fleetType) {
    $.ajax({
        type: "POST",
        url: '/commander/'+ fleetID +'/update/type',
        data: {
            type: fleetType
        }
    }).done(function() {
        pollFleetInfo(fleetID)
    }).fail(function(err) {
        console.log("Error updating fleet type: ", err);
    });
}

function pollFleetInfo(fleetID){
    $.ajax({
        type: "POST",
        url: '/commander/'+ fleetID +'/update/info',
        success: function(payload){
            $("#fcBoss").text(payload.fc.name).attr("onclick", "showInfo(" + payload.fc.characterID + ")");
            $("#fcBackseat").text(payload.backseat.name).attr("onclick", "showInfo(" + payload.backseat.characterID + ")")
            $("#status").text(payload.status);
            $("#type").text(payload.type);
            $("#comms").text(payload.comms.name).attr("href", payload.comms.url);
            $("#fleetSystem").text(payload.location.name).attr("onclick", "setWaypoint(" + payload.location.systemID + ")");
        }
    }).fail(function(err){
        console.log("Failed to update the fleet info panel");
    })
}
/* Waitlist functions */
function invitePilot(characterID, fleetID) {
    var count = Number($("#fleetWaitlistCount").text());

    $("#row-"+characterID).removeClass().addClass("invite-pending");

    $.ajax({
        type: "POST",
        url: "/commander/admin/invite/" + characterID + "/" + fleetID
    }).done(function() {
        $("#row-"+characterID).removeClass().addClass("invite-sent");
        $("#fleetWaitlistCount").text(Number($("#fleetWaitlistCount").text()) - 1);
    }).fail(function(text) {
        $("#row-"+characterID).removeClass().addClass("invite-failed");
        $("#" + characterID + "-status").text(text.responseText);
    });
}

function removePilot(characterID) {
    $.ajax({
        type: "POST",
        url: "/commander/admin/remove/" + characterID
    }).done(function(){
        //Colour and remove row. Then subtract the waitlist count by 1
        $("#row-"+characterID).removeClass().addClass("invite-failed");
        setTimeout(function() {
            $("#fleetWaitlistCount").text(Number($("#fleetWaitlistCount").text()) - 1);
            $("#row-"+characterID).remove();
        }, 5000)
    });

    
}

function alarmUser(targetid, fleetid) {
    $.ajax({
        type: "POST",
        url: "/commander/admin/alarm/" + targetid + "/" + fleetid,
        datatype: "HTML",
        success: function(data) {
            setTimeout(function () {
                $("#row-"+targetid).removeClass().addClass("invite-pending");
                }, 0);
                setTimeout(function () {
                $("#row-"+targetid).removeClass();
                }, 2500);	
        }
    }).fail(function(err) {
        console.log("Faied to alarm user: ", err);
    });
}


/* Waitlist Tables */
function pollPilotsInFleet(fleetID){
    $.ajax({
        type: "GET",
        url: "/internal-api/fleet/"+ fleetID +"/members"
    }).done(function(data){
        $("#fleetPilotsTable").empty();
        for(var i = 0; i < data.length; i++){
            var html = "<tr id='row-"+data[i].pilot.characterID+"'>";
                    html +="<td>"
                        html += "<img src='https://image.eveonline.com/Character/"+data[i].pilot.characterID+"_64.jpg' style='height:75%' alt='avatar'> "
                    html += "</td>";
                    html += "<td>";
                        html += "<a href='javascript:void(0);' onclick='showInfo("+data[i].pilot.characterID+")'>"+data[i].pilot.name+"</a>";
                        //TODO: Display alt if info is there.  
                    html += "</td>";
                    html += "<td>";
                        html += "<div class='dropdown'>";
                            html += "<button class='btn btn-info btn-sm dropdown-toggle' data-toggle='dropdown' aria-expanded='false' type='button'><i class='fas fa-caret-circle-down' style='margin-right:-50%'></i></button>";
                            html += "<div class='dropdown-menu' role='menu'>";
                                html += "<a class='dropdown-item' href='/commander/"+data[i].pilot.name.replace(' ','-')+"/profile'>View Pilot Profile</a>";
                                html += "<a class='dropdown-item' href='/commander/"+data[i].pilot.name.replace(' ','-')+"/skills'>View Pilot Skills</a>";
                                //TODO: XMPP if info is there
                            html += "</div>";
                        html += "</div>";
                    html += "</td>";
                    html += "<td>";
                        html += "<button class='btn btn-danger btn-sm disabled' onclick='removePilot()'><i class='fa fa-minus'></i></button>";
                    html += "</td>";
                    html += "<td>";
                        html += "<img src='https://image.eveonline.com/Render/"+data[i].activeShip+"_32.png' alt='Active Ship'>";
                    html += "</td>";
                    html += "<td>";
                        //there ships here
                    html += "</td>";
                    html += "<td>";
                        html += "<a href='javascript:void(0);' onclick='setWaypoint("+data[i].system.systemID+")'>"+data[i].system.name+"</a></td>";
                    html += "</td>";
                    html += "<td>"+data[i].joined+"</td>";
                html += "</tr>";

            $("#fleetPilotsTable").prepend(html);
            $("#numMembers").text(data.length);
        }
    }).fail(function(err){
        console.log(err);
    })
}

/* Public Waitlist AJAX
* 
* > Update Queue (Displays waitlist main + number of people on wl)
* > Get Fleets (Lists Fleets, Removals, Alarms)
*/
function updateQueue(){
    $.ajax({
        type: "GET",
        url: "/internal-api/waitlist/get-pilot-position"
    }).done(function(data){
        console.log(data)
        if(data.position !== null){
            $("#queueInfo").removeClass("hide");
            $("#queueInfoYourPos").text(data.position + " out of " + data.count);
            $("#queueInfoYourMain").text("### TODO");
        } else {
            $("#queueInfo").addClass("hide");
        }
    }).fail(function (err){
        console.log(err);
    });
}


function getFleetList(){
    $.ajax({
        type: "POST",
        url: "/internal-api/fleets"
    }).done(function(data){
        $("#fleetInfoCards").empty();
        $("#waitlistCards").addClass("hide");
        if(data.length > 0){
            $("#noFleetBanner").addClass("hide");
            $("#waitlistCards").removeClass("hide");

            for(var i = 0; i < data.length; i++){
                var html = '<div id="fleetInfoCards" class="col-lg-6 col-md-12">';       
                    html += '<div class="statistic-block block">';
                    //Title
                    html += '<div class="title">';
                        html += '<strong>Fleet Info</strong>';
                    html += '</div>';

                        //Table
                        html += '<table class="table table-striped table-sm noselect">';
                            html += '<tbody>';
                                html += '<tr>';
                                    html += '<td  class="tw60per">Fleet Commander:</td>';
                                    html += '<td><a href="javascript:void(0);" onclick="showInfo(' + data[i].fc.characterID + ')">' + data[i].fc.name + '</a></td>';
                                html += '</tr>';
                                html += '<tr>';
                                    html += '<td>Secondary Fleet Commander:</td>';
                                    html += '<td><a href="javascript:void(0);" onclick="showInfo(' + data[i].backseat.characterID + ')">' + data[i].backseat.name + '</a></td>';
                                html += '</tr>';
                                html += '<tr>';
                                    html += '<td>Fleet Type:</td>';
                                    html += '<td>' + data[i].type + '</td>';
                                html += '</tr>';
                                html += '<tr>';
                                    html += '<td>Fleet Status:</td>';
                                    html += '<td>' + data[i].status + '</td>';
                                html += '</tr>';
                                html += '<tr>';
                                    html += '<td>Fleet Size:</td>';
                                    html += '<td>' + data[i].size + '</td>';
                                html += '</tr>';
                                html += '<tr>';
                                    html += '<td>Fleet Location:</td>';
                                    html += '<td><a href="javascript:void(0)" onclick="setWaypoint(' +  data[i].location.systemID + ')">' + data[i].location.name + '</a></td>';
                                html += '</tr>';
                                html += '<tr>';
                                    html += '<td>Fleet Comms:</td>';
                                    html += '<td><a href="' + data[i].comms.url + '">' + data[i].comms.name + '</a></td>';
                                html += '</tr>';
                            html += '</tbody>';
                        html += '</table>';
                    html += '</div>';
                $("#fleetInfoCards").append(html)
            }
        } 
        else
        {
            $("#noFleetBanner").removeClass("hide");
        }
    }).fail(function(err) {
        console.log(err);
    });
}