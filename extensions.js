var domain1;
window.$ = window.jQuery = require('jquery')
if(!localStorage.getItem('applist')){
    var apps = {"names":[{app:"demo-ml",domain:"demo-ml.herokuapp"},{app:"cs-team",domain:"cs-team.herokuapp"}]};
    localStorage.setItem('applist', JSON.stringify(apps));
}
function pathUpdate(){
    tempPlayer=document.getElementById("playerPath").value;
    tempEditor=document.getElementById("editorPath").value;
    var obj = {"player_dest": tempPlayer, "editor_dest": tempEditor};
    localStorage.setItem('myStorage', JSON.stringify(obj));
    window.location.reload();
    }
    function addApp(){
        
        var n=document.getElementById("appName").value;
        var d=document.getElementById("appDomain").value;
        console.log('in add app'+n+' '+d);
        list.names.push({app:n,domain:d}); 
        localStorage.setItem('applist', JSON.stringify(list));
        window.location.reload();
        
    }
var counter,i;
    //Destinations of extensions used in chrome
    var obj = JSON.parse(localStorage.getItem('myStorage'));
    var list= JSON.parse(localStorage.getItem('applist'));
    var player_dest=obj.player_dest;
    var editor_dest=obj.editor_dest;
    window.onload = function() {
    document.getElementById("playerPath").value=player_dest;
    document.getElementById("editorPath").value=editor_dest;
    for(i=0;i<list.names.length;i++)
    {

        appSelect = document.getElementById('extensionlist');
        appSelect.options[appSelect.options.length] = new Option(list.names[i].app,list.names[i].domain);
        console.log(list.names[i].app);
    }

    }
   
    let $ = require('jquery');
    var copydir=require('copy-dir');
    var unzip=require('unzip-crx');
    var ncp = require('ncp').ncp;
    //fs-extra wanted for deleting contents of a folder in simple way
    var fs = require('fs-extra'),
    request = require('request');
    var download = function(uri, filename, callback){
      request.head(uri, function(err, res, body){
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
      });
    };
    function manageEditor(){
        
    //emptying the directory of the editor
    fs.emptyDir(editor_dest).then(() => {
        console.log('successfully cleared editor');     
            //copying contents of extracted directory to editor destination
            unzip(domain1+'editor.crx',editor_dest).then(() => {
                console.log("editor crx unzipped");
                counter++; progBar(counter);
            });
            /*ncp(domain1+'editor', editor_dest,stopOnErr=true, function (err) {
                if (err) {
                    return console.log("ncp error"+err);
                }
                console.log('editor loaded');
           });*/
    })
    .catch(err => {
        console.error(err)
    })
           
    
    }
    function managePlayer(){
    fs.emptyDir(player_dest).then(() => {
                console.log('successfully cleared player');
                //copying contents of extracted directory to editor destination
                ncp(domain1+'player', player_dest, function (err) {
                    if (err) {
                        return console.log("ncp error"+err);
                    }
                    console.log('player loaded');
                    counter++; progBar(counter);
               });
            })
            .catch(err => {
                console.error(err)
            })
    }
    function load(){
        //gets the selected value from the window
         domain1= $("#extensionlist").find(":selected").val();
         console.log('selected value '+domain1);
            counter=0;
            var ele=document.getElementById('bar');
            ele.style.width='0%';
        //for editor
        try{
        //checks whether editor crx file is already there
            if(!fs.existsSync(domain1+'editor')||!fs.existsSync(domain1+'player')){
                editor_uri="http://"+domain1+".com/api/public/admin/extensions/editor/letznav_editor.crx";
                console.log(editor_uri);
                player_uri="http://"+domain1+".com/api/public/admin/extensions/player/letznav_player.crx";
                console.log(player_uri);
                download(player_uri, domain1+'player.crx', function(){
                        //this is callback after downloading extension
                        console.log('Downloaded player from URI');
                        //Unzipping the crx file downloaded
                        unzip(domain1+'player.crx').then(() => {
                            console.log("player crx unzipped");
                            managePlayer();
                        });
                    });
                download(editor_uri, domain1+'editor.crx', function(){
                    //this is callback after downloading extension
                    console.log('Downloaded editor from URI');
                    //Unzipping the crx file downloaded
                    /*unzip(domain1+'editor.crx').then(() => {
                        console.log("editor crx unzipped");
                        manageEditor();
                    });*/manageEditor();
                   
                });
            }//end if the editor crx is already present
            else{
                //just for a check
                console.log('extension existing');
                managePlayer();
                manageEditor();
                
            }
           
        }
        catch(error)
        {
            console.log('Error occurred while working'+error);
        }
        
    }
    function progBar(count){
        if(count==1)
        {
            var ele=document.getElementById('bar');
            ele.style.width='70%'
        }
        if(count==2)
        {
            var ele=document.getElementById('bar');
            ele.style.width='100%'
        }
    }