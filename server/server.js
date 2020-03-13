'use strict'
const utils = require('./lib/utils');
const leads = require('./lib/leads');


const airTablebaseUrl = 'https://api.airtable.com/v0/appJphW1qeLu7Fqo0';
const airTablefullUrl = airTablebaseUrl + '/EventLeads'
const airTableListRecordsUrl = airTablefullUrl + '?maxRecords=50&view=Grid%20view'
const airTableFilterByFormula = '&filterByFormula=%28%7BEmailAddress%7D%20%3D%20%27'
const airTable24HrsFilterByFormula = '&filterByFormula%3DCREATED_TIME%3E'

console.log(airTableListRecordsUrl);

const aHeadersPostPutDelete = {
  'Authorization': 'Bearer <%= iparam.airtable_api_key %>',
  'Content-Type': 'application/json'
};
const aHeadersGetDelete = {
  'Authorization': 'Bearer <%= iparam.airtable_api_key %>'
};

function aBuildFilterFormula(email){
  return airTableFilterByFormula+email+'%27%29'
}

function aBuild24HrsFilterByFormula(time){
  return airTable24HrsFilterByFormula+time
}

function aBuildOptions(url, method, headers, body) {
  return Object.assign({
    url: url,
    method: method,
    headers: headers
  }, body ? { body } : null);
}

function aEmailGetRequestOptions(email) {
  console.log(airTableListRecordsUrl+airTableFilterByFormula);
  const airTableEmailFormula = aBuildFilterFormula(email);
  return aBuildOptions(airTableListRecordsUrl + airTableEmailFormula, 'GET', aHeadersGetDelete, null);
}

function a24HRSGetRequestOptions(time) {
  console.log(airTableListRecordsUrl+airTable24HrsFilterByFormula);
  const airTable24hrsFormula = aBuild24HrsFilterByFormula(time);
  return aBuildOptions(airTableListRecordsUrl + airTable24hrsFormula, 'GET', aHeadersGetDelete, null);
}
function aPutRequestOptions(changes) {
  return aBuildOptions(airTablefullUrl, 'PUT', aHeadersPostPutDelete, changes);
}
function aDeleteRequestOptions(id) {
  return aBuildOptions(airTablefullUrl+'/'+id, 'DELETE', aHeadersGetDelete);
}
function aPostRequestOptions(body) {
  return aBuildOptions(airTablefullUrl, 'POST', aHeadersPostPutDelete, body);
}

const fBaseUrl = 'https://<%= iparam.freshsales_subdomain %>.freshsales.io';
const fSearchContactUrl = fBaseUrl + '/api/search?include=contact&per_page=2&q=';
const fLeadUrl = fBaseUrl + '/api/leads';
const fFilterUrl = fBaseUrl + '/api/leads/filters';
const fLeadListUrl = fBaseUrl + '/api/leads/view/';


const fHeaders = {
  'Authorization': 'Token token=<%= iparam.freshsales_api_key %>',
  'Content-Type': 'application/json'
};

function fBuildOptions(url, method, headers, body) {
  return Object.assign({
    url: url,
    method: method,
    headers: fHeaders
  }, body ? { body } : null);
}

function fGetFilterRequestOptions(){
  return fBuildOptions(fFilterUrl, 'GET', fHeaders, null);
}

function fGetListLeadsRequestOptions(viewID){
  return fBuildOptions(fLeadListUrl+viewID, 'GET', fHeaders, null);
}

function fGetRequestOptions(email) {
  return fBuildOptions(searchContactUrl + email, 'GET', fHeaders, null);
}
function fPutRequestOptions(id, changes) {
  console.log('URL of put request is:'+fLeadUrl+'/'+id);
  return fBuildOptions(fLeadUrl + '/' + id, 'PUT', fHeaders, changes);
}
function fDeleteRequestOptions(id) {
  return fBuildOptions(fLeadUrl + '/' + id, 'DELETE', fHeaders);
}
function fPostRequestOptions(body) {
  return fBuildOptions(fLeadUrl, 'POST', fHeaders, body);
}



function createFleadPostData(aTableLead){ 

   return {
    "lead": {
      "first_name" : aTableLead['FirstName'],
      "last_name" : aTableLead['LastName'],
      "email" : aTableLead['EmailAddress'],
      "company": {
        "name": aTableLead['CompanyName']
      },
      "work_number": aTableLead['ContactNumber']
    }
  }

}

