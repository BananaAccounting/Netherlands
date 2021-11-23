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
// @id = ch.banana.nl.app.vat.declaration.report.test
// @api = 1.0
// @pubdate = 2021-11-19
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.nl.app.vat.declaration.report.js>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @includejs = ../ch.banana.nl.app.vat.declaration.report.js
// @timeout = -1


// Register test case to be executed
Test.registerTestCase(new VatDeclarationReportTest());

// Here we define the class, the name of the class is not important
function VatDeclarationReportTest() {

}

// This method will be called at the beginning of the test case
VatDeclarationReportTest.prototype.initTestCase = function() {

}

// This method will be called at the end of the test case
VatDeclarationReportTest.prototype.cleanupTestCase = function() {

}

// This method will be called before every test method is executed
VatDeclarationReportTest.prototype.init = function() {

}

// This method will be called after every test method is executed
VatDeclarationReportTest.prototype.cleanup = function() {

}

VatDeclarationReportTest.prototype.testReport = function() {

    Test.logger.addComment("Test vatreport_declaration");
    var currYear=getCurrentYear();

    var fileAC2 = "file:script/../test/testcases/Bozza_per_IVA_NL.ac2";
    var banDoc = Banana.application.openDocument(fileAC2);
    if (!banDoc) {
        return;
    }

  //Test year
  Test.logger.addSubSection("Whole year report");
  addReport(banDoc, currYear+"-01-01", currYear+"-12-31", "Whole year report");

 //Test 1. semester
 Test.logger.addSubSection("First semester report");
 addReport(banDoc, currYear+"-01-01", currYear+"-06-30", "First semester report");

 //Test 2. semester
 Test.logger.addSubSection("Second semester report");
 addReport(banDoc, currYear+"-07-01", currYear+"-12-31", "Second semester report");

 //Test 1. quarter
 Test.logger.addSubSection("First quarter report");
 addReport(banDoc, currYear+"-01-01", currYear+"-03-31", "First quarter report");

 //Test 2. quarter
 Test.logger.addSubSection("Second quarter report");
 addReport(banDoc, currYear+"-04-01", currYear+"-06-30", "Second quarter report");

 //Test 3. quarter
 Test.logger.addSubSection("Third quarter report");
 addReport(banDoc, currYear+"-07-01", currYear+"-09-30", "Third quarter report");

 //Test 4. quarter
 Test.logger.addSubSection("Fourth quarter report");
 addReport(banDoc, currYear+"-10-01", currYear+"-12-31", "Fourth quarter report");

}

//Function that create the report for the test
function addReport(banDoc, startDate, endDate, reportName) {
    var btwDeclarationReport= new BTWDeclarationReport(banDoc,startDate, endDate);
    var vatReport = btwDeclarationReport.createBtwDeclarationReport();
    Test.logger.addReport(reportName, vatReport);
}
function getCurrentYear(){
    var currYear=new Date()
    currYear=currYear.getFullYear();
    return currYear;
}