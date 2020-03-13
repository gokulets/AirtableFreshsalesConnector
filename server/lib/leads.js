'use strict';

const dataStorage = require('./data-storage');

exports = {
  setLead: async function (leadEmail, value) {
    console.log('lead module :'+leadEmail+value);
    return dataStorage.setData(leadEmail, value);
  },

  getLead: async function (leadEmail) {
    return dataStorage.getData(leadEmail);
  },

  deleteLead: async function (leadEmail) {
    return dataStorage.removeData(leadEmail);
  }
};
