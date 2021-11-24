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
// @pubdate = 2021-11-18
// @publisher = Banana.ch SA
// @description.en = Update BTW table NL [BETA]
// @description.nl = BTW tabel update NL [BETA]
// @doctype = *.*
// @outputformat = none
// @inputdataform = none
// @task = app.command
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
    var msg="The VAT table is already updated to the latest version";
    var banDoc=Banana.document;
    var vatTable=getVatTable(banDoc);

    newDocsArray=UpdateVatTable(msg,banDoc,vatTable);

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
function UpdateVatTable(msg,banDoc,vatTable){
    var jsonDoc=[];
    var lastVersion=true;

    //Check if exists the column, or if we need to add it.
    if(!hasGr1Column(vatTable)){
        //create the document to add the column
        jsonDoc.push(addColumnDocument());
    }

    var codesList=getVatCodesWithoutGr1(vatTable);
    if(codesList.length>0){

        jsonDoc.push(addGr1Document(codesList));
        lastVersion=false;
    }

    if(lastVersion){
        banDoc.addMessage(msg);
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

        row.fields["Gr1"] = getGr1(vatData.vatCode);

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
 * Return the group for each vat code
 * @param {*} vatCode 
 * @returns 
 */
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
 * Check that the code passed should have a gr1
 */
function shouldHaveGr1(vatCode){

    switch(vatCode){
        case "V21":
        case "V9":
        case "VOT":
        case "PG21":
        case "PG9":
        case "PG27":
        case "PG15":
        case "V0":
        case "VR21":
        case "VR9":
        case "VX":
        case "VEU":
        case "VEUI":
        case "VIX21":
        case "VIX9":
        case "ICP21":
        case "ICP9":
        case "IG21":
        case "IG9":
        case "IG0":
        case "IGV":
        case "D21-2":
        case "D9-2":
            return true;
        default:
            return false
    }

}
/**
 * Check if every code has a Gr1, the codes are considerated if they are in the defined list.
 * This list contains the codes that must have a gr1 because they need it for the vat declaration form.
 * @param {*} newestVersion 
 * @returns 
 */
function getVatCodesWithoutGr1(vatTable){
    var codesList=[];
    var table=vatTable;

    for (var i = 0; i < table.rowCount; i++) {
        var vatData={};
        var tRow = table.row(i);
        vatData.vatCode=tRow.value("VatCode");
        vatData.gr1=tRow.value("Gr1");
        vatData.rowNr=tRow.rowNr.toString();
        var shouldHavit =shouldHaveGr1(vatData.vatCode);

        if(vatData.vatCode && !vatData.gr1 && shouldHavit ){
            codesList.push(vatData);
        }
    }
    return codesList;
}