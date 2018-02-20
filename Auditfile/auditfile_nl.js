// Copyright [2015] [Banana.ch SA - Lugano Switzerland]
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
// @id = ch.banana.bananaapp.nl.auditfile
// @api = 1.0
// @pubdate = 2015-12-03
// @publisher = Banana.ch SA
// @description = Auditfile-OECD
// @task = export.file
// @doctype = 100.*;110.*
// @docproperties = 
// @outputformat = none
// @inputdatasource = none
// @timeout = -1
// @exportfiletype = xml


//This variable is used to count the number of <transaction> elements
var numberEntries = 0;

//Main function
function exec() {

	var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
	xml += '\n' + '<auditfile xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' 

	xml = addHeader(xml);
	xml = addGeneralLedger(xml);
	xml = addCustomerSuppliers(xml);
	xml = addTransactions(xml);
	
	xml += '\n' + '</auditfile>';

	return xml;
}


//Function that creates the <header> element of the xml file
function addHeader(xml) {
	var auditfileVersion = 'CLAIR2.00.00';
	var companyID = checkStringLength(Banana.document.info('AccountingDataBase','FiscalNumber'), 20);
	var taxRegistrationNr = Banana.document.info('AccountingDataBase','VatNumber');
	var companyName = Banana.document.info('AccountingDataBase','Company');

	//Address1 and/or Address2
	if (Banana.document.info('AccountingDataBase','Address1') && !Banana.document.info('AccountingDataBase','Address2')) {
		var companyAddress = checkStringLength(Banana.document.info('AccountingDataBase','Address1'), 50);
	}
	else if (Banana.document.info('AccountingDataBase','Address1') && Banana.document.info('AccountingDataBase','Address2')) {
		var companyAddress = checkStringLength(Banana.document.info('AccountingDataBase','Address1') + ', ' + Banana.document.info('AccountingDataBase','Address2'), 50);
	}
	else if (!Banana.document.info('AccountingDataBase','Address1') && Banana.document.info('AccountingDataBase','Address2')) {
		var companyAddress = checkStringLength(Banana.document.info('AccountingDataBase','Address2'), 50);
	}

	var companyCity = Banana.document.info('AccountingDataBase','City');
	var companyPostalCode = Banana.document.info('AccountingDataBase','Zip');
	var fiscalYear = Banana.Converter.toDate(Banana.document.info('AccountingDataBase','OpeningDate')).getFullYear();
	var startDate = Banana.document.info('AccountingDataBase','OpeningDate');
	var endDate = Banana.document.info('AccountingDataBase','ClosureDate');
	var currencyCode = Banana.document.info('AccountingDataBase','BasicCurrency');
	var dateCreated = Banana.document.info('Base','Date');
	var productID = checkStringLength('Banana Accounting', 50);
	var productVersion = checkStringLength(Banana.document.info('Base', 'ProgramVersion'), 50);
	
	//Create the <header> element and add it to the final xml file
	xml +=  '\n' + '\t' + xml_createElement('header',''
			+  '\n' + '\t' + '\t' + xml_createElement('auditfileVersion',auditfileVersion)
			+  '\n' + '\t' + '\t' + xml_createElement('companyID',companyID)
			+  '\n' + '\t' + '\t' + xml_createElement('taxRegistrationNr',taxRegistrationNr) 
			+  '\n' + '\t' + '\t' + xml_createElement('companyName',companyName)
			+  '\n' + '\t' + '\t' + xml_createElement('companyAddress',companyAddress)
			+  '\n' + '\t' + '\t' + xml_createElement('companyCity',companyCity)
			+  '\n' + '\t' + '\t' + xml_createElement('companyPostalCode',companyPostalCode)
			+  '\n' + '\t' + '\t' + xml_createElement('fiscalYear',fiscalYear)
			+  '\n' + '\t' + '\t' + xml_createElement('startDate',startDate)
			+  '\n' + '\t' + '\t' + xml_createElement('endDate',endDate)
			+  '\n' + '\t' + '\t' + xml_createElement('currencyCode',currencyCode)
			+  '\n' + '\t' + '\t' + xml_createElement('dateCreated',dateCreated)
			+  '\n' + '\t' + '\t' + xml_createElement('productID',productID)
			+  '\n' + '\t' + '\t' + xml_createElement('productVersion',productVersion)
			+ '\n'+ '\t' 
		);
	return xml;
}


