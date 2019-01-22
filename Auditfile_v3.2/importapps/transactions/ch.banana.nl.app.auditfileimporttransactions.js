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
// @id = ch.banana.nl.app.auditfileimporttransactions.js
// @api = 1.0
// @pubdate = 2019-01-22
// @publisher = Banana.ch SA
// @description.en = Auditfile NL - Import Transactions
// @description.nl = Auditfile NL - Transacties importeren
// @doctype = *
// @encoding = utf-8
// @task = import.transactions
// @outputformat = transactions.simple
// @inputdatasource = openfiledialog
// @inputencoding = utf-8
// @inputfilefilter = XML files (*.xml);;All files (*.*)

/*
*   SUMMARY
*
*   Import the transactions taken from the xml file.
*

--------------------------------------------------------------------------------------------------------------------
Date      | Doc     | Description                    | Debit  | Credit | Amount  | VatCode | VatRate | VatPosted    
--------------------------------------------------------------------------------------------------------------------
01.01.18  | 1       | Contante verkoop van goederen  | 1000   | 8100   | 500.00  | V21     | -21.00  | -86.78       <Banana>


01.01.18  | 1       | Contante verkoop van goederen  | 1000   |        | 500.00  |         |         |              <imported from xml>
01.01.18  | 1       | Contante verkoop van goederen  |        | 8100   | 413.22  |         |         |
01.01.18  | 1       | Contante verkoop van goederen  |        | 1500   |  86.78  |         |         |

************************************************************************************************************************

19.01.18  | 2       | Aankoop verpakkingsmateriaal   | 4815   | 21000  | 400.00  | IG21    |  21.00  | 69.42        <Banana>


19.01.18  | 2       | Aankoop verpakkingsmateriaal   | 4815   |        | 330.58  |         |         |              <imported from xml>
19.01.18  | 2       | Aankoop verpakkingsmateriaal   |        | 21000  | 400.00  |         |         |  
19.01.18  | 2       | Aankoop verpakkingsmateriaal   | 1500   |        |  69.42  |         |         | 

************************************************************************************************************************

19.02.18  | 3       | Betaling faktuur 15 aan lever  | 21000  | 1010   | 400.00  |         |         |              <Banana>


19.02.18  | 3       | Betaling faktuur 15 aan lever  | 21000  |        | 400.00  |         |         |              <imported from xml>
19.02.18  | 3       | Betaling faktuur 15 aan lever  |        | 1010   | 400.00  |         |         |              

************************************************************************************************************************

01.10.18  |         | Contante verkoop van goederen  | 1000   |        | 500.00  |         |         |              <Banana>
01.10.18  |         | Contante verkoop van goederen  |        | 8100   | 390.00  | V21     | -21.00  | -67.69
01.10.18  |         | Contante verkoop van goederen  |        | 8100   | 100.00  | V6      | -6.00   | -5.66
01.10.18  |         | Contante verkoop van goederen  |        | 8100   | 10.00   |         |         |
                                            

01.10.18  |         | Contante verkoop van goederen  | 1000   |        | 500.00  |         |         |              <imported from xml>
01.10.18  |         | Contante verkoop van goederen  |        | 8100   | 322.31  |         |         |
01.10.18  |         | Contante verkoop van goederen  |        | 1500   |  67.69  |         |         |
01.10.18  |         | Contante verkoop van goederen  |        | 8100   |  94.34  |         |         |
01.10.18  |         | Contante verkoop van goederen  |        | 1500   |   5.66  |         |         |
01.10.18  |         | Contante verkoop van goederen  |        | 8100   |  10.00  |         |         |




XML structure:

<auditfile>
    <company>
        <transactions>
            <journal>
                <transaction>
                    <nr>1</nr>
                    <desc>Transaction description text...</desc>
                    <trDt>2018-01-01</trDt>
                    <amnt>500.00</amnt>
                    <amntTp>D</amntTp>
                    <trLine>
                        <nr>1</nr>
                        <accID>1000</accID>
                        <docRef>1</docRef>
                        <effDate>2018-01-01</effDate>
                        <amnt>500.00</amnt>
                        <amntTp>D</amntTp>
                        <vat>
                            <vatID>V21</vatID>
                            <vatPerc>21.00</vatPerc>
                            <vatAmnt>-86.78</vatAmnt>
                            <vatAmntTp>C</vatAmntTp>
                        </vat>
                    </trLine>
                    <trLine>
                        ...
                    </trLine>
                </transaction>
                <transaction>
                    ...
                </transaction>
            </journal>
            <journal>
                ...
            </journal>
        </transactions>
    </company>
</auditfile>
*/


// Main function
function exec(inData) {

    if (!Banana.document) {
      return "@Cancel";
    }

    // Load the form with all the accounts row data
    // {"Date":"", "Doc":"", "DocType":"", "Description":"", "Account":"", "ContraAccount":"", "Income":""}
    var form = [];
    loadForm(inData,form);

    // Create the file used to import in Banana
    var importTransactionsFile = createImportTransactionsFile(form);

    return importTransactionsFile;
}