function createAtableLeadPostData(freshSalesLead){

  return {
      "records": [
        {
          "fields": {
            "FirstName": freshSalesLead.first_name,
            "LastName": freshSalesLead.last_name,
            "CompanyName": freshSalesLead.company.name,
            "EmailAddress": freshSalesLead.email,
            "ContactNumber": freshSalesLead.mobile_number
          }
        }
      ]
    };
}

function updateAtableLeadPostData(freshSalesLead,id){

  return {
      "records": [
        {
          "id": id,
          "fields": {
            "FirstName": freshSalesLead.first_name,
            "LastName": freshSalesLead.last_name,
            "CompanyName": freshSalesLead.company.name,
            "EmailAddress": freshSalesLead.email,
            "ContactNumber": freshSalesLead.mobile_number
          }
        }
      ]
    };
}

async function retrieveaTableIdifPresent(email){

  try{

    const airtableData = await utils.makeGetRequest(aEmailGetRequestOptions(email));
    const airtableResponse = airtableData.response;

    if (typeof airtableData.response === 'string') {
      airTableJson = JSON.parse(airtableResponse);
      console.log(airTableJson);
    }

    if (!airtableResponse.length) {
      throw new Error('lead not found');
    }

   if(airTableJson.records[0]==null)
   {
     return undefined;
   }

    const airTableRecordId = airTableJson.records[0].id;
    console.log(airTableRecordId);

    return airTableRecordId;

  }catch (error){
    console.log('Error while UPDATING a lead in Airtable');
    console.log(error);
  }

}

async function createaTableRecord(payload){

  try{
    
    const freshSalesLead = createAtableLeadPostData(payload.data.lead); 
    const data = await utils.makePostRequest(aPostRequestOptions(freshSalesLead));
    console.log('Successfully created a record in Airtable'+ data);

  } catch (error){
    console.log('Error while creating a lead in Airtable');
    console.log(error);
  }
}

async function retrieveViewIDFor24HRS(){

  try {
    const fFilterData = await utils.makeGetRequest(fGetFilterRequestOptions());
    const fFilterResponse = fFilterData.response;


    if (typeof fFilterData.response === 'string') {
      fFilterJson = JSON.parse(fFilterResponse);
      console.log(fFilterJson);
    }

    if (!fFilterResponse.length) {
      throw new Error('filters not found');
    }


    const filterArray = fFilterJson['filters'];
    console.log('printing array' + filterArray);

    var viewId;

    filterArray.forEach(function (value) {
      console.log(value['name']);
      if (value['name'] == 'New Leads') {
        viewId = value['id'];
      }
    });
     
    console.log('viewID for the new leads generated in last 24 hours is:' + viewId);
    return viewId;
  } catch (error) {
    console.log(error);
    return;
  }

}

async function retrievefLeadsFor24Hrs(viewId,shouldPersist){

try{
  
  const fLeadsData = await utils.makeGetRequest(fGetListLeadsRequestOptions(viewId));
  const fLeadsResponse = fLeadsData.response;

  if (typeof fLeadsData.response === 'string') {
    fLeadsData.response = JSON.parse(fLeadsResponse);
    console.log(fLeadsData.response);
  }

  if (!fLeadsResponse.length) {
    throw new Error('no leads found not found');
  }
   
  const leadArray = fLeadsData.response['leads'];

  if(shouldPersist == true)
  {

  for(var i = 0; i < leadArray.length; i++) {
    var obj = leadArray[i];
    console.log('there you go:'+obj.email);
    console.log('there you go:'+JSON.stringify(obj));

    var email = obj.email;
    var emailSansSplC = email.replace(/[^\w\s]/gi, '');
    console.log('the email without special characters is:'+emailSansSplC);

    
    await leads.setLead(emailSansSplC,JSON.stringify(obj));
    const leadinDB =  await leads.getLead(emailSansSplC);
    console.log('look here - leadinDB is:'+leadinDB);
    console.log('look here - key is:'+emailSansSplC);


  }
  return leadArray;
} 
} catch (error) {

  console.log('error');
  return;
}

}
async function retrieveALeadsFor1Hr(){
    
  try{
  
    const dateNow = new Date();
    var ydayDay = new Date(dateNow.getTime() - (1 * 60 * 60 * 1000));
    const fullDate = (ydayDay.toISOString());
    console.log(fullDate);

      const airtableData = await utils.makeGetRequest(a24HRSGetRequestOptions(fullDate));
  
      if (typeof airtableData.response === 'string') {
        airtableData.response = JSON.parse(airtableData.response);
        console.log(airtableData.response);
      }
  
      const airTableLeadsArray = airtableData.response.records;
      console.log('The Arrary is'+JSON.stringify(airTableLeadsArray));
  
      return airTableLeadsArray;
  
    }catch (error){
      console.log('Error while UPDATING a lead in Airtable');
      console.log(error);
    }
  
  }


