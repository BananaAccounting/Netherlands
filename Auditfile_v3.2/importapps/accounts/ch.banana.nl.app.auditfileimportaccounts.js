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
// @id = ch.banana.nl.app.auditfileimportaccounts.js
// @api = 1.0
// @pubdate = 2019-01-22
// @publisher = Banana.ch SA
// @description.en = Auditfile NL - Import Accounts
// @description.nl = Auditfile NL - Invoerrekeningen
// @doctype = *
// @encoding = utf-8
// @task = import.accounts
// @outputformat = tablewithheaders
// @inputdatasource = openfiledialog
// @inputencoding = utf-8
// @inputfilefilter = XML files (*.xml);;All files (*.*)

/*
*   SUMMARY
*
*   Import the accounts taken from the xml file.
*   Accounts that already exist are not imported.
*
*
    Account, BClass and Gr based on the ac2 template for NL

    accounts                BClass  Gr
    ==================================
    0100 … 0149             1       1A
    0150 … 0299             1       1B
    0300 … 0499             1       1C
    1000 … 1099             1       1D
    1100 … 1109             1       1E
    1110 … 1399             1       1F
    2000 … 2999             1       1G
    3000 … 3999             1       1H
    0500 … 0599             2       2A
    0400 … 0499             2       2B
    0600 … 0699             2       2B
    1600 … 1699             2       2C
    1400 … 1999 !=1600…1699 2       2D
    4400 … 4499             3       3A
    4500 … 4534             3       3B
    4535 … 4599             3       3C
    4600 … 4699             3       3D
    4700 … 4899             3       3E
    4900 … 4999             3       3F
    8000 … 8109             4       4A
    8110 … 8199             4       4B
    8200 … 8299             4       4C
    11000 … 11999           1       DEB
    21000 … 21999           2       CRE
*
*/


// Main function
function exec(inData) {

    if (!Banana.document) {
      return "@Cancel";
    }

    // Load the form with all the accounts row data
    var form = [];
    loadForm(inData,form);

    // Create the file used to import in Banana
    var importAccountsFile = createImportAccountsFile(form);

    return importAccountsFile;
}



// Load the form that contains all the data used to import
function loadForm(inData, form) {

    /* Read the xml file and extract accounts data (account and description)
        
        <auditfile>
            <company>
                <generalLedger>
                    <ledgerAccount>
                        <accID>0100</accID>
                        <accDesc>Goodwill</accDesc>
                        <accTp>B</accTp>
                        <leadCode>1A</leadCode>
                        <leadDescription>Totaal Immateriële vaste activa</leadDescription>
                        <leadReference>1</leadReference>
                        <leadCrossRef/>
                    </ledgerAccount>
                </generalLedger>
            </company>
        </auditfile>
    
    */

    var xmlFile = Banana.Xml.parse(inData);
    var xmlRoot = xmlFile.firstChildElement('auditfile');
    var companyNode = xmlRoot.firstChildElement('company');
    var generalLedgerNode = companyNode.firstChildElement('generalLedger');
    var ledgerAccountNode = generalLedgerNode.firstChildElement('ledgerAccount'); // First ledgerAccount

    while (ledgerAccountNode) { // For each ledgerAccountNode
        var accountNumber = ledgerAccountNode.firstChildElement('accID').text;
        var accountDescription = ledgerAccountNode.firstChildElement('accDesc').text;
        var accType = ledgerAccountNode.firstChildElement('accTp').text;
        var gr = ledgerAccountNode.firstChildElement('leadCode').text; //setGrByAccount(accountNumber);
        var groupDescription = ledgerAccountNode.firstChildElement('leadDescription').text;
        var bclass = ledgerAccountNode.firstChildElement('leadReference').text; // setBclassByAccount(accountNumber, accType);
        form.push({"Section":"", "Group":"", "Account":accountNumber, "Description":accountDescription, "BClass":bclass, "Gr":gr});
        ledgerAccountNode = ledgerAccountNode.nextSiblingElement('ledgerAccount'); // Next ledgerAccount
    }
    //Banana.console.log(JSON.stringify(form, "", " "));
}


// Create the import text file that is used to import the accounts table in Banana
function createImportAccountsFile(form) {
    var importAccountsFile = "";

    // Header
    importAccountsFile += "Section\tGroup\tAccount\tDescription\tBClass\tGr\n";
    
    // Rows with data
    for (var i = 0; i < form.length; i++) {
        importAccountsFile += form[i].Section+"\t"+form[i].Group+"\t"+form[i].Account+"\t"+form[i].Description+"\t"+form[i].BClass+"\t"+form[i].Gr+"\n";
    }

    //Banana.console.log(importAccountsFile);
    return importAccountsFile;    
}


// Return the group (Gr) for the given account
function setGrByAccount(account) {
    var gr = "";
    //....
    return gr;
}

// Return the BClass for the given account
function setBclassByAccount(account,accType) {
    // from xml file: 
    // B=balance => BClass 1 or 2
    // P=profit/loss => BClass 3 or 4
    var bclass = "";
    if (accType === "B") {
        bclass = "1";
    }
    else if (accType === "P") {
        bclass = "3"
    }
    return bclass;
}

