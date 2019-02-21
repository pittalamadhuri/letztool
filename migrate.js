function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        console.log('not json '+e);
    }
}
//Declarations
var srcname,tarname,srcstr,tarstr,flowname,newflowid,stepcount,plinkid,newappid,oldflow,oldflowid,currstep,oldjid,ind,repid,stepid,newvalue;
var newstepids=[];
var oldstepids=[];
var newjids=[];
const Heroku=require('heroku-client')
var HEROKU_API_TOKEN='09f76a85-ba87-46ea-a99f-57778698c3d9'
const heroku=new Heroku({token: HEROKU_API_TOKEN})
//Getting command line args and storing them
function copyFlow(){
srcname=document.getElementById("src").value;
tarname=document.getElementById("tar").value;
flowname=document.getElementById("flowname").value;
newappid=document.getElementById("appid").value;
heroku.get(`/apps/${srcname}/config-vars`).then(apps=>{
    srcstr=apps.DATABASE_URL.toString();
    console.log(srcstr);
    heroku.get(`/apps/${tarname}/config-vars`).then(apps=>{
        tarstr=apps.DATABASE_URL.toString();
        console.log(tarstr);
        start();
    }
    ).catch(err=>console.log('Error while connecting to target admin '+err))
}
).catch(err=>console.log('Error while connecting to source admin '+err))



}

