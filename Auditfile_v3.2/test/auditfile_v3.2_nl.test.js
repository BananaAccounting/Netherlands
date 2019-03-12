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


// @id = ch.banana.nl.app.auditfile.xml.test
// @api = 1.0
// @pubdate = 2019-03-12
// @publisher = Banana.ch SA
// @description = <TEST ch.banana.nl.app.auditfile.js>
// @task = app.command
// @doctype = *.*
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @timeout = -1
// @includejs = ../auditfile_v3.2_nl.js



// Register test case to be executed
Test.registerTestCase(new AUDITFILE_NL());

// Here we define the class, the name of the class is not important
function AUDITFILE_NL() {

}

// This method will be called at the beginning of the test case
AUDITFILE_NL.prototype.initTestCase = function() {

}

// This method will be called at the end of the test case
AUDITFILE_NL.prototype.cleanupTestCase = function() {

}

// This method will be called before every test method is executed
AUDITFILE_NL.prototype.init = function() {

}

// This method will be called after every test method is executed
AUDITFILE_NL.prototype.cleanup = function() {

}

// Generate the expected (correct) file
AUDITFILE_NL.prototype.testBananaApp = function() {

  var banDoc = "";

  //Test file 1
  banDoc = Banana.application.openDocument("file:script/../test/testcases/File_auditfile_NL_finale.ac2");
  Test.assert(banDoc);
  this.xml_test(banDoc, '2018-01-01', '2018-12-31');

  //Test file 2
  banDoc = Banana.application.openDocument("file:script/../test/testcases/auditfile_nl_without_customers_and_suppliers.ac2");
  Test.assert(banDoc);
  this.xml_test(banDoc, '2018-01-01', '2018-12-31');

  //Test file 3
  banDoc = Banana.application.openDocument("file:script/../test/testcases/auditfile_nl_only_customers.ac2");
  Test.assert(banDoc);
  this.xml_test(banDoc, '2018-01-01', '2018-12-31');

  //Test file 4
  banDoc = Banana.application.openDocument("file:script/../test/testcases/auditfile_nl_only_suppliers.ac2");
  Test.assert(banDoc);
  this.xml_test(banDoc, '2018-01-01', '2018-12-31');

}

AUDITFILE_NL.prototype.xml_test = function(banDoc, startDate, endDate) {
  
  var xml = createXml(banDoc, startDate, endDate);
  Test.logger.addXml("This is a xml value", xml);

  this.xml_validate_test(xml, '../XmlAuditfileFinancieel3.2.xsd');

}

AUDITFILE_NL.prototype.xml_validate_test = function(xmlDocument, schemaFileName) {
  
  // Validate against schema (schema is passed as a file path relative to the script)
  if (Banana.Xml.validate(Banana.Xml.parse(xmlDocument), schemaFileName)) {
      Test.logger.addText("Validation result => Xml document is valid against " + schemaFileName);
  } else {
      Test.logger.addText("Validation result => Xml document is not valid againts " + schemaFileName + ": " + Banana.Xml.errorString);
  }
}

AUDITFILE_NL.prototype.testVerifyErrors = function() {

  // assertIsEqual(<actual>,<expected>);

  Test.assertIsEqual(ERROR_STRING_MIN_LENGTH, false);
  Test.assertIsEqual(ERROR_STRING_MAX_LENGTH, false);
  Test.assertIsEqual(ERROR_VALUE_NOT_ALLOWED, false);

}

