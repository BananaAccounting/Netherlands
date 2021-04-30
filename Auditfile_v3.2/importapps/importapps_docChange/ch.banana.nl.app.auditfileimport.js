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
//
// @id = ch.banana.nl.app.auditfileimporttransactions.js
// @api = 1.0
// @pubdate = 2021-04-30
// @publisher = Banana.ch SA
// @description = Import audit file Netherlands
// @task = import.file
// @doctype = *
// @docproperties =
// @inputdatasource = opendirdialog
// @inputfilefilter = *.xml

/*
 *   SUMMARY
 *
 *   Import the transactions and the accounts taken from the xml file.
 */

/**
 * function called from converter
 */
function setup() {}


/**
 * 
 * @param {*} banDocument the current Banana file
 */
var NlAuditFilesImport = class NlAuditFilesImport {
    constructor(banDocument) {
        this.version = '1.0';
        this.banDocument = banDocument;
        // this.initParam();


        //array dei patches
        this.jsonDocArray = [];

        //errors
        this.ID_ERR_ = "ID_ERR_";

    }

    convertParam(param) {
        var convertedParam = {};
        convertedParam.version = '1.0';
        /*array dei parametri dello script*/
        convertedParam.data = [];

        return convertedParam;
    }

    /**
     * Il metodo createJsonDocument() riprende i dati dal file xml e li trasforma
     * in formato json per essere importati nella tabella Registrazioni
     * @param {*} inData 
     */
    createJsonDocument(inData) {


        var jsonDoc = this.createJsonDocument_Init();

        for (var srcFileName in inData) {

            //seleziona singolo file xml
            var xmlFile = Banana.Xml.parse(inData[srcFileName]);
            if (!xmlFile)
                continue;
            var xmlRoot = xmlFile.firstChildElement('auditfile');
            if (!xmlRoot)
                continue;
            var companyNode = xmlRoot.firstChildElement('company');

            var openingBalanceList = loadOpeningBalances(companyNode);

            //add the accounts
            var accountId = this.createJsonDocument_AddAccounts(jsonDoc, srcFileName, openingBalanceList);
            if (accountId.length <= 0)
                continue;

            //add the transactions
            //this.createJsonDocument_AddTransactions(jsonDoc, xmlRoot, srcFileName, accountId);

            //Banana.console.debug(JSON.stringify(jsonDoc, null, 3));
        }

        this.jsonDocArray.push(jsonDoc);

    }

    createJsonDocument_AddAccounts(jsonDoc, srcFileName, openingBalanceList) {


        var generalLedgerNode = companyNode.firstChildElement('generalLedger');
        var ledgerAccountNode = generalLedgerNode.firstChildElement('ledgerAccount'); // First ledgerAccount

        while (ledgerAccountNode) {
            var accountNumber = ledgerAccountNode.firstChildElement('accID').text;
            var accountDescription = ledgerAccountNode.firstChildElement('accDesc').text;
            var accType = ledgerAccountNode.firstChildElement('accTp').text;
            var gr = setGrByAccount(accountNumber);
            var bclass = setBclassByAccount(accountNumber, accType);
            var opening = "";


            //Take the "account___amount___amounttype" of each opening balance
            for (var i = 0; i < openingBalanceList.length; i++) {
                if (openingBalanceList[i].split("_____")[0] === accountNumber) {
                    var amnt = openingBalanceList[i].split("_____")[1];
                    var amntTp = openingBalanceList[i].split("_____")[2];
                    if (amntTp === "D") {
                        opening = amnt;
                    } else if (amntTp === "C") {
                        opening = Banana.SDecimal.invert(amnt);
                    }
                }
            }

            var row = {};
            row.operation = {};
            row.operation.name = "add";
            row.operation.srcFileName = srcFileName;
            row.fields = {};
            row.fields["Date"] = "Data ultima modifica conto";
            row.fields["Account"] = accountNumber;
            row.fields["Description"] = accountDescription;
            row.fields["BClass"] = bclass;
            row.fields["Gr"] = gr;
            row.fields["Opening"] = opening;


            var rowLists = jsonDoc.document.dataUnits["1"].data.rowLists[0];
            var index = parseInt(rowLists.rows.length);
            rowLists.rows[index.toString()] = row;

            ledgerAccountNode = ledgerAccountNode.nextSiblingElement('ledgerAccount');
        }
    }

    loadOpeningBalances(companyNode) {

        Banana.console.debug("xmlFile");

        var openingBalanceList = [];

        if (companyNode.hasChildElements('openingBalance')) {
            var openingBalanceNode = companyNode.firstChildElement('openingBalance');

            if (openingBalanceNode.hasChildElements('obLine')) {
                var obLineNode = openingBalanceNode.firstChildElement('obLine');

                while (obLineNode) { // For each openingBalance

                    if (obLineNode.hasChildElements('accID')) {
                        var accID = obLineNode.firstChildElement('accID').text;
                    }
                    if (obLineNode.hasChildElements('amnt')) {
                        var amnt = obLineNode.firstChildElement('amnt').text;
                    }
                    if (obLineNode.hasChildElements('amntTp')) {
                        var amntTp = obLineNode.firstChildElement('amntTp').text;
                    }

                    openingBalanceList.push(accID + "_____" + amnt + "_____" + amntTp);
                    obLineNode = obLineNode.nextSiblingElement('obLine'); // Next obLine
                }
            }
        }
        return openingBalanceList;
    }

    setGrByAccount(account) {
        var gr = "";
        //....
        return gr;
    }

    setBclassByAccount(account, accType) {
        /* from xml file:
        
        Accounts:
            B=balance => BClass 1 or 2
            P=profit/loss => BClass 3 or 4
    
        Customers / Suppliers:
            C=customer
            S=supplier
            B=both customer and supplier
            O=Other, no customer or supplier
        */

        var bclass = "";
        if (accType === "B") {
            bclass = ""; // 1 or 2
        } else if (accType === "P") {
            bclass = ""; // 3 or 4
        } else if (accType === "C") {
            bclass = "1";
        } else if (accType === "S") {
            bclass = "2";
        }
        return bclass;
    }

    createJsonDocument_Init() {
        var jsonDoc = {};
        jsonDoc.document = {};
        jsonDoc.fileVersion = "1.0.0";

        var dataUnitAccounts = {};
        jsonDoc.document.dataUnits = [];
        jsonDoc.document.dataUnits["0"] = dataUnitAccounts;
        dataUnitAccounts.data = {};
        dataUnitAccounts.data.rowLists = [];
        dataUnitAccounts.data.rowLists[0] = {};
        dataUnitAccounts.data.rowLists[0].rows = [];
        dataUnitAccounts.id = "Accounts";
        dataUnitAccounts.nameXml = "Accounts";
        dataUnitAccounts.nid = 100;

        var dataUnitTransactions = {};
        jsonDoc.document.dataUnits["1"] = dataUnitTransactions;
        dataUnitTransactions.data = {};
        dataUnitTransactions.data.rowLists = [];
        dataUnitTransactions.data.rowLists[0] = {};
        dataUnitTransactions.data.rowLists[0].rows = [];
        dataUnitTransactions.id = "Transactions";
        dataUnitTransactions.nameXml = "Transactions";
        dataUnitTransactions.nid = 103;

        jsonDoc.creator = {};
        var d = new Date();
        var datestring = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        var timestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        jsonDoc.creator.executionDate = Banana.Converter.toInternalDateFormat(datestring, "yyyymmdd");
        jsonDoc.creator.executionTime = Banana.Converter.toInternalTimeFormat(timestring, "hh:mm");
        jsonDoc.creator.name = Banana.script.getParamValue('id');
        jsonDoc.creator.version = "1.0";

        return jsonDoc;

    }

    getAccountingInfo() {
        this.accountingInfo = {};
        this.accountingInfo.isDoubleEntry = false;
        this.accountingInfo.isIncomeExpenses = false;
        this.accountingInfo.isCashBook = false;
        this.accountingInfo.multiCurrency = false;
        this.accountingInfo.withVat = false;
        this.accountingInfo.vatAccount = "";
        this.accountingInfo.customersGroup = "";
        this.accountingInfo.suppliersGroup = "";

        if (this.banDocument) {
            var fileGroup = this.banDocument.info("Base", "FileTypeGroup");
            var fileNumber = this.banDocument.info("Base", "FileTypeNumber");
            var fileVersion = this.banDocument.info("Base", "FileTypeVersion");

            if (fileGroup == "100")
                this.accountingInfo.isDoubleEntry = true;
            else if (fileGroup == "110")
                this.accountingInfo.isIncomeExpenses = true;
            else if (fileGroup == "130")
                this.accountingInfo.isCashBook = true;

            if (fileNumber == "110") {
                this.accountingInfo.withVat = true;
            }
            if (fileNumber == "120") {
                this.accountingInfo.multiCurrency = true;
            }
            if (fileNumber == "130") {
                this.accountingInfo.multiCurrency = true;
                this.accountingInfo.withVat = true;
            }

            if (this.banDocument.info("AccountingDataBase", "VatAccount"))
                this.accountingInfo.vatAccount = this.banDocument.info("AccountingDataBase", "VatAccount");

            if (this.banDocument.info("AccountingDataBase", "CustomersGroup"))
                this.accountingInfo.customersGroup = this.banDocument.info("AccountingDataBase", "CustomersGroup");
            if (this.banDocument.info("AccountingDataBase", "SuppliersGroup"))
                this.accountingInfo.suppliersGroup = this.banDocument.info("AccountingDataBase", "SuppliersGroup");
        }
    }

    getErrorMessage(errorId) {
        switch (errorId) {
            case this.ID_ERR_:
                return "";
        }
        return "";
    }
}

function exec(inData) {

    if (!Banana.document || inData.length <= 0)
        return "@Cancel";

    var jsonData = {};
    try {
        jsonData = JSON.parse(inData);
    } catch (e) {
        jsonData[0] = inData;
    }

    if (!jsonData)
        return "@Cancel";

    var nlAuditFilesImport = new NlAuditFilesImport(Banana.document);

    nlAuditFilesImport.createJsonDocument(jsonData);

    var jsonDoc = { "format": "documentChange", "error": "" };
    jsonDoc["data"] = nlAuditFilesImport.jsonDocArray;

    return jsonDoc;

}