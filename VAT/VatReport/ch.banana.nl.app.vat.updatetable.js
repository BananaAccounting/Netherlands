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
// @id = ch.banana.nl.vat.js
// @api = 1.0
// @pubdate = 2021-11-29
// @publisher = Banana.ch SA
// @description.en = Update VAT table
// @description.nl = BTW tabel bijwerken
// @outputformat = none
// @inputdataform = none
// @task = app.command
// @doctype = 100.110;110.110;130.110;100.130
// @inputdatasource = none
// @timeout = -1

/*
*   SUMMARY
*
*   This Exstension check if the VAT table version, if the column Gr1 is not present, adds the column and assign the correct group
*   to the vat codes (the standard ones).
*
*   The extension could be reused for other VAT tables of other countries
*   
*/

function exec(inData, options){

    var jsonDoc="";
    var newDocsArray=[];
    var banDoc=Banana.document;
    var vatTable=getVatTable(banDoc);

    newDocsArray=UpdateVatTable(banDoc,vatTable);

    jsonDoc = { "format": "documentChange", "error": "" };
    jsonDoc["data"] = newDocsArray;


    return jsonDoc;

}

/**
 * Creates the JSON documents for update the table.
 * if no changes are made means that the table is already the latest version and the user 
 * is informed
 * @returns 
 */
function UpdateVatTable(banDoc,vatTable){
    var jsonDoc=[];
    var lastVersion=true;
    var msg="The VAT table is already updated to the latest version";
    var VATTABLE_ALREADY_UPTODATE="VATTABLE_ALREADY_UPTODATE"

    //Check if exists the column, or if we need to add it.
    if(!hasGr1Column(vatTable)){
        //create the document to add the column
        jsonDoc.push(addColumnDocument());
    }

    var codesList=setCodesUpdateList(vatTable);
    if(codesList.length>0){

        jsonDoc.push(addGr1Document(codesList));
        lastVersion=false;
    }

    if(lastVersion){
        banDoc.addMessage(msg,VATTABLE_ALREADY_UPTODATE);
    }


    return jsonDoc;

}

/**
 * Check if Gr1 Column exists
 * @returns 
 */
function hasGr1Column(vatTable){
    var hasGr1Column=false;
    var table = vatTable;
    var tColumnNames = table.columnNames;

    for (var i=0;i<tColumnNames.length;i++){
        if(tColumnNames[i]=="Gr1")
            hasGr1Column=true;
    }

    return hasGr1Column;
}

/**
 * Creates the document that add the gr1 to the existing rows(vat codes)
 * @param {*} codeList the list of the vat code with missing Gr1
 * @returns 
 */
function addGr1Document(codeList){

    var jsonDoc=initJsonDoc();

    //create rows
    createJsonDoc_addGr1Codes(jsonDoc,codeList);

    return jsonDoc;

}

/**
 * Create Change rows
 * @param {*} jsonDoc the change document
 * @param {*} codeList the list of vat codes without gr1
 */
function createJsonDoc_addGr1Codes(jsonDoc,codeList){

    var rows=[];

    for(var key in codeList){
        var vatData=codeList[key];

        var row = {};
        row.operation = {};
        row.operation.name = "modify";
        row.operation.sequence = vatData.rowNr;
        row.fields = {};

        row.fields["Gr1"] = vatData.gr1;

        rows.push(row);


    }

    var dataUnitFilePorperties = {};
    dataUnitFilePorperties.nameXml = "VatCodes";
    dataUnitFilePorperties.data = {};
    dataUnitFilePorperties.data.rowLists = [];
    dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

    jsonDoc.document.dataUnits.push(dataUnitFilePorperties);
}

/**
 * Initialise the Json document
 * @returns 
 */
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

/**
 * Return the Json structure for add the Gr1 Column
 * @returns 
 */
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

/**
 * Returns the vat table
 * @returns 
 */
function getVatTable(banDoc){

    var table = banDoc.table("VatCodes");
    if (!table)
        return "";
    else 
        return table;
}

/**
 * Set the group for each vat code
 * @param {*} vatCode 
 * @returns 
 */
function setGr1(vatCode){
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
        case "PG9":
        case "PG27":
        case "PG15":
            group="1d"
            return group;
        case "V0":
            group="1e"
            return group;
        case "VR21":
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
        case "VIX21":
        case "VIX9":
            group="4a"
            return group;
        case "ICP21":
            group="4b"
            return group;
        case "ICP9":
            group="4b"
            return group;    
        case "IG21":
        case "IG9":
        case "IG0":
        case "IGV":
        case "D21-2":
        case "D9-2":
            group="5b"
            return group;
        default:
            return "";
    }

}

/**
 * Creates the list of codes to which the gr1 column needs to be updated
 */
 function setCodesUpdateList(vatTable){
    var codesList=[];//list of codes to be updated with a gr1
    var currentCodesData=loadVatCodes(vatTable);
    for (var c in currentCodesData){
        var element=currentCodesData[c];
        //if the element doesn't have any gr1
        if(!element.gr1){
            element.gr1=setGr1(element.vatCode);//set the group only to the standard code
            if(element.gr1)
                codesList.push(element);
        }
    }
    return codesList;
}
/**
 * load all the VAT codes in the vat table
 */
function loadVatCodes(vatTable){
    var vatCodesData=[];
    var table=vatTable;
    for (var i = 0; i < table.rowCount; i++) {
        var vatData={};
        var tRow = table.row(i);
        vatData.vatCode=tRow.value("VatCode");
        vatData.gr1=tRow.value("Gr1");
        vatData.rowNr=tRow.rowNr.toString();
        if(vatData.vatCode)
            vatCodesData.push(vatData);
    }

    return vatCodesData;

}