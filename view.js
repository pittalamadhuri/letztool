let $ = require('jquery');
var fs = require('fs'),
    request = require('request');

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

function navigate(){
let domain= $("#extensionlist").find(":selected").val();
domain="http://"+domain+"/api/public/admin/extensions/editor/letznav_editor.crx";
download(domain, 'google.crx', function(){
  console.log('done');
});
}