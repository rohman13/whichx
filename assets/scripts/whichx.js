const stopwords = require('whichx/assets/scripts/stopwords-id');
// Defining the Whichx object.
function WhichX() {
  // Internet explorer 9 or later required, or any other popular browser.

  // Map (using object notation) of description types.
  // Each type containing a map of words and counts.
  // The tcount represents the total number of those labels.
  // The word total represents the total number of words added against that label.
  var typesMap = {
    // Total must exist and be incremented for probability calculations.
    "total": { "tcount": 0, "wordTotal": 1 }
  };

  // Add a label or list of labels to the classifier
  this.addLabels = function (labels) {
    var i = 0;
    if (typeof labels === "string" && labels.length > 0 && !(labels.toLowerCase() in typesMap)) {
      typesMap[labels.toLowerCase()] = { "tcount": 0, "wordTotal": 0 };
    } else if (labels instanceof Array) {
      for (i; i < labels.length; i++) {
        if (typeof labels[i] === "string" && labels[i].length > 0 && !(labels[i].toLowerCase() in typesMap)) {
          typesMap[labels[i].toLowerCase()] = { "tcount": 0, "wordTotal": 0 };
        } else {
          throw new Error("Invalid label");
        }
      }
    } else {
      throw new Error("Invalid label");
    }
  };

  // Add word data from a description to a specified label.
  this.addData = function (label, description) {
    var type, wordArray, i, word;
    var total = typesMap.total;

    if (label.toLowerCase() in typesMap && typeof description === "string") {
      type = typesMap[label.toLowerCase()];
      type.tcount = type.tcount + 1;
      total.tcount = total.tcount + 1;
      wordArray = processToArray(description);
      // Check whether each word exists against that label and the total.
      // If it does increment the tcount, otherwise add the word.
      for (i = 0; i < wordArray.length; i++) {
        word = wordArray[i];
        // Add/Increment word to specific label.
        if (word in type) {
          type[word] = type[word] + 1;
        } else {
          type[word] = 1;
        }
        // Add/Increment word to total
        if (word in total) {
          total[word] = total[word] + 1;
        } else {
          total[word] = 1;
        }
        type.wordTotal = type.wordTotal + 1;
        total.wordTotal = total.wordTotal + 1;
      }
    } else {
      throw new Error("Invalid label or description");
    }
  };

  // Take a description and find the most likely label for it.
  this.classify = function (description) {
    var wordArray, bestChance, bestLabel, typeName,
      type, typeChance;
    let labelArray = new Array();

    if (typeof description === "string" && description.length > 0) {
      wordArray = processToArray(description);
      bestChance = -1;
      bestLabel = undefined;
      let arrRes = [];
      // Loop through types working out the chance of the description being
      // for this type. If better than bestChance then bestChange <- chance.
      for (typeName in typesMap) {
        if (typesMap.hasOwnProperty(typeName)) {
          type = typesMap[typeName];
          typeChance = getTypeChance(type, wordArray);
          if (typeChance > bestChance) {
            bestChance = typeChance;
            bestLabel = typeName;
          }
          arrRes.push(typeChance);
        }
      }
      //console.log(arrRes[190-1]);
      //let arrRes2 = [...arrRes];
      //arrRes.sort(function(a, b){return b - a});
      //console.log(arrRes2.indexOf(arrRes[0])+1);
      //return bestLabel;
      result = Array.from(Array(arrRes.length).keys())
        .sort((a, b) => arrRes[a] > arrRes[b] ? -1 : (arrRes[b] > arrRes[a]) | 0)
      result = result.map(i => i + 1);
      return result;

    } else {
      throw new Error("Invalid description");
    }
  };

  // Exports the WhichX internal data representation learned from provided
  // labeled text. Please see the typesMap comments for more details.
  this.export = function () {
    return typesMap;
  };

  // Imports a previously exported typesMap. This will write over any data this instance has already learned.
  this.import = function (importedTypesMap) {
    var newTotal = importedTypesMap.total;
    if (newTotal === "undefined" || newTotal.tcount === "undefined" || newTotal.wordTotal === "undefined") {
      throw new Error("Import invalid. This doesn't look like it was exported from a prior model.");
    }
    typesMap = importedTypesMap;
  };

  // Loop through words and work out probability of type given each word.
  // Multiply each word's probability by total probability to determine type probability.
  function getTypeChance(type, words) {
    var i, typeWordCount, totalWordCount, p1, p2, wordChance;
    var typeChance = 0;
    var total = typesMap.total;

    for (i = 0; i < words.length; i++) {
      typeWordCount = (typeof type[words[i]] !== "undefined" ? type[words[i]] : mEstimate());
      totalWordCount = (typeof total[words[i]] !== "undefined" ? total[words[i]] : mEstimate());
      // Bayes' theorem calculation.
      p1 = (typeWordCount / type.wordTotal) * (type.tcount / total.tcount);
      p2 = ((totalWordCount - typeWordCount / (total.wordTotal - type.wordTotal)) * ((total.tcount - type.tcount) / total.tcount));
      wordChance = p1 / (p1 + p2);
      if (typeChance <= 0) {
        typeChance = wordChance;
      } else {
        typeChance = typeChance * wordChance;
      }
    }
    // Multiply final probability by overall probability that it is of this type to weight by most popular types.
    return typeChance * (type.tcount / total.tcount);
  }

  // A non-zero prior estimate to prevent 0 based probability calculations.
  function mEstimate() {
    var total = typesMap.total;
    return 1 / (total.wordTotal * 100);
  }
  // Process the description into an array of pertinent standardized lower case words.
  function processToArray(description) {
    var i = 0;
    if (typeof description === "string") {
      // Remove extra spaces.
      description = description.replace(/\s+/g, " ");
      // Remove special characters.
      description = description.replace(/[^a-zA-Z ]/g, "");
      // Lower case.
      description = description.toLowerCase();
      // Remove all stop words
      for (i; i < stopwords.length; i++) {
        description = description.replace(new RegExp(" " + stopwords[i] + " ", "g"), " ");
      }
      description = description.replace(/ {2,}/g, " ");
      description = description.trim();
      // Return array of processed words.
      return description.split(" ");
    } else {
      throw new Error("Invalid description");
    }
  }
}

// Export whichx function if using node.
if (module && module.exports) {
  module.exports = WhichX;
}