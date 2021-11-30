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
// @id = ch.banana.nl.app.vatstatementform.report.test
// @api = 1.0
// @pubdate = 2021-11-26
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.nl.app.vatstatementform.report.js>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @includejs = ../ch.banana.nl.app.vatstatementform.report.js
// @includejs = ../ch.banana.nl.app.vat.js
// @timeout = -1


// Register test case to be executed
Test.registerTestCase(new VatStatementReportTest());

// Here we define the class, the name of the class is not important
function VatStatementReportTest() {

}

// This method will be called at the beginning of the test case
VatStatementReportTest.prototype.initTestCase = function() {

}

// This method will be called at the end of the test case
VatStatementReportTest.prototype.cleanupTestCase = function() {

}

// This method will be called before every test method is executed
VatStatementReportTest.prototype.init = function() {

}

// This method will be called after every test method is executed
VatStatementReportTest.prototype.cleanup = function() {

}

VatStatementReportTest.prototype.testReport = function() {

    Test.logger.addComment("Test VAT Statement");

    var fileAC2 = "file:script/../test/testcases/nl.vat.test.ac2";
    var banDoc = Banana.application.openDocument(fileAC2);
    if (!banDoc) {
        return;
    }

  //Test year
  Test.logger.addSubSection("Whole year report");
  addReport(banDoc, "2022-01-01", "2022-12-31", "Whole year report");

 //Test 1. semester
 Test.logger.addSubSection("First semester report");
 addReport(banDoc, "2022-01-01", "2022-06-30", "First semester report");

 //Test 2. semester
 Test.logger.addSubSection("Second semester report");
 addReport(banDoc, "2022-07-01", "2022-12-31", "Second semester report");

 //Test 1. quarter
 Test.logger.addSubSection("First quarter report");
 addReport(banDoc, "2022-01-01", "2022-03-31", "First quarter report");

 //Test 2. quarter
 Test.logger.addSubSection("Second quarter report");
 addReport(banDoc, "2022-04-01", "2022-06-30", "Second quarter report");

 //Test 3. quarter
 Test.logger.addSubSection("Third quarter report");
 addReport(banDoc, "2022-07-01", "2022-09-30", "Third quarter report");

 //Test 4. quarter
 Test.logger.addSubSection("Fourth quarter report");
 addReport(banDoc,"2022-10-01", "2022-12-31", "Fourth quarter report");

}

//Function that create the report for the test
function addReport(banDoc, startDate, endDate, reportName) {
    var reportType="statement";
    var vatReport= new VatReport(banDoc,reportType);
    var periods=getYearPeriods(startDate,endDate);
    var periodsData=vatReport.getPeriodsData(periods);
    var docInfo=vatReport.getDocumentInfo();
    var report = createVatStatementReport(periodsData,docInfo,startDate,endDate);
    Test.logger.addReport(reportName, report);
}