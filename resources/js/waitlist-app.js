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