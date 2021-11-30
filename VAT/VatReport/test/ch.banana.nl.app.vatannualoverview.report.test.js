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
// @id = ch.banana.nl.app.vatperiods.report.test
// @api = 1.0
// @pubdate = 2021-11-29
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.nl.app.vatperiods.report.js>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @includejs = ../ch.banana.nl.app.vatannualoverview.report.js
// @includejs = ../ch.banana.nl.app.vat.js
// @timeout = -1


// Register test case to be executed
Test.registerTestCase(new VatPeriodsReportTest());

// Here we define the class, the name of the class is not important
function VatPeriodsReportTest() {

}

// This method will be called at the beginning of the test case
VatPeriodsReportTest.prototype.initTestCase = function() {

}

// This method will be called at the end of the test case
VatPeriodsReportTest.prototype.cleanupTestCase = function() {

}

// This method will be called before every test method is executed
VatPeriodsReportTest.prototype.init = function() {

}

// This method will be called after every test method is executed
VatPeriodsReportTest.prototype.cleanup = function() {

}

VatPeriodsReportTest.prototype.testReport = function() {

    Test.logger.addComment("Test VAT Periods Report");

    var fileAC2 = "file:script/../test/testcases/nl.vat.test.ac2";
    var banDoc = Banana.application.openDocument(fileAC2);
    if (!banDoc) {
        return;
    }

  //Test current year
  Test.logger.addSubSection("Whole year report");
  addReport(banDoc, "2022-01-01", "2022-12-31", "Whole year report");

}

//Function that create the report for the test
function addReport(banDoc, startDate, endDate, reportName) {
    var reportType="periods";
    var vatReport= new VatReport(banDoc,reportType);
    var periods=getYearPeriods(startDate);
    var periodsData=vatReport.getPeriodsData(periods);
    var docInfo=vatReport.getDocumentInfo();
    var report = createVatOverviewReport(periodsData,docInfo,startDate,endDate);
    Test.logger.addReport(reportName, report);
}