function start(){
    var ele=document.getElementById('copybar');
    ele.style.width='10%'

const {Pool,Client} = require('pg');
const Query=require('pg').Query;
//Declaring source client with DB string
const src_client = new Client({connectionString:srcstr,ssl: true});
//Declaring target client with DB string
const tar_client=new Client({connectionString:tarstr,ssl: true});
//Source client process starts
src_client.connect((err)=>{
  if (err) 
  {
    console.error('Source client connection error', err.stack)
    process.exit();
  } 
  else 
  {
    console.log('flow name is +'+flowname+'+ and client is connected');
    //getting flow id from source database using flow name in command line args
    oldflow=src_client.query("select id,external_unique_id as eid from flows where id=(select flow_id from flow_texts where name=$1::text and is_deleted=false)",[flowname],function(err,mainresult){
    if(err)
    {
        console.log('error while getting flow id from src db :'+err);
        src_client.end();
        process.exit();
    }      
    else
    {
      if(oldflowid<0)//check if the flow exists or not in sourcedb
      {
      console.log('flow not found');
      src_client.end();
      process.exit();
      }
      else
      {
        oldflowid=mainresult.rows[0].id;//storing the src flow id
        plinkid=mainresult.rows[0].eid;
        console.log('old flow id is '+oldflowid);
        console.log('plinkid is '+plinkid);
        var ele=document.getElementById('copybar');
        ele.style.width='30%'
        tar_client.connect();//connecting to target client
        //Inserting the flow instance to flows table of target db
        tar_client.query('insert into flows(applicationid,external_unique_id) values($1::integer,$2::varchar)',[newappid,plinkid],(err,result)=>{
        if(err)
        {
        console.log("error in inserting flow :"+err);
        src_client.end();
        tar_client.end();
        process.exit();  
        }

        else
        {
            //Getting the flow id that is inserted in the target DB
            tar_client.query("select max(id) as id from flows",function(err,result){
            if(err)
            {
            console.log("error in inserting flow :"+err);
            src_client.end();
            tar_client.end();
            process.exit();
            }
            else
            {
            newflowid=result.rows[0].id;//storing the new flow id of target db
            console.log('new flow id is '+newflowid);
            //process to insert the flow_text data which has the name of the flow in diff languages
            //Getting the flow_text data from the source db
            src_client.query('select locale_id,name,description from flow_texts where flow_id= $1::integer',[oldflowid],(err,result)=>{
                if(err)
                {
                    console.log("error in fetching flow names from flow_texts: "+err);
                    src_client.end();
                    tar_client.end();
                    process.exit();
                }
                else
                {
                //insert the flow texts into the target db
                for(var k=0;k<result.rows.length;k++)
                {
                  tar_client.query('insert into flow_texts(flow_id,locale_id,name,description) values($1::integer,$2::integer,$3::text,$4::text)',[newflowid,result.rows[k].locale_id,result.rows[k].name+" migrated",result.rows[k].description],(err,result)=>{
                    if(err)
                    {
                        console.log("error in inserting flow_texts: "+err);
                        src_client.end();
                        tar_client.end();
                        process.exit();
                    }
                    });
                }
                var ele=document.getElementById('copybar');
                ele.style.width='40%'
                }
            });
            //Getting flow step information from the source
            src_client.query("select id,index, options, admin_metadata,external_unique_id from flow_steps where flow_id="+oldflowid+" and is_deleted=false order by index",function(err,result){
            if(err)
            {
                console.log('Error while fetching data from source db: '+err);
                src_client.end();
                tar_client.end();
                process.exit();
            }            
            else
            {
                stepcount=result.rows.length;//counting the number of steps in the flow(getting this from the resultset of above query)
                for(var i=0;i<result.rows.length;i++)
                {
                    oldstepids.push(result.rows[i].id) //storing srcdb step ids into oldstepids
                    if(JSON.stringify(result.rows[i].admin_metadata)=="{}"){
                        oldjid=result.rows[i].id;
                        newjids.push(oldstepids.indexOf(oldjid));
                    src_client.query("select options->'decisionPoint'#>'{actions}'->0->'bounceToStep'->'stepId' as p from flow_steps where id=$1::integer",[result.rows[i].id],function(err,res){
                        if(err){
                            console.log('error getting json data: '+err);
                        }
                    });
             
                
                }
                    //inserting the resultset data into the target DB
                    tar_client.query('insert into flow_steps(flow_id,index,options,admin_metadata,external_unique_id) values($1::integer,$2::integer,$3::json,$4::json,$5::varchar)',[newflowid,result.rows[i].index,result.rows[i].options,result.rows[i].admin_metadata,result.rows[i].external_unique_id],(err,result)=>{
                    if(err)
                    {
                        console.log('error while inserting row' +i+ 'error is '+err);
                        src_client.end();
                        tar_client.end();
                        process.exit();
                    }
            
                    });       
                }
                var ele=document.getElementById('copybar');
                ele.style.width='70%'
                //This next query is to get the step ids in the target db that are resulted by running the above insertions
                tar_client.query('select id from flow_steps order by id desc limit $1::integer',[stepcount],(err,result)=>{
                if(err)
                {
                    console.log('error while getting inserted step id' +i+ ' and error is '+err);
                    src_client.end();
                    tar_client.end();
                    process.exit();
                }
                else
                {
                    for(var j=0;j<stepcount;j++)
                    {
                        newstepids.unshift(result.rows[j].id);
                    }
                    //for asynchronous getting of flow_step_texts from src and adding to the table in target DB
                    function delay()
                    {
                      return new Promise(resolve=>  setTimeout(resolve,1000));
                    }
                    async function delayedLog(l)
                    {
                        await delay();
                        console.log('inserted step '+(l+1)+ ' of '+oldstepids.length);
                        //manageJumps();
                        //checking if all steps have been inserted and closing the connection
                        
                    }
                    function exitMig(){
                        src_client.end();
                        tar_client.end();
                        var ele=document.getElementById('copybar');
                        ele.style.width='100%'

                    }
                    var fetchexid=function()
                    {
                        tar_client.query("select options->'decisionPoint'#>'{actions}'->0->'bounceToStep'->'stepId' as p from flow_steps where id=$1::integer",[newstepids[newjids[n]]],function(err,res){
                            if(err){
                                console.log('error getting json data: '+err);
                            }
                            else{
                                console.log('the json contains step id as '+res.rows[0].p)
                                ind=oldstepids.indexOf(res.rows[0].p);
                                console.log('index that should be replaced is '+ind);
                                repid=newstepids[ind];
                                console.log('step id that should be replaced with is '+repid);
                                console.log('newstepids are '+newstepids);
                                console.log('new jids are'+newjids);
                                console.log('number is '+n);
                                return
                            }
                        });
                    };
                    function updatestepid(stepid,newvalue){
                        tar_client.query("update flow_steps set options=jsonb_set(options,'{decisionPoint,actions,0,bounceToStep,stepId}',$1::jsonb,false) where id=$2::integer",[newvalue,stepid],function(err,res){
                            if(err){
                                console.log('error inserting json data (new stepid): '+err);
                            }
                            else{
                                console.log('updated step id '+newstepids[newjids[n]]);
                            }
                           });

                    }
                    function manageJumps(){
                        for(var n=0;n<newjids.length;n++)
                    {
                         //console.log('Flow Inserted');
                         //console.log('The step ids that should be updated are '+newstepids[newjids[n]]);
                          fetchexid(n).then(updatestepid(stepid,newvalue));
                          new Promise(function(n)
                          {
                              tar_client.query("select options->'decisionPoint'#>'{actions}'->0->'bounceToStep'->'stepId' as p from flow_steps where id=$1::integer",[newstepids[newjids[n]]],function(err,res){
                                  if(err){
                                      console.log('error getting json data: '+err);
                                  }
                                  else{
                                      console.log('the json contains step id as '+res.rows[0].p)
                                      ind=oldstepids.indexOf(res.rows[0].p);
                                      console.log('index that should be replaced is '+ind);
                                      repid=newstepids[ind];
                                      console.log('step id that should be replaced with is '+repid);
                                      console.log('newstepids are '+newstepids);
                                      console.log('new jids are'+newjids);
                                      console.log('number is '+n);
                                      return
                                  }
                              });
                          });

                        }



                    }

                    //Promises

                   

                    //Process for getting step texts in diff languages and inserting them in other db
                   async function insert_flow_texts(){
                     for(var l=0;l<oldstepids.length;l++)
                    {
                      await delayedLog(l);//for running synchronously
                      currstep=oldstepids[l];
                      currinstep=newstepids[l];
                      //fetch flow_step_texts data from source db 
                      src_client.query("select * from flow_step_texts where flow_step_id=$1::integer and is_deleted=false",[currstep],function(err,result){
                        if(err)
                        {
                            console.log('Error while fetching flow_step_texts data from source db: '+err);
                            src_client.end();
                            tar_client.end();
                            process.exit();
                        }
                        else
                        {
                            //console.log('resulted rows length is '+result.rows.length);
                            for(var m=0;m<result.rows.length;m++)
                            {
                                tar_client.query('insert into flow_step_texts(flow_step_id,locale_id,title,content,comments) values($1::integer,$2::integer,$3::varchar,$4::text,$5::text)',[currinstep,result.rows[m].locale_id,result.rows[m].title,result.rows[m].content,result.rows[m].comments],(err,result1)=>{
                                if(err)
                                {
                                    console.log('error while inserting flow_step_texts for step id: '+currinstep+ ' and error is: '+err);
                                    src_client.end();
                                    tar_client.end();
                                    process.exit();
                                }
                                else{
                                    if((l+1)==(oldstepids.length))
                                    {   
                                        setTimeout(exitMig, 40000);
                                         
                                    }
                                   // console.log('inserted step_text for id '+currinstep);
                                }
                                });
                            }//end for loop
                         }
                        });
                    }//end for loop
                    var ele=document.getElementById('copybar');
                    ele.style.width='80%'
                }
                insert_flow_texts();
                
                }
                });
            }
            });
            }
            });
        }
        });
        }}
    });
  }


});}
