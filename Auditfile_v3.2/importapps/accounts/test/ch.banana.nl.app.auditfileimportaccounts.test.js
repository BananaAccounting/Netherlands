// Copyright [2018] [Banana.ch SA - Lugano Switzerland]
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


// @id = ch.banana.nl.app.auditfileimportaccounts.test
// @api = 1.0
// @pubdate = 2019-01-23
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.nl.app.auditfileimportaccounts.js>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @includejs = ../ch.banana.nl.app.auditfileimportaccounts.js
// @timeout = -1


// Register test case to be executed
Test.registerTestCase(new ImportAccountsTest());

// Here we define the class, the name of the class is not important
function ImportAccountsTest() {

}

// This method will be called at the beginning of the test case
ImportAccountsTest.prototype.initTestCase = function() {

}

// This method will be called at the end of the test case
ImportAccountsTest.prototype.cleanupTestCase = function() {

}

// This method will be called before every test method is executed
ImportAccountsTest.prototype.init = function() {

}

// This method will be called after every test method is executed
ImportAccountsTest.prototype.cleanup = function() {

}

ImportAccountsTest.prototype.testBananaApps = function() {

    var filePath = "";

    filePath = "file:script/../test/testcases/auditfile_v3.2_nl_20180101_20181231.xml";
    this.displayData(filePath);

    filePath = "file:script/../test/testcases/ExactOnline_V32_2016.xml";
    this.displayData(filePath);

    filePath = "file:script/../test/testcases/Multivers_V32_2017.xml";
    this.displayData(filePath);

}

ImportAccountsTest.prototype.displayData = function(filePath) {

    var file = Banana.IO.getLocalFile(filePath);
    var parsedfile = JSON.stringify(file.read(), "", "");
    var xmlfile = JSON.parse(parsedfile);

    var form = [];
    loadForm(xmlfile,form);

    Test.logger.addText("--- FORM ---");
    Test.logger.addText(JSON.stringify(form, null, 2));

    Test.logger.addText("IMPORT FILE");
    var importAccountsFile = createImportAccountsFile(form);
    Test.logger.addText(importAccountsFile);

}