//Function that creates the <generalLedger> element of the xml file
function addGeneralLedger(xml) {
	
	var taxonomy = '';
    var accountID = '';
	var accountDesc = '';
	var accountType = '';
	var leadCode = '';
	var leadDescription = '';
    
    var tmpGeneralLedger =  '\n' + '\t' + '\t' + xml_createElement('taxonomy',taxonomy); 
	
    //Accounts table
    var accLen = Banana.document.table('Accounts').rowCount;
	for (var i = 0; i < accLen; i++) {
		var tRow = Banana.document.table('Accounts').row(i);
		
        accountID = tRow.value('Account');
    	accountDesc = checkStringLength(tRow.value('Description'), 50);
    	
    	//accountType
    	if (tRow.value('BClass') === '1') {
    		accountType = 'Assets';
    	} else if (tRow.value('BClass') === '2') {
    		accountType = 'Liabilities';
    	} else if (tRow.value('BClass') === '3') {
    		accountType = 'Expenses';
    	} else if (tRow.value('BClass') === '4') {
    		accountType = 'Income';
    	} else if (tRow.value('BClass') === '5') {
    		accountType = 'Off Balance Sheet: Assets';
    	} else if (tRow.value('BClass') === '6') {
    		accountType = 'Off Balance Sheet: Liabilities';
    	}

    	leadCode = tRow.value('Gr');
    	leadDescription = checkStringLength(tRow.value('Description'), 50);

		if (tRow.value('Account') && tRow.value('Account').indexOf('.') < 0) { //Check that the first character it's not a dot

			tmpGeneralLedger +=  '\n' + '\t' + '\t' + xml_createElement('ledgerAccount',''
				            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('accountID',accountID)
				            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('accountDesc',accountDesc)
				            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('accountType',accountType)
				            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('leadCode',leadCode)
				            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('leadDescription',leadDescription)
            				+ '\n' + '\t' + '\t'	
            				);
		}  
	}

	//Check if there is the table Categories to take income/expenses accounts
	if (Banana.document.table('Categories')) {
		var catLen = Banana.document.table('Categories').rowCount;
		for (var i = 0; i < catLen; i++) {
			var tRow = Banana.document.table('Categories').row(i);

			accountID = tRow.value('Account');
	    	accountDesc = checkStringLength(tRow.value('Description'), 50);
	    	accountType = tRow.value('BClass');
	    	leadCode = tRow.value('Gr');
	    	leadDescription = checkStringLength(tRow.value('Description'), 50);
			
			//Check that the first character it's not a dot
			if (tRow.value('Account') && tRow.value('Account').indexOf('.') !== 0) { 
			
				tmpGeneralLedger +=  '\n' + '\t' + xml_createElement('ledgerAccount',''
					            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('accountID',accountID)
					            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('accountDesc',accountDesc)
					            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('accountType',accountType)
					            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('leadCode',leadCode)
					            	+  '\n' + '\t' + '\t' + '\t' + xml_createElement('leadDescription',leadDescription)
					            + '\n' + '\t' + '\t'
	            				);

			}
		}
	}

	//Create the <generalLedger> element and add it to the final xml file
	xml +=  '\n' + '\t' + xml_createElement('generalLedger', tmpGeneralLedger
			+ '\n' + '\t'
		);

	return xml;	
}


//Function that creates the <customerSuppliers> element of the xml file
function addCustomerSuppliers(xml) {

	var mapGroup = {};
	loadMapGroup(mapGroup);

	var customersGroup = Banana.document.info('AccountingDataBase','CustomersGroup');
	var suppliersGroup = Banana.document.info('AccountingDataBase','SuppliersGroup');
	
	//Check if there are customers
	if (customersGroup) {
		var tmpXmlCustomers = createCustomers(mapGroup, customersGroup);
	} else {
		var tmpXmlCustomers = '';	
	}

	//Check if there are suppliers
	if (suppliersGroup) {
		var tmpXmlSuppliers = createSuppliers(mapGroup, suppliersGroup);
	} else {
		var tmpXmlSuppliers = '';
	}

	//Create the <customerSuppliers> element and add it to the final xml file
	xml +=  '\n' + '\t' + xml_createElement('customerSuppliers', ''
				+ tmpXmlCustomers
				+ tmpXmlSuppliers
			+ '\n' + '\t'
			);

	return xml;
}


