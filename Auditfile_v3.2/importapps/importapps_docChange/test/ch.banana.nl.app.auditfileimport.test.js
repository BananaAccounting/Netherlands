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
// @id = ch.banana.nl.app.auditfileimport.test
// @api = 1.0
// @pubdate = 2021-10-25
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.nl.app.auditfileimport.js>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @includejs = ../ch.banana.nl.app.auditfileimport.js
// @timeout = -1


// Register test case to be executed
Test.registerTestCase(new ImportFileSafFileTest());

// Here we define the class, the name of the class is not important
function ImportFileSafFileTest() {

}

// This method will be called at the beginning of the test case
ImportFileSafFileTest.prototype.initTestCase = function () {

}

// This method will be called at the end of the test case
ImportFileSafFileTest.prototype.cleanupTestCase = function () {

}

// This method will be called before every test method is executed
ImportFileSafFileTest.prototype.init = function () {

}

// This method will be called after every test method is executed
ImportFileSafFileTest.prototype.cleanup = function () {

}

ImportFileSafFileTest.prototype.testDoChange = function () {

    var fileXml = Banana.IO.getLocalFile("file:script/../test/testcases/auditfile_v3.2_nl_20180101_20181231.xml");
    let fileContent = fileXml.read();
    if (fileContent.errorString) {
        Banana.Ui.showInformation("Read error", fileContent.errorString);
    }
    // var parsedfile = JSON.stringify(fileXml.read(), "", "");
    // var xmlfile = JSON.parse(parsedfile);


    if (fileContent) {
        Test.logger.addText("----IMPORT FILE WITH DOCUMENT CHANGE STRUCTURE----");
        var fileAC2 = "file:script/../test/testcases/Dubbel boekhouden met BTW - 1.ac2";
        var banDoc = Banana.application.openDocument(fileAC2);
        if (banDoc) {
            var nlAuditFilesImport = new NlAuditFilesImport(banDoc);
            var sourceFiles = [];
            sourceFiles.push(fileContent);
            nlAuditFilesImport.createJsonDocument(sourceFiles);
            var jsonDoc = { "format": "documentChange", "error": "" };
            jsonDoc["data"] = nlAuditFilesImport.jsonDocArray;

            Test.logger.addJson("name", JSON.stringify(jsonDoc));
        } else {
            Test.logger.addFatalError("File not found: " + fileAC2);
        }
    } else {
        Test.logger.addFatalError("File not found: " + fileXml);
    }
}