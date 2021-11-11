// Copyright [2021] [Banana.ch SA - Lugano Switzerland]
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// @id = ch.banana.nl.app.btw.evaluation.report.js
// @api = 1.0
// @pubdate = 2021-11-11
// @publisher = Banana.ch SA
// @description.en = Update BTW table NL [BETA]
// @description.nl = BTW tabel update NL [BETA]
// @doctype = *.*
// @outputformat = none
// @inputdataform = none
// @task = app.command
// @inputdatasource = none
// @timeout = -1

const { group } = require("console");

/*
*   SUMMARY
*
*   This Exstension check if the VAT table version, if the versione does not include the column Gr1, adds the column and assign the correct group
*   to the vat codes (the standard ones). version is checked by comparing a string in the description column of the table, example string:id=vatcodes-nl-2019.20190121.
*
*   The extension could be reused for other VAT tables of other countries
*   
*/

function exec(inData, options){

    var newDocsArray=[];
    //prova, data da cambiare
    var newestVersion="20211111";
    var IsOutdated=false;

    IsOutdated=checkVatTableVersion(newestVersion);

    if(IsOutdated){
        newDocsArray=this.UpdateVatTable();
    }else{
        //message
    }

    var jsonDoc = { "format": "documentChange", "error": "" };
    jsonDoc["data"] = newDocsArray;

    return docChange;

}

function UpdateVatTable(){
    var jsonDoc=[];

    //create the document to add the column
    jsonDoc.push(this.addColumnDocument());
    //create the document to add the column
    jsonDoc.pus(this.addGr1Document());

    return jsonDoc;

}

function addGr1Document(){
    var jsonDoc=initJsonDoc();

    //create rows
    createJsonDoc_addGr1Codes(jsonDoc);

    return jsonDoc;

}

function createJsonDoc_addGr1Codes(jsonDoc){

    var rows=[];
    var vatCodesData=getVatCodesData();

    //devo aggiungere il gruppo all'indice dove si trova il codice giusto.
    //il codice giusto è quello

    for(var key in vatCodesData){
        var vatData=vatCodesData[key];

        var row = {};
        row.operation = {};
        row.operation.name = "add";
        row.fields = {};

        row.fields["Gr1"] = vatData;


    }

    var dataUnitFilePorperties = {};
    dataUnitFilePorperties.nameXml = "VatCodes";
    dataUnitFilePorperties.data = {};
    dataUnitFilePorperties.data.rowLists = [];
    dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

    jsonDoc.document.dataUnits.push(dataUnitFilePorperties);
}


function initJsonDoc(){
    var jsonDoc = {};
    jsonDoc.document = {};
    jsonDoc.document.dataUnitsfileVersion = "1.0.0";
    jsonDoc.document.dataUnits = [];

    jsonDoc.creator = {};
    var d = new Date();
    var datestring = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
    var timestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    //jsonDoc.creator.executionDate = Banana.Converter.toInternalDateFormat(datestring, "yyyymmdd");
    //jsonDoc.creator.executionTime = Banana.Converter.toInternalTimeFormat(timestring, "hh:mm");
    jsonDoc.creator.name = Banana.script.getParamValue('id');
    jsonDoc.creator.version = "1.0";

    return jsonDoc;
}

function addColumnDocument(){
    var columnDoc={
        "document": {
            "dataUnits": [{
                "data": {
                    "viewList": {
                        "views": [{
                            "columns": [{
                                    "nameXml": "Gr1",
                                    "header1": "Gr1",
                                    "operation": {
                                        "name": "add"
                                    }
                                }],
                            "id": "Base",
                            "nameXml": "Base",
                            "nid": 1
                        }]
                    }
                },
                "id": "VatCodes",
                "nameXml": "VatCodes"
            }]
        }
    }

    return columnDoc;
}

function getVatTable(){

    var table = Banana.document.table("VatCodes");
    if (!table)
        return "";
    else 
        return table;
}

function getVatCodesData(){

    var vatCodes=[];
    table=getVatTable();

    for (var i = 0; i < table.rowCount; i++) {
        var vatData={};
        var tRow = table.row(i);
        vatData.vatCode=tRow.value("VatCode");
        //forse e meglio fare il +1
        vatData.rowNr=tRow.rowNr;
        //aggiungo ad ognuno il gr1
        vatData.gr1=getGr1(vatData.vatCode);

        if(vatData.vatCode){
            vatCodes.push(vatData);
            Banana.console.debug(JSON.stringify(vatData));
        }
    }


    return vatCodes;

}

function getGr1(vatCode){
    var group="";

    switch(vatCode){
        case "V21":
            group="1a"
            return group;
        case "V9":
            group="1b"
            return group;
        case "VOT":
            group="1c"
            return group;
        case "PG21":
            group="1d"
            return group;
        case "PG9":
            group="1d"
            return group;
        case "PG27":
            group="1d"
            return group;
        case "PG15":
            group="1d"
            return group;
        case "V0":
            group="1e"
            return group;
        case "VR21":
            group="2a"
            return group;
        case "VR9":
            group="2a"
            return group;
        case "VX":
            group="3a"
            return group;
        case "VEU":
            group="3b"
            return group;
        case "VEUI":
            group="3c"
            return group;
            
        //METTERE QUELLI MANCANTI
    }

}

function checkVatTableVersion(newestVersion){

    table=getVatTable();

    for (var i = 0; i < table.rowCount; i++) {
        var tRow = table.row(i);
        var description=tRow.value("Description");


        if(description.indexOf("id=vatcodes")>=0){
            //find the position of the date
            var pos=description.indexOf('.');
            //extract the date
            var versionDate=description.substr(pos);
            //check if it is equal to the newest one
            if(versionDate==newestVersion){
                return false;
            }else{
                return true;
            }
        }
    }
}