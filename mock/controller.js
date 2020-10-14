const model = require("./model");
const misc = require("./misc");
const { fullOverwrite } = misc;

const filterWrite = fullOverwrite("filter.json");
const huntingWrite = fullOverwrite("hunting.json");

// initialize data
let huntingData, filterData;
model().then(response => {
  filterData = response.filterData;
  huntingData = response.huntingData;
});

const returnHunting = data => {
  if (data && "spaces" in data) {
    return data.spaces;
  } else {
    return [];
  }
};

const returnFilter = data => {
  if (data) {
    return data;
  } else {
    return {};
  }
};

exports.hunting_get = (_, res) => {
  return res.json(returnHunting(huntingData));
};

exports.hunting_post = (req, res) => {
  const data = req.body;
  let newData = { spaces: [] };
  if ("spaces" in data) {
    if (huntingData && "spaces" in huntingData) {
      newData.spaces = newData.spaces.concat(huntingData.spaces);
    }
    newData.spaces = newData.spaces.concat(data.spaces);
    newData.spaces = [...new Set(newData.spaces)];
    huntingWrite(newData);
    huntingData.spaces = newData.spaces;
    return res.json(returnHunting(newData));
  } else {
    return res.json(returnHunting(huntingData));
  }
};

exports.hunting_delete = (req, res) => {
  const data = req.body;
  let newData = { spaces: [] };
  if ("spaces" in data) {
    if (huntingData && "spaces" in huntingData) {
      newData.spaces = newData.spaces.concat(huntingData.spaces);
    }
    for (let space of data.spaces) {
      const index = newData.spaces.findIndex(i => i === space);
      if (index >= 0) {
        newData.spaces.splice(index, 1);
      }
    }
    newData.spaces = [...new Set(newData.spaces)];
    huntingWrite(newData);
    huntingData.spaces = newData.spaces;
    return res.json(returnHunting(newData));
  } else {
    return res.json(returnHunting(huntingData));
  }
};

exports.filter_get = (_, res) => {
  return res.json(returnFilter(filterData));
};
