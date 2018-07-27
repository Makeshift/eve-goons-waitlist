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