async function createaTableRecord(payload){

  try{
    
    const freshSalesLead = createAtableLeadPostData(payload.data.lead); 
    const data = await utils.makePostRequest(aPostRequestOptions(freshSalesLead));
    console.log('Successfully created a record in Airtable'+ data);

  } catch (error){
    console.log('Error while creating a lead in Airtable');
    console.log(error);
  }

}

function isUpdateRequired(freshsalesLead,airtableLead)
{

 if( freshsalesLead['first_name'] != airtableLead.fields['FirstName'] || 
  freshsalesLead['last_name'] != airtableLead.fields['LastName'] ||
  freshsalesLead['email'] != airtableLead.fields['EmailAddress'] ||
  freshsalesLead['company']['name'] != airtableLead.fields['CompanyName'] ||
  freshsalesLead['work_number'] != airtableLead.fields['ContactNumber']){

    return true;
  }

  return false;
}

async function initiateLeadSyncProcess(payload){

  try{
  
    console.log(payload);
    const viewId =  await retrieveViewIDFor24HRS();
    console.log('view ID returned is:',viewId);
  
    let shouldPersist = true;
    const freshworksLeads = await retrievefLeadsFor24Hrs(viewId,shouldPersist);
    const airTableLeads = await retrieveALeadsFor1Hr();

    console.log('retrieved freshworks leads:',JSON.stringify(freshworksLeads));
    findAirTableFreshworksDelta(freshworksLeads,airTableLeads);



} catch(error)
{
console.log(error);
}
  
}

async function  findAirTableFreshworksDelta(freshworksLeads,airTableLeads){

  try{
  var createLeads = [];
  var updateLeads = [];
  var deleteLeads = [];

  for(var i = 0; i < airTableLeads.length; i++) {


   aTableValue = airTableLeads[i].fields['EmailAddress'];
   if(aTableValue != null){
   const emailSansSplC = aTableValue.replace(/[^\w\s]/gi, '');
   console.log(emailSansSplC);

   var fLeadinDB =  await leads.getLead(emailSansSplC);

   console.log('The lead is'+fLeadinDB);

   if (typeof fLeadinDB === 'string') {
    fLeadinDB = JSON.parse(fLeadinDB);
    console.log(fLeadinDB);
   }
   

   if(fLeadinDB == null)
   {
     createLeads.push(airTableLeads[i]);
     console.log('Going to create a lead with key:',emailSansSplC);
   }
   else if(isUpdateRequired(fLeadinDB,airTableLeads[i]))
   {

      updateLeads.push(airTableLeads[i]);      
      console.log('Going to update a lead with key:',emailSansSplC);

   }
   else{
     continue;
   }

   }
  }

  for(var i = 0; i < freshworksLeads.length; i++) {
  
    aRecordEmail = freshworksLeads[i].email;
    var found = false;
    for(var j=0; j < airTableLeads.length; j++) {

      aTableEmail = airTableLeads[j].fields['EmailAddress'];
      console.log('Airtable email is:'+aTableEmail);


      if(aRecordEmail == aTableEmail)
      {
          found = true;
          console.log('found match in freshsales');
      }
    }

    if(found == false)
      {
        console.log('didnt find match in freshsales');
        const freshSaleEmailSanSplc = aRecordEmail.replace(/[^\w\s]/gi, '');
        deleteLeads.push(freshworksLeads[i]);
        console.log('Going to delete a lead with key:',freshSaleEmailSanSplc);
      }

  }
 

  console.log('Created Leads are:'+createLeads);
  console.log('Updated Leads are:'+updateLeads);
  console.log('Deleted Leads are:'+deleteLeads);

  await syncLeads(createLeads,updateLeads,deleteLeads);

 }
 catch (error){

     console.log(error);
    
 }

}