//Function that creates the <transactions> element of the xml file
function addTransactions(xml) {

	//Function call to create all the <transactions> elements. Each transaction contains <line> elements
	var tmpXml = createTransactions();

	//transactions
    var totalDebit = Banana.document.table("Totals").findRowByValue("Group","3").value("Balance");
    var totalCredit = Banana.document.table("Totals").findRowByValue("Group","4").value("Balance");
    
    //journal
	var journalID = '1';
    var journalDescription = 'Journal 1';
    var type = 'Transactions';

    var tmpTransactions = '\n' + '\t' + '\t' + xml_createElement('numberEntries',numberEntries)
						+  '\n' + '\t' + '\t' + xml_createElement('totalDebit',totalDebit)
						+  '\n' + '\t' + '\t' + xml_createElement('totalCredit',totalCredit);

    var tmpJournal = '\n' + '\t' + '\t' + '\t' + xml_createElement('journalID',journalID)
					+  '\n' + '\t' + '\t' + '\t' + xml_createElement('description',journalDescription)
					+  '\n' + '\t' + '\t' + '\t' + xml_createElement('type',type);

	//Create the <transactions> element and add it to the final xml file
	xml +=  '\n' + '\t' + xml_createElement('transactions', tmpTransactions
			+ '\n' + '\t' + '\t' + xml_createElement('journal', tmpJournal
				+ tmpXml
				+ '\n' + '\t' +'\t'
			)
			+ '\n' + '\t' 
		);

	return xml;
}


//This function allows to check the length of a string.
//If a string is too long we have to cut it
function checkStringLength(string, maxLength) {
   	if (string.length > maxLength) {
	    string = string.substring(0,maxLength-3) + "...";
	}
	return string;
}





//** CUSTOMERS/SUPPLIERS functions *******************************************************************************//

//The function creates an array of group values for the given group
function loadMapGroup(mapGroup) {
	var len = Banana.document.table('Accounts').rowCount;
	for (var i = 0; i < len; i++) {
		var tRow = Banana.document.table('Accounts').row(i);
		if (tRow.value('Group')) {
			//mapGroup[tRow.value('Group')].parent = tRow.value('Gr');
			mapGroup[tRow.value('Group')] = {'parent' : tRow.value('Gr')}
		}
	}
}


//Function that checks the belonging of the groups
function groupBelongToGroup(mapGroup, current, find, start) {

	if (!start) {
		start = current;
	}

	if (!current) {
		return false;
	}

	if (!find) {
		return false;
	}

	if (mapGroup[current].parent === find) {
		return true;
	}

	if (mapGroup[current].parent === start) {
		return false;
	}

	return groupBelongToGroup(mapGroup, mapGroup[current].parent, find, start);
}


//Function that creates the customers xml elements
function createCustomers(mapGroup, customersGroup) {
	var tmpXmlCustomers = '';
	var len = Banana.document.table('Accounts').rowCount;
	
	for (var i = 0; i < len; i++) {		
		var tRow = Banana.document.table('Accounts').row(i);

		if (tRow.value('Gr') === customersGroup || groupBelongToGroup(mapGroup, tRow.value('Gr'), customersGroup)) {

			var custSupID = tRow.value('Account');
		    
		    var type = '';
	    	if (tRow.value('BClass') === '1') {
	    		type = 'Receivable';
	    	} else if (tRow.value('BClass') === '2') {
	    		type = 'Payable';
	    	}

	    	//We take the Vat Number as "taxRegistrationNumber"
	    	//We don't know which value to use between the "VatNumber" and "FiscalNumber"
		    var taxRegistrationNr = tRow.value('VatNumber');

		    //We don't have the tax verification date, so for now we let a blank value
		    //If necessary we could add a specific column for this information
		    var taxVerificationDate = '';
		    
		    if (tRow.value('OrganisationName')) {
		    	var companyName = checkStringLength(tRow.value('OrganisationName'), 50);
		    } else {
		    	var companyName = '-';
		    }

			if (tRow.value('FirstName') && tRow.value('FamilyName')) {
				var contact = checkStringLength(tRow.value('FirstName') + ' ' + tRow.value('FamilyName'), 50);
			} else {
				var contact = '';
			}

		    var telephone = tRow.value('PhoneMain');
		    var fax = tRow.value('Fax');
		    var eMail = tRow.value('EmailWork');
		    var website = tRow.value('Website');

		    var address = checkStringLength(tRow.value('Street'), 50);
	        var property = '';
	        var city = tRow.value('Locality');
	        var postalCode = tRow.value('PostalCode');
	        var region = tRow.value('Region');
	        var country = tRow.value('Country');

	        //First part of customerSupplier at the beginning
			var tmpCustomerSupplier1 = '\n' + '\t' + '\t' + '\t' + xml_createElement('custSupID',custSupID)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('type',type)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('taxRegistrationNr',taxRegistrationNr)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('taxVerificationDate',taxVerificationDate)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('companyName',companyName)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('contact',contact);
			
			//Second part of customerSupplier at the end
			var tmpCustomerSupplier2 = '\n' + '\t' + '\t' + '\t' + xml_createElement('telephone',telephone)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('fax',fax)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('eMail',eMail)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('website',website);
			
			//StreedAddress
	        var tmpStreetAddress = '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('address',address)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('property',property)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('city',city)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('postalCode',postalCode)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('region',region)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('country',country);

			
			//Create the <customerSupplier> element
			tmpXmlCustomers += '\n' + '\t' + '\t' + xml_createElement('customerSupplier', ''
								+ tmpCustomerSupplier1
								+ '\n' + '\t' + '\t' + '\t' + xml_createElement('streetAddress', ''
									+ '\t' + '\t' + '\t' + '\t' + tmpStreetAddress 
									+ '\n' + '\t' + '\t' + '\t')
								+ tmpCustomerSupplier2
								+ '\n' + '\t' + '\t'
							);
		}
	}
	return tmpXmlCustomers;
}


