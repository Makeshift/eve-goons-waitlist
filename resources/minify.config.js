const log = require('../logger.js')(module);

getPreamble(function(preamble){
    var jsFiles = ['bird-alert.min.js', 'front.js', 'waitlist-app.js'].map(function (file) {
        return require('fs').readFileSync('resources/js/' + file, 'utf8');
    })

    minifyJSGo(jsFiles, function(err){
        if(err) {
            log.warn("Failed to minify JS");
            log.error(err);
        } else {
            log.info("Javascript successfully minfied to ../public/waitlist-app.min.js");
        }
    });

    function minifyJSGo(code, err){
        var result =  require('uglify-js').minify(code);
        
        //Shit Broke
        if(result.error) {
            log.warn("Failed to minify ", result.error)
            err(result.error);
            return;
        }
        
        //Write the file
        require('fs').writeFile("public/includes/js/waitlist-app.min.js", preamble + result.code, function (error) {
            err(error)
        });
    }
});

function getPreamble(cb){
    var text;
    let d = new Date();
    text = "/*\n";
    text += "* Imperium Incursions Waitlist\n";
    text += "* @Author: Samuel Grant\n";
    text += "* @Repo: https://github.com/makeshift-eve-goons-waitlist\n"
    text += "* @Includes: Bird-AlertJS, FrontJS\n";
    text += "* @Updated: " + d.toISOString();
    text += "\n*/\n";
    cb(text);
}