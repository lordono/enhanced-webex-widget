const misc = require("./misc");
const { readFile } = misc;

const getHuntingData = async _ => {
  const rawBuffer = await readFile("mock/hunting.json");
  return JSON.parse(rawBuffer);
};

const getFilterData = async _ => {
  const rawBuffer = await readFile("mock/filter.json");
  return JSON.parse(rawBuffer);
};

module.exports = async _ => {
  // get hunting data
  const huntingData = await getHuntingData();
  // get demo data
  const filterData = await getFilterData();

  return { huntingData, filterData };
};
