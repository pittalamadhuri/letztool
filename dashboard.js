var text="";
var pipe,pipedata,version,dynodata;
let db_size;
heroku.get('/apps').then(appsdata=>{
    console.log('Number of apps in Heroku = ' +appsdata.length);
    for(app in appsdata){
        let dynos = heroku.get(`/apps/${appsdata[app].name}/dynos`).then(dynodata=>{
       return dynodata[0].size;
            
        })
        console.log(dynos)
        
                text+="<tr><td>"+appsdata[app].name+"</td><td>"+appsdata[app].region.name+"</td><td>"+appsdata[app].web_url+"</td><td>"+dynos.promisevalue+"</td></tr>"
        }
            //console.log("text is "+text);

    //console.log('Name: '+apps[app].name+' Region: '+apps[app].region.name+' Web_URL: '+apps[app].web_url);
    document.getElementById('list').innerHTML=text;
    //console.log(apps[app]);
    //console.log('Name: '+apps[app].name+' Region: '+apps[app].region.name+' Web_URL: '+apps[app].web_url+' is in maintenance: '+apps[app].maintenance);

}
).catch((err)=>{console.log(err);});