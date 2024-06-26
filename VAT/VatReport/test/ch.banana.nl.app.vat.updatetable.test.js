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
// @id = ch.banana.nl.app.vat.update.table.test
// @api = 1.0
// @pubdate = 2021-11-19
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.nl.app.vat.update.table.js>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @includejs = ../ch.banana.nl.app.vat.updatetable.js
// @timeout = -1


// Register test case to be executed
Test.registerTestCase(new UpdateVatTableTest());

// Here we define the class, the name of the class is not important
function UpdateVatTableTest() {

}

// This method will be called at the beginning of the test case
UpdateVatTableTest.prototype.initTestCase = function() {

}

// This method will be called at the end of the test case
UpdateVatTableTest.prototype.cleanupTestCase = function() {

}

// This method will be called before every test method is executed
UpdateVatTableTest.prototype.init = function() {

}

// This method will be called after every test method is executed
UpdateVatTableTest.prototype.cleanup = function() {

}

UpdateVatTableTest.prototype.testReport = function() {

    Test.logger.addComment("Test vatreport_declaration");

    var fileAC2 = "file:script/../test/testcases/nl.vat.test.ac2";
    var fileAC2_noGr1 = "file:script/../test/testcases/nl.vat.test.nogr1.ac2";
    var banDoc = Banana.application.openDocument(fileAC2);
    var banDoc_noGr1 = Banana.application.openDocument(fileAC2_noGr1);
    if (!banDoc || !banDoc_noGr1) {
        return;
    }

  //Test the already updated file (the Json doc shoule be empty)
  Test.logger.addSubSection("Already Updated File");
  addReport(banDoc, "Already Updated File");

  //Test an outdated file (with gr1 column but no gr1 elements)
  Test.logger.addSubSection("Outdated file");
  addReport(banDoc_noGr1, "Outdated file");

}

function addReport(banDoc,reportName){
  var jsonDoc="";
  var newDocsArray=[];
  var vatTable=getVatTable(banDoc);
  if(vatTable){
    newDocsArray=UpdateVatTable(banDoc,vatTable);
    jsonDoc = { "format": "documentChange", "error": "" };
    jsonDoc["data"] = newDocsArray;
    Test.logger.addJson(reportName,JSON.stringify(jsonDoc));
  }else{
    this.testLogger.addFatalError("Vat table not found");
  }
}


function getVatTable(banDoc){
    var table = banDoc.table("VatCodes");
    if (!table)
        return "";
    else 
        return table;
}