//Function that creates the suppliers xml elements
function createSuppliers(mapGroup, suppliersGroup) {
	var tmpXmlSuppliers = '';
	var len = Banana.document.table('Accounts').rowCount;
	
	for (var i = 0; i < len; i++) {
		var tRow = Banana.document.table('Accounts').row(i);
		
		if (tRow.value('Gr') === suppliersGroup || groupBelongToGroup(mapGroup, tRow.value('Gr'), suppliersGroup)) {

			var custSupID = tRow.value('Account');
		    
		    var type = '';
	    	if (tRow.value('BClass') === '1') {
	    		type = 'Receivable';
	    	} else if (tRow.value('BClass') === '2') {
	    		type = 'Payable';
	    	}

	    	//We take the Vat Number as "taxRegistrationNumber"
	    	//We don't know which value to use between the "VatNumber" and "FiscalNumber"
		    var taxRegistrationNr = tRow.value('VatNumber');

		    //We don't have the tax verification date, so for now we let a blank value
		    //If necessary we could add a specific column for this information
		    var taxVerificationDate = ''; 
		    
		    if (tRow.value('OrganisationName')) {
		    	var companyName = checkStringLength(tRow.value('OrganisationName'), 50);
		    } else {
		    	var companyName = '-';
		    }

		    if (tRow.value('FirstName') && tRow.value('FamilyName')) {
				var contact = checkStringLength(tRow.value('FirstName') + ' ' + tRow.value('FamilyName'), 50);
			} else {
				var contact = '';
			}

		    var telephone = tRow.value('PhoneMain');
		    var fax = tRow.value('Fax');
		    var eMail = tRow.value('EmailWork');
		    var website = tRow.value('Website');

		    var address = checkStringLength(tRow.value('Street'), 50);
	        var property = '';
	        var city = tRow.value('Locality');
	        var postalCode = tRow.value('PostalCode');
	        var region = tRow.value('Region');
	        var country = tRow.value('Country');

	        //First part of customerSupplier at the beginning
			var tmpCustomerSupplier1 = '\n' + '\t' + '\t' + '\t' + xml_createElement('custSupID',custSupID)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('type',type)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('taxRegistrationNr',taxRegistrationNr)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('taxVerificationDate',taxVerificationDate)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('companyName',companyName)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('contact',contact);
			
			//Second part of customerSupplier at the end
			var tmpCustomerSupplier2 = '\n' + '\t' + '\t' + '\t' + xml_createElement('telephone',telephone)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('fax',fax)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('eMail',eMail)
									+  '\n' + '\t' + '\t' + '\t' + xml_createElement('website',website);
			
			//StreedAddress
	        var tmpStreetAddress = '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('address',address)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('property',property)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('city',city)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('postalCode',postalCode)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('region',region)
				                + '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('country',country);

			
			//Create the <customerSupplier> element
			tmpXmlSuppliers += '\n' + '\t' + '\t' + xml_createElement('customerSupplier', ''
								+ tmpCustomerSupplier1
								+ '\n' + '\t' + '\t' + '\t' + xml_createElement('streetAddress', ''
									+ '\t' + '\t' + '\t' + '\t' + tmpStreetAddress 
									+ '\n' + '\t' + '\t' + '\t')
								+ tmpCustomerSupplier2
								+ '\n' + '\t' + '\t'
							);
		}
	}	
	return tmpXmlSuppliers;
}




