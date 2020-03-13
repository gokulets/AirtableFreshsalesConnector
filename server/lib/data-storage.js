'use strict';

/**
 * In the following updateData method, the given attributes are updated with given action
 * as an object with a key in the format of "contact:1" where 1 is the given contact ID.
 **/
async function updateData(key, action, attributes) {
  return $db.update(key, action, attributes);
}

/**
 * In the following setData method, the given key and value are stored as an object with
 * a key in the format of "contact:1" where 1 is the given contact ID.
 *
 * It calls updateData method inside to store the attributed using set option.
 **/
async function setData(key, value) {
  const attributes = {};

  attributes[key] = value;
  console.log('The attributes value in setData is:'+value+key);
  return updateData(key, 'set', attributes);
}

/**
 * In the following getData method, the data stored with given contact ID is fetched and
 * returned the value in the attribute with the given key.
 **/
async function getData(key) {
  try {
    console.log('the key in get data is :'+key);
    const data = await $db.get(key);

    return data[key];
  } catch (error) {
    console.log('failed to get stored contact information');
    console.log(error);
    //throw error;
    return null;
  }
}

async function removeData(key) {
  return $db.delete(key);
}

exports = {
  setData,
  updateData,
  getData,
  removeData
};
