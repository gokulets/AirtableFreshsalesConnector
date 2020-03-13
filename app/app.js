'use strict';
var client;

$(document).ready( function() {
    
    app.initialized()
        .then(function(_client) {
            window.client = _client
            client.events.on("app.activated",
                function() {
                    //Your code here
                    addEventListeners();
                });
        },function(err)
        {
            console.log(err)
        });
});

function openModal() {
    client.interface.trigger('showModal', {title: 'Add Integration Action', template: 'modal.html'});
}

function closePopup() {
    client.instance.close();
}

function addEventListeners(){

    
    client.db.get("reportRecord").then (
        function(data) {
          displayLeadDetails(data);
        },
        function(error) {
            displayLeadDetails(data);
            console.log(error);
        });

}

/**
* Displays lead data obtained by hitting the Freshsales API endpoint
* @param {Object} data - Lead data object
*/
function displayLeadDetails(data) {
   // var lead = (JSON.parse(data)).lead;

   document.getElementById('lead-data').innerHTML = "";

   addRow('lead-data', 'Date', 'Source', 'Created Records', 'Updated Records', 'Deleted Records');


   for(var i=0; i<data.reports.length; i++){

    addRow('lead-data', JSON.stringify(data.reports[i].date), JSON.stringify(data.reports[i].source), JSON.stringify(data.reports[i].createdRecords.toString()), JSON.stringify(data.reports[i].updatedRecords.toString()), JSON.stringify(data.reports[i].deletedRecords.toString()));

    }


  //  addRow('lead-data', 'Last name', 'Sengottuvelu');
  //  addRow('lead-data', 'Email', 'gokul.ets@gmail.com');
  //  addRow('lead-data', 'City', 'Bengaluru');
  //  addRow('lead-data', 'Lead Quality', 'Cold');
  //  addRow('lead-data', 'Lead Score', '70');
}

/**
* Adds a row to a table with a lead detail
* @param {Number} tableId - Table identifier in the HTML page
* @param {String} key - Lead detail (label)
* @param {value} value - Value of the lead detail
*/
function addRow(tableID, cell1, cell2,cell3,cell4,cell5) {
    var tableRef = document.getElementById(tableID);
    var newRow = tableRef.insertRow(-1);

    var cellOne = newRow.insertCell(0);
    var cellOneText = document.createTextNode(cell1);
    cellOne.appendChild(cellOneText);

    var cellTwo = newRow.insertCell(1);
    var cellTwoText = document.createTextNode(cell2);
    cellTwo.appendChild(cellTwoText);

    var cellThree = newRow.insertCell(2);
    var cellThreeText = document.createTextNode(cell3);
    cellThree.appendChild(cellThreeText);

    var cellFour = newRow.insertCell(3);
    var cellFourText = document.createTextNode(cell4);
    cellFour.appendChild(cellFourText);

    var cellFive = newRow.insertCell(4);
    var cellFiveText = document.createTextNode(cell5);
    cellFive.appendChild(cellFiveText);
}
