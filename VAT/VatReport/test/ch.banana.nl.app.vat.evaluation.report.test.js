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
// @id = ch.banana.nl.app.vat.evaluation.report.test
// @api = 1.0
// @pubdate = 2021-11-19
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.nl.app.vat.evaluation.report.js>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @includejs = ../ch.banana.nl.app.vat.evaluation.report.js
// @timeout = -1


// Register test case to be executed
Test.registerTestCase(new VatEvaluationReportTest());

// Here we define the class, the name of the class is not important
function VatEvaluationReportTest() {

}

// This method will be called at the beginning of the test case
VatEvaluationReportTest.prototype.initTestCase = function() {

}

// This method will be called at the end of the test case
VatEvaluationReportTest.prototype.cleanupTestCase = function() {

}

// This method will be called before every test method is executed
VatEvaluationReportTest.prototype.init = function() {

}

// This method will be called after every test method is executed
VatEvaluationReportTest.prototype.cleanup = function() {

}

VatEvaluationReportTest.prototype.testReport = function() {

    Test.logger.addComment("Test vatreport_declaration");

    var fileAC2 = "file:script/../test/testcases/Bozza_per_IVA_NL_Full_test.ac2";
    var banDoc = Banana.application.openDocument(fileAC2);
    if (!banDoc) {
        return;
    }

  //Test current year
  Test.logger.addSubSection("Whole year report");
  addReport(banDoc, "2022-01-01", "2022-12-31", "Whole year report");

  //Test over two years..?

}

//Function that create the report for the test
function addReport(banDoc, startDate, endDate, reportName) {
    var btwEvaluationReport= new BTWEvaluationReport(banDoc,startDate, endDate);
    var vatReport = btwEvaluationReport.createBtwEvaluationReport();
    Test.logger.addReport(reportName, vatReport);
}
function getCurrentYear(){
    var currYear=new Date()
    currYear=currYear.getFullYear();
    return currYear;
}