//** TRANSACTIONS functions ****************************************************************************************//

//Function that creates all the <transaction> elements
function createTransactions() {

	var journal = Banana.document.journal(Banana.document.ORIGINTYPE_CURRENT, Banana.document.ACCOUNTTYPE_NORMAL);
	var transXml = '';
	var lineXml = '';
	var tmpGroup;
	var newTransaction = 'unknown';
	var len = journal.rowCount;

	//Read each row of the table
	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//If JContraAccountGroup value exists, then it is a transaction
		if (tRow.value('JContraAccountGroup')) {

			//The row doesn't belongs to any previous transaction
			//In this case we have to create a new transaction with all the lines belonging to it
			if (tmpGroup != tRow.value('JContraAccountGroup')) {

				//Create the <transaction> element
				if (newTransaction === 'false') {	
					transXml += '\n' + '\t' + '\t' + '\t' + xml_createElement('transaction', tmpTransaction 
										+ lineXml
								+ '\n' + '\t' + '\t' +'\t'
								);

					//Reset value of the lines text
					lineXml = '';
				}
				
				//If the current JContraAccountGroup is different from the previous, then begins a new transaction
				newTransaction = 'true';
				
				//Take all the needed values for the <transaction> element and save them
				var tmpTransaction = '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('transactionID',tRow.value('JRowOrigin'))
					+ '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('description',checkStringLength(tRow.value('JDescription'), 50))
					+ '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('period',Banana.Converter.toDate(tRow.value('JDate')).getFullYear()) //We don't know exactly what is the "period" tag, so at the moment we insert the year of the accounting period
					+ '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('transactionDate',tRow.value('JDate'))
					+ '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('sourceID',''); //This kind of information doesn't exists in Banana, so we let a blank space
			
				//Increase the transaction's counter every time a there is a new <transaction> element
				numberEntries++;

				//Everytime there is a new transaction, we save the new JContraAccountGroup value.
				//We will use it to determine if the next row belongs to the same transaction or not.
				tmpGroup = tRow.value('JContraAccountGroup');
			}

			//The row belongs to the same (previous) transaction
			else if (tmpGroup == tRow.value('JContraAccountGroup')) {
				//We set the value of the variable to false, to indicate that the transaction <element> could be created:
				//this only if the JContraAccountGroup value of the next row is different from the current one
				newTransaction = 'false';
			}

			//In every case, independently from the 'If...Else Statements', for each transactions rows we create the <line> element
			lineXml += createLine(tRow);
		}
	}

	//Create the last <transaction> element at the end of the loop (outside the for..loop)
	//This because otherwise, the last transaction will never be created due to the fact that the last row cannot be compared
	//to the next one, simply because it doesn't exists
	transXml += '\n' + '\t' + '\t' + '\t' + xml_createElement('transaction', tmpTransaction
				+ lineXml
			+ '\n' + '\t' + '\t' + '\t'
		);

	//Return all the <transaction> elements
	return transXml;
}


