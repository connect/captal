indexOfArray = function(value, source)
{
  var searchJson = JSON.stringify(value); // "[3,566,23,79]"
  var arrJson = source.map(JSON.stringify); // ["[2,6,89,45]", "[3,566,23,79]", "[434,677,9,23]"]

  return arrJson.indexOf(searchJson);
};
