// ---------------------------------------------------------------

jQuery(document).ready(function() {
    init();
});

var ships = [];
var modules = [];

var shipMatcher = function() {
    return function findMatches(q, cb) {
	var matches, substringRegex;
	matches = [];
	substrRegex = new RegExp("^" + q, 'i');
	$.each(ships, function(i, str) {
	    if (substrRegex.test(str.name)) {
		matches.push(str);
	    }
        });
        cb(matches);
    };
};

// ---------------------------------------------------------------

var ship = false;
var scans = 0;
var partial_fit = [];

// ---------------------------------------------------------------

function reset() {

    scans = 0;
    $('#scans').html("0");

    ship = false;

    $('#textScan').val("");
    $('#scanMsg').html("");

    partial_fit = [];
    $('#textFit').val("");

    $('#slotHigh').html( "0 / 0");
    $('#slotMedium').html( "0 / 0");
    $('#slotLow').html( "0 / 0");
    $('#slotRig').html( "0 / 0");

}

function init() {

    console.log("Loading ships...");
    $.ajax({
	async: true,
	url: "/includes/js/fitscan/ships.json",
	mimeType: "application/json",
	dataType: 'json',
	error: function(xhr, status, error) {
	    alert("Couldn't load ship types");
	},
	success: function(json) {
        ships = json;
        shipDropdown();
	    console.log("Ship loading completed.");
	},
    });

    shipDropdown();

    console.log("Loading modules...");
    $.ajax({
	async: true,
	url: "/includes/js/fitscan/modules.json",
	mimeType: "application/json",
	dataType: 'json',
	error: function(xhr, status, error) {
	    alert("Couldn't load module types");
	},
	success: function(json) {
	    modules = json;
	    console.log("Module loading completed.");
	},
    });

    $("#fitSelector").change(function() {
        for(var i = 0; i < ships.length; i++) {
            if(ships[i].name === $(this).val()){
                ship = ships[i];
                continue;
            }
        }        
        updateFit();
    });

    $("#textScan").on('input', function() {
	console.log("E");
    });

    $("#textScan").on('input propertychange change keyup paste', function() {
	content = $("#textScan").val();
	$("#textScan").val("");
	updateModules(content);
    });

    reset();
}

function shipDropdown() {
    $.each(ships, function (i, item) {
        $('#fitSelector').append($('<option>', { 
            value: item.name,
            text : item.name 
        }));
    });
}

function findModule(name, haystack) {
    for (x in haystack) {
	if (haystack[x]['name'] == name) {
	    return haystack[x];
	}
    }
    return false;
}


function updateModules(content) {

    if (content == "") {
	return;
    }

    scans++;
    $('#scans').html(scans);

    console.log("Parsing input...");

    fit = []

    parse_found = 0;
    parse_unknown = 0;

    fit_added = 0;
    fit_missing = 0;
    fit_existed = 0;

    lines = content.split('\n')

    for (x in lines) {
	line = lines[x];

	if (line == "") {
	    continue;
	}

	module = findModule(line, modules);

	if (module === false) {
	    console.log("  Unknown: " + line);
	    parse_unknown++;
	    continue;
	}
	fit.push(module);
	console.log("  Match: " + module['name']);
    };

    parse_found = fit.length;
    console.log("Parsed " + parse_found + " modules with " + parse_unknown + " errors");

    for (x in partial_fit) {
	idx = fit.indexOf(partial_fit[x]);
	if (idx != -1) {
	    fit.splice(idx, 1);
	    fit_existed++;
	} else {
	    fit_missing++;
	}
    }
    fit_added = fit.length;
    partial_fit = partial_fit.concat(fit);
    log = "Scan has " + fit_added + " new modules, " + fit_existed + " already known modules and failed to include " + fit_missing + " known modules.";
    $('#scanMsg').html(log);
    console.log(log);

    updateFit();
}

function updateFit() {
    if (ship === false) {
	return;
    }

    low = 0;
    med = 0;
    hgh = 0;
    rig = 0;

    fit = "";
    fit = fit + "[" + ship['name'] + ", Incursion Squad - Fit Scan]\n";
    fit = fit + "\n";
    for (x in partial_fit) {
	if (partial_fit[x]['slot'] != "L") {
	    continue;
	}
	fit = fit + partial_fit[x]['name'] + "\n";
	low++;
    }
    $('#slotLow').html( low + " / " + ship['slotLow']);
    for (; low < ship['slotLow']; low++) {
	fit = fit + "[empty low slot]\n";
    }
    fit = fit + "\n";

    for (x in partial_fit) {
	if (partial_fit[x]['slot'] != "M") {
	    continue;
	}
	fit = fit + partial_fit[x]['name'] + "\n";
	med++;
    }
    $('#slotMedium').html( med + " / " + ship['slotMed']);
    for (; med < ship['slotMed']; med++) {
	fit = fit + "[empty med slot]\n";
    }
    fit = fit + "\n";

    for (x in partial_fit) {
	if (partial_fit[x]['slot'] != "H") {
	    continue;
	}
	fit = fit + partial_fit[x]['name'] + "\n";
	hgh++;
    }
    $('#slotHigh').html( hgh + " / " + ship['slotHgh']);
    for (; hgh < ship['slotHgh']; hgh++) {
	fit = fit + "[empty high slot]\n";
    }
    fit = fit + "\n";

    for (x in partial_fit) {
	if (partial_fit[x]['slot'] != "R") {
	    continue;
	}
	fit = fit + partial_fit[x]['name'] + "\n";
	rig++;
    }
    $('#slotRig').html( rig + " / " + ship['slotRig']);
    for (; rig < ship['slotRig']; rig++) {
	fit = fit + "[empty rig slot]\n";
    }

    $('#textFit').val(fit);
}

//Copy the fit to clipboard
function copy() {
    $("#textFit").select();
    document.execCommand('copy');
}

// ---------------------------------------------------------------