//Function that creates the lines of the transactions: <line> elements
function createLine(tRow) {
	
	var tmpXml = '';
	var recordID = tRow.value('JRowOrigin');
    var accountID = tRow.value('JAccount');
    var custSupID = ''; //We don't know exactly what is that tag, so at the moment we let it empty
    var documentID = tRow.value('Doc');
   	var effectiveDate = tRow.value('JDate'); //We use the date of the transaction
   	var description = checkStringLength(tRow.value('JDescription'), 50);
 
 	if (tRow.value('Cc1')) {
 		var costDesc = tRow.value('Cc1');
 	} else if (tRow.value('Cc2')) {
		var costDesc = tRow.value('Cc2');
 	} else if (tRow.value('Cc3')) {
		var costDesc = tRow.value('Cc3');
 	} else {
 		var costDesc = '';
 	}

    var productDesc = ''; //We don't use it, so we let it empty
    var projectDesc = ''; //We don't use it, so we let it empty
    var vatCode = tRow.value('VatCode');
    var currencyCode = Banana.document.info('AccountingDataBase','BasicCurrency');
    
    if (Banana.SDecimal.sign(tRow.value('JAmount')) > 0) {
    	var debitAmount = tRow.value('JAmount');
  		var creditAmount = '0.00';
    } else if (Banana.SDecimal.sign(tRow.value('JAmount')) < 0) {
    	var debitAmount = '0.00';
    	var creditAmount = tRow.value('JAmount');
    } else {
    	var debitAmount = '0.00';
    	var creditAmount = '0.00';
    }
    
	//vatPercentage must be a double: if the value does not exists we have to set to 0.00
	if (tRow.value('VatRate')) {
		var vatPercentage = tRow.value('VatRate');
	} else {
		var vatPercentage = '0.00';
	}

	//vatAmount must be a decimal: if the value does not exists we have to set to 0.00
	if (tRow.value('VatPosted')) {
		var vatAmount = tRow.value('VatPosted');
	} else {
		var vatAmount = '0.00';
	}

	if (tRow.value('JDebitAmount')) {
		var currencyDebitAmount = tRow.value('JDebitAmount');
		var currencyCreditAmount = '0.00';	
	} else if (tRow.value('JCreditAmount')) {
		var currencyDebitAmount = '0.00';
		var currencyCreditAmount = tRow.value('JCreditAmount');
	} else {
		var currencyCreditAmount = '0.00';
		var currencyDebitAmount = '0.00';
	}
	
	//Line
	var tmpLine = '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('recordID',recordID)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('accountID',accountID)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('custSupID',custSupID)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('documentID',documentID)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('effectiveDate',effectiveDate)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('description',description)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('debitAmount',debitAmount)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('creditAmount',creditAmount)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('costDesc',costDesc)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('productDesc',productDesc)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('projectDesc',projectDesc);

	//Vat
	var tmpVat = '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('vatCode',vatCode)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('vatPercentage',vatPercentage)
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('vatAmount',vatAmount);

	//Currency
	var tmpCurrency = '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('currencyCode',currencyCode)
			+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('currencyDebitAmount',currencyDebitAmount)
			+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('currencyCreditAmount',currencyCreditAmount);


	//Create the <line> element
	tmpXml += '\n' + '\t' + '\t' + '\t' + '\t' + xml_createElement('line',tmpLine
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('vat',tmpVat
					+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t')
				+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t' + xml_createElement('currency',tmpCurrency
					+ '\n' + '\t' + '\t' + '\t' + '\t' + '\t')
			+ '\n' + '\t' + '\t' + '\t' + '\t'
			);

	return tmpXml;
}




//** XML document functions ****************************************************************************************//

var APOS = "'"; 
QUOTE = '"';
var ESCAPED_QUOTE = {  };
ESCAPED_QUOTE[QUOTE] = '&quot;';
ESCAPED_QUOTE[APOS] = '&apos;';
   
// XML writer with attributes and smart attribute quote escaping 
function xml_createElement(name,content,attributes){
    var att_str = '';
    if (attributes) { // tests false if this arg is missing!
        att_str = xml_formatAttributes(attributes);
    }
    var xml;
    if (!content){
        xml='<' + name + att_str + '/>';
    }
    else {
        xml='<' + name + att_str + '>' + content + '</'+name+'>';
    }
    return xml;
}

/*
   Format a dictionary of attributes into a string suitable
   for inserting into the start tag of an element.  Be smart
   about escaping embedded quotes in the attribute values.
*/
function xml_formatAttributes(attributes) {
    var att_value;
    var apos_pos, quot_pos;
    var use_quote, escape, quote_to_escape;
    var att_str;
    var re;
    var result = '';
   
    for (var att in attributes) {
        att_value = attributes[att];
		if (att_value === undefined)
			continue;
        
        // Find first quote marks if any
        apos_pos = att_value.indexOf(APOS);
        quot_pos = att_value.indexOf(QUOTE);
       
        // Determine which quote type to use around 
        // the attribute value
        if (apos_pos === -1 && quot_pos === -1) {
            att_str = ' ' + att + "='" + att_value +  "'";
            result += att_str;
            continue;
        }
        
        // Prefer the single quote unless forced to use double
        if (quot_pos != -1 && quot_pos < apos_pos) {
            use_quote = APOS;
        }
        else {
            use_quote = QUOTE;
        }
   
        // Figure out which kind of quote to escape
        // Use nice dictionary instead of yucky if-else nests
        escape = ESCAPED_QUOTE[use_quote];
        
        // Escape only the right kind of quote
        re = new RegExp(use_quote,'g');
        att_str = ' ' + att + '=' + use_quote + 
            att_value.replace(re, escape) + use_quote;
        result += att_str;
    }
    return result;
}