async function syncLeads(createLeads,updateLeads,deleteLeads){

  try{
     
  // Delta sync for newly created leads in airtable.   
  for(var i=0;i<createLeads.length; i++)
  {
    const aTableLead = createLeads[i];
    console.log(createFleadPostData(aTableLead.fields));
    await utils.makePostRequest(fPostRequestOptions(createFleadPostData(aTableLead.fields)));
    console.log('Successfully created leads while syncing with Airtable');

  }

    // Delta sync for newly updated leads in airtable.   
    for(var i=0;i<updateLeads.length; i++)
    {
      const aTableUpdateLead = updateLeads[i];
      console.log(aTableUpdateLead);

      var email = aTableUpdateLead.fields['EmailAddress'];
      var emailSansSplC = email.replace(/[^\w\s]/gi, '');
      var leadinDB =  await leads.getLead(emailSansSplC);
      
      if (typeof leadinDB === 'string') {
        leadinDB = JSON.parse(leadinDB);
        console.log(leadinDB);
       }

      console.log(leadinDB.id);
      console.log(createFleadPostData(aTableUpdateLead.fields));
      const putData = createFleadPostData(aTableUpdateLead.fields);
      console.log(putData);
      await utils.makePutRequest(fPutRequestOptions(leadinDB.id,putData));
       console.log('Successfully updated leads while syncing with Airtable');
    }

    for(var i=0;i<deleteLeads.length; i++)
    {
      const fLead = deleteLeads[i];
      await utils.makeDeleteRequest(fDeleteRequestOptions(fLead.id));
      console.log('Successfully deleted leads while syncing with Airtable');
      fLeadValue = fLead.email;
      const emailSansSplC = fLeadValue.replace(/[^\w\s]/gi, '');
      await leads.deleteLead(emailSansSplC);
    }


  if(createLeads.length != 0 || updateLeads.length !=0 || deleteLeads.length != 0)
  {
    const source = 'AIRTABLE';
    const dateNow = new Date();
    const createdLeadsNo = createLeads.length.toString();
    const updatedLeadsNo = updateLeads.length.toString();
    const deletedLeadNo = deleteLeads.length.toString();

    await addReportRecordtoDB(source,dateNow.toISOString(),createdLeadsNo,updatedLeadsNo,deletedLeadNo);

  }

  }catch (error)
  {
    console.error(error);  
   
  }

}

async function addReportRecordtoDB(source,date,createdLeadsNo,updatedLeadsNo,deletedLeadNo){

  const value = {
    "reports": [
      {
        "source": source,
        "date": date,
        "createdRecords": createdLeadsNo,
        "updatedRecords": updatedLeadsNo,
        "deletedRecords": deletedLeadNo
        
      }
    ]
  };

  const key = 'reportRecord';

  //await $db.update(key, 'append',  {"report": [reportData]});
  await $db.update(key, 'append',  value);
  const reportJSON = await $db.get(key);

  console.log(reportJSON);
  //await $db.delete(key);

}