// Load the form that contains all the data used to import
function loadForm(inData, form) {

    var xmlFile = Banana.Xml.parse(inData);
    var xmlRoot = xmlFile.firstChildElement('auditfile');
    var companyNode = xmlRoot.firstChildElement('company');
    var transactionsNode = companyNode.firstChildElement('transactions');
    
    var transactonNumber = ""; //used as Doc number: the rows belonging to the same transactions have the same number
    var transactionDate = "";
    var transactionDescription = "";
    var transactionDebitAccount = "";
    var transactionCreditAccount = "";
    var transactionAmount = "";

    var journalNode = transactionsNode.firstChildElement('journal');
    while (journalNode) {

        var transactionNode = journalNode.firstChildElement('transaction'); // First transaction
        while (transactionNode) {

            var nr = "";
            var desc = "";
            var trDt = "";

            if (transactionNode.hasChildElements('nr')) {
                nr = transactionNode.firstChildElement('nr').text;
            }
            if (transactionNode.hasChildElements('desc')) {
                desc = transactionNode.firstChildElement('desc').text;
            }
            if (transactionNode.hasChildElements('trDt')) {
                trDt = transactionNode.firstChildElement('trDt').text;
            }
            
            //Banana.console.log("NEW TRANSACTION: " + nr + "; " + desc + "; " + trDt);

            var trLineNode = transactionNode.firstChildElement('trLine');
            while (trLineNode) {

                var trLineNr = "";
                var trLineAccID = "";
                var trLineDocRef = "";
                var trLineEffDate = "";
                var trLineDesc = "";
                var trLineAmnt = "";
                var trLineAmntTp = "";

                if (trLineNode.hasChildElements('nr')) {
                    trLineNr = trLineNode.firstChildElement('nr').text;
                }
                if (trLineNode.hasChildElements('accID')) {
                    trLineAccID = trLineNode.firstChildElement('accID').text;
                }
                if (trLineNode.hasChildElements('docRef')) {
                    trLineDocRef = trLineNode.firstChildElement('docRef').text;
                }
                if (trLineNode.hasChildElements('effDate')) {
                    trLineEffDate = trLineNode.firstChildElement('effDate').text;
                }
                if (trLineNode.hasChildElements('desc')) {
                    trLineDesc = trLineNode.firstChildElement('desc').text;
                }
                if (trLineNode.hasChildElements('amnt')) {
                    trLineAmnt = trLineNode.firstChildElement('amnt').text;
                }
                if (trLineNode.hasChildElements('amntTp')) {
                    trLineAmntTp = trLineNode.firstChildElement('amntTp').text;
                }

                //Banana.console.log(nr + "; " + trLineAccID + "; " + trLineDocRef + "; " + trLineEffDate + "; " + trLineDesc + "; " + trLineAmnt + "; " + trLineAmntTp);
                
                // Description of the transaction
                var transactionDescription = "";
                if (desc) {
                    transactionDescription = desc + ", " + trLineDesc;
                } else {
                    transactionDescription = trLineDesc;
                }

                // Account and ContraAccount of the transaction
                if (trLineAmntTp === "D") {
                    var transactionDebitAccount = trLineAccID;
                    var transactionCreditAccount = "";
                } else if (trLineAmntTp === "C") {
                    var transactionDebitAccount = "";
                    var transactionCreditAccount = trLineAccID;
                }

                // Push data to form
                form.push({"Date":trLineEffDate, "Doc":nr, "DocType":"", "Description":transactionDescription, "Account":transactionDebitAccount, "ContraAccount":transactionCreditAccount, "Income":Banana.SDecimal.abs(trLineAmnt)});


                trLineNode = trLineNode.nextSiblingElement('trLine'); // Next trLine
            } //trLineNode

            //Banana.console.log("***");

            transactionNode = transactionNode.nextSiblingElement('transaction'); // Next transaction
        } // transactionNode

        journalNode = journalNode.nextSiblingElement('journal'); // Next journal
    } //journalNode

    //Banana.console.log(JSON.stringify(form, "", " "));
}


// Create the import text file that is used to import the accounts table in Banana
function createImportTransactionsFile(form) {

    var importTransactionsFile = "";
    //Header
    importTransactionsFile += "Date\tDoc\tDocType\tDescription\tAccount\tContraAccount\tIncome\n";

    // Rows with data
    for (var i = 0; i < form.length; i++) {
        importTransactionsFile += form[i].Date+"\t"+form[i].Doc+"\t"+form[i].DocType+"\t"+form[i].Description+"\t"+form[i].Account+"\t"+form[i].ContraAccount+"\t"+form[i].Income+"\n";
    }

    //Banana.console.log(importTransactionsFile);
    return importTransactionsFile;    
}