exports = {
  events: [
    { event: 'onLeadCreate', callback: 'onLeadCreateHandler' },
    { event: 'onLeadUpdate', callback: 'onLeadUpdateHandler' },
    { event: 'onLeadDelete', callback: 'onLeadDeleteHandler' },
    { event: 'onAppInstall', callback: 'onAppInstallHandler'},
    { event: 'onAppUninstall', callback: 'onAppUnInstallHandler'},
    { event: "onScheduledEvent", callback: 'onScheduledEventHandler'}
  ],

  onLeadUpdateHandler: async function (payload) {
    
    try{

      const aTableLeadEmail = payload.data.lead.email;
      const airTableRecordID = await retrieveaTableIdifPresent(aTableLeadEmail);
      console.log('AirTable Record ID:'+airTableRecordID);

      if(airTableRecordID == null)
      {
        console.log('The user with this email is not available hence creating a new one');
         await createaTableRecord(payload);
         return;
      }

      const upDatedfreshSalesLead = updateAtableLeadPostData(payload.data.lead,airTableRecordID); 
      console.log(upDatedfreshSalesLead);

      const data = await utils.makePutRequest(aPutRequestOptions(upDatedfreshSalesLead));
      console.log('Successfully updated a record in Airtable'+ data);

      const source = 'FRESHSALES';
      const dateNow = new Date();
      const createdLeadsNo = 0;
      const updatedLeadsNo = 1;
      const deletedLeadNo = 0;
  
      await addReportRecordtoDB(source,dateNow.toISOString(),createdLeadsNo,updatedLeadsNo,deletedLeadNo);
  

    }catch (error){
      console.log('Error while UPDATING a lead in Airtable');
      console.log(error);
    }
  
  },

  onLeadCreateHandler: async function (payload) {
    
    try{
      const aTableLeadEmail = payload.data.lead.email;
      const airTableRecordID = await retrieveaTableIdifPresent(aTableLeadEmail);
      console.log('AirTable Record ID: '+airTableRecordID);

      if(airTableRecordID == null)
      {
        createaTableRecord(payload);
        const source = 'FRESHSALES';
        const dateNow = new Date();
        const createdLeadsNo = 1;
        const updatedLeadsNo = 0;
        const deletedLeadNo = 0;
  
      await addReportRecordtoDB(source,dateNow.toISOString(),createdLeadsNo,updatedLeadsNo,deletedLeadNo);
        return;
      }
      else {
        console.log('The user with this email is already existing in airtable hence updating the existing one');
        const upDatedfreshSalesLead = updateAtableLeadPostData(payload.data.lead,airTableRecordID); 
        console.log(upDatedfreshSalesLead);
  
  
        const data = await utils.makePutRequest(aPutRequestOptions(upDatedfreshSalesLead));
        console.log('Successfully updated a record in Airtable'+ data);     
        return;  
      }

    }catch (error){
      console.log('Error while UPDATING a lead in Airtable');
      console.log(error);
    }

  },


  onLeadDeleteHandler: async function (payload) {
  
    try{

    
      const aTableLeadEmail = payload.data.lead.email;
      const airTableRecordID = await retrieveaTableIdifPresent(aTableLeadEmail);
      console.log('AirTable Record ID: '+airTableRecordID);

      if(airTableRecordID == null)
      {
        console.log('Record not available in Air table');
         return;
      }

      const data = await utils.makeDeleteRequest(aDeleteRequestOptions(airTableRecordID));
      const emailSansSplC = aTableLeadEmail.replace(/[^\w\s]/gi, '');
      await leads.deleteLead(emailSansSplC);
      console.log('Successfully deleted a record in Airtable'+ data);
      const source = 'FRESHSALES';
      const dateNow = new Date();
      const createdLeadsNo = 0;
      const updatedLeadsNo = 0;
      const deletedLeadNo = 1;
  
      await addReportRecordtoDB(source,dateNow.toISOString(),createdLeadsNo,updatedLeadsNo,deletedLeadNo);
    }catch (error){
      console.log('Error while DELETING a lead in Airtable');
      console.log(error);
    }
  
  },

  onAppUnInstallHandler: function(payload)
  {
  
    console.log(payload);
    $db.delete('reportRecord')
    .then(
      function(data) {
        console.log('Success', data);
      }, 
      function() {
        console.log('error');
      }
    );

    $schedule.delete({
      name: "leadSyncSchedule100"
    })
    .then(function(data) {
        console.log('successfully deleted the existing schedule'+data)
        renderData();
    }, function(err) {
         console.log('failed to retrieve the existing schedule'+err)
         renderData();

   });

  },

  onAppInstallHandler: function(payload) {

    console.log(payload);
    
    //generate a web hook and add it to pipedream.
    
    // generateTargetUrl()
    // .then(function(url) {
    //   //Include API call to the third party to register your webhook
    //   console.log(url);
    //     connecttoPipedream(url);
    // })
    // .fail(function(err) {
    //   // Handle error
    // })

    // Create a recurring schedule
    const dateNow = new Date();
    const fullDate = (dateNow.toISOString());

    const datePieces = fullDate.split('T');
    const dateOnly   =  datePieces.shift();
    console.log(dateOnly);

  //  // retrieve the old one
  //   const lSchedule = $schedule.fetch({
  //      name: "leadSyncSchedule100"
  //    })
  //    .then(function(data) {
  //        console.log('successfully retrieved the existing schedule'+data)
  //    }, function(err) {
  //         console.log('failed to retrieve the existing schedule'+err)
  //   });
    
  //   //delete it if retrieved
  //    if(lSchedule)
  //    {  
  //      $schedule.delete({
  //        name: "leadSyncSchedule100"
  //      })
  //        .then(function (data) {
  //          console.log('successfully deleted the existing schedule'+data)
  //        }, function (err) {
  //          //"err" is a json with status and message.
  //          console.log('failed to delete'+err)
  //        });

  //   }
     
     //create a brand new scheduler.
     $schedule.create({
      name: "leadSyncSchedule100",
      data: {task_id: 10001},
      schedule_at: dateOnly,
      repeat: {
        time_unit: "minutes",
        frequency: 1
      }
    })
    .then(function(data) {
        //"data" is a json with status and message.
        console.log('successfully created'+JSON.stringify(data))
        renderData();
    }, function(err) {
        //"err" is a json with status and message.
        console.log('failure'+JSON.stringify(err))
        renderData();
    });


  },

  
onScheduledEventHandler: async function (payload) {
    
  console.log("Inside onscheduled event handler");

  await initiateLeadSyncProcess(payload);

}

};