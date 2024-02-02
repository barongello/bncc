const XLSX = require("xlsx");
const fs = require("fs");

const workbook = XLSX.readFile("bncc.xlsx");
const sheetNames = workbook.SheetNames;



// Initialize data - BEGIN
const data = {
  ageGroups: [
    {
      area: "Creche",
      name: "Bebês",
      range: "Zero a 1 ano e 6 meses"
    },
    {
      area: "Creche",
      name: "Crianças bem pequenas",
      range: "1 ano e 7 meses a 3 anos e 11 meses"
    },
    {
      area: "Pré-escola",
      name: "Crianças pequenas",
      range: "4 anos a 5 anos e 11 meses"
    }
  ]
};
// Initialize data - END



// Build ageGroupsByName - BEGIN
const ageGroupsByName = {};

for(const ageGroup of data.ageGroups) {
  const { area, name, range } = ageGroup;

  if(ageGroupsByName.hasOwnProperty(name) === true) {
    continue;
  }

  ageGroupsByName[name] = {
    area,
    range
  };
}

data.ageGroupsByName = ageGroupsByName;
// Build ageGroupsByName - END



// Build areasByName from ageGroups - BEGIN
const areasByName = {};

for(const ageGroup of data.ageGroups) {
  const { area, name, range } = ageGroup;

  if(areasByName.hasOwnProperty(area) === false) {
    areasByName[area] = [];
  }

  const areaByName = areasByName[area];
  const areaByNameEntry = {
    name,
    range
  };

  areaByName.push(areaByNameEntry);
}

data.areasByName = areasByName;
// Build areasByName from ageGroups - END



// Learning rights - BEGIN
const learningRightsSheet = workbook.Sheets[sheetNames[0]];
const learningRights = [];

for(let i = 3; i <= 8; ++i) {
  const learningRight = learningRightsSheet[`A${i}`].v;

  learningRights.push(learningRight);
}

data.learningRights = learningRights;
// Learning rights - END



// Experience fields - BEGIN
const experienceFieldsSheet = workbook.Sheets[sheetNames[1]];
const experienceFields = [];

for(let i = 4; i <= 8; ++i) {
  const name = experienceFieldsSheet[`A${i}`].v;
  const descriptions = experienceFieldsSheet[`B${i}`].v.replace(/\r/g, "").split("\n").map(line => line.trim());
  const orientations = experienceFieldsSheet[`C${i}`].v.replace(/\r/g, "").split("\n").map(line => line.trim());
  const rights = experienceFieldsSheet[`D${i}`].v.replace(/\r/g, "").split("\n").map(line => line.trim());

  const experienceField = {
    name,
    descriptions,
    orientations,
    rights
  };

  experienceFields.push(experienceField);
}

data.experienceFields = experienceFields;
// Experience fields - END



// Build experienceFieldsByName from experienceFields - BEGIN
const experienceFieldsByName = {};

for(const experienceField of data.experienceFields) {
  const { name, descriptions, orientations, rights } = experienceField;

  if(experienceFieldsByName.hasOwnProperty(name) === true) {
    continue;
  }

  experienceFieldsByName[name] = {
    descriptions,
    orientations,
    rights
  };
}

data.experienceFieldsByName = experienceFieldsByName;
// Build experienceFieldsByName from experienceFields - END



// Clean up ageGroups, areas and experienceFields - BEGIN
data.ageGroups = Object.keys(ageGroupsByName);
data.areas = Object.keys(areasByName);
data.experienceFields = Object.keys(experienceFieldsByName);
// Clean up ageGroups, areas and experienceFields - END



// Build contents - BEGIN
const contents = [];

for(let sheetIndex = 2; sheetIndex < sheetNames.length; ++sheetIndex) {
  const sheet = workbook.Sheets[sheetNames[sheetIndex]];

  for(let i = 4; i < Number.POSITIVE_INFINITY; ++i) {
    if(sheet.hasOwnProperty(`A${i}`) === false) {
      break;
    }

    const experienceField = sheet[`A${i}`].v;
    const ageGroup = sheet[`B${i}`].v.split("(")[0].trim();
    const objectiveTokens = sheet[`C${i}`].v.replace(/\r/g, "").split("\n");
    const code = objectiveTokens[0].replace(/[()]/g, "").trim();
    const objectives = objectiveTokens.splice(1).map(line => line.trim());
    const approaches = sheet[`D${i}`].v.replace(/\r/g, "").split("\n").map(line => line.trim());
    const suggestions = sheet[`E${i}`].v.replace(/\r/g, "").split("\n").map(line => line.trim());

    const content = {
      experienceField,
      ageGroup,
      code,
      objectives,
      approaches,
      suggestions
    };

    contents.push(content);
  }
}

data.contents = contents;
// Build contents - END



// Build contentsByExperienceField from contents - BEGIN
const contentsByExperienceField = {};

for(const content of contents) {
  const {
    experienceField,
    code
  } = content;

  if(contentsByExperienceField.hasOwnProperty(experienceField) === false) {
    contentsByExperienceField[experienceField] = [];
  }

  const contentsByExperienceFieldArray = contentsByExperienceField[experienceField];

  contentsByExperienceFieldArray.push(code);
}

data.contentsByExperienceField = contentsByExperienceField;
// Build contentsByExperienceField from contents - END



// Build contentsByAgeGroup from contents - BEGIN
const contentsByAgeGroup = {};

for(const content of contents) {
  const {
    ageGroup,
    code
  } = content;

  if(contentsByAgeGroup.hasOwnProperty(ageGroup) === false) {
    contentsByAgeGroup[ageGroup] = [];
  }

  const contentsByAgeGroupArray = contentsByAgeGroup[ageGroup];

  contentsByAgeGroupArray.push(code);
}

data.contentsByExperienceField = contentsByExperienceField;
// Build contentsByAgeGroup from contents - END



// Build contentsByCode from contents - BEGIN
const contentsByCode = {};

for(const content of contents) {
  const {
    experienceField,
    ageGroup,
    code,
    objectives,
    approaches,
    suggestions
  } = content;

  if(contentsByCode.hasOwnProperty(code) === true) {
    continue;
  }

  contentsByCode[code] = {
    experienceField,
    ageGroup,
    objectives,
    approaches,
    suggestions
  };
}

data.contentsByCode = contentsByCode;
// Build contentsByCode from contents - END



// Build contentsByExperienceFieldAndAgeGroup from contents - BEGIN
const contentsByExperienceFieldAndAgeGroup = {};

for(const content of contents) {
  const {
    experienceField,
    ageGroup,
    code
  } = content;

  if(contentsByExperienceFieldAndAgeGroup.hasOwnProperty(experienceField) === false) {
    contentsByExperienceFieldAndAgeGroup[experienceField] = {};
  }

  const contentsByExperienceField = contentsByExperienceFieldAndAgeGroup[experienceField];

  if(contentsByExperienceField.hasOwnProperty(ageGroup) === false) {
    contentsByExperienceField[ageGroup] = [];
  }

  const contentsByExperienceFieldAndAgeGroupArray = contentsByExperienceField[ageGroup];

  contentsByExperienceFieldAndAgeGroupArray.push(code);
}

data.contentsByExperienceFieldAndAgeGroup = contentsByExperienceFieldAndAgeGroup;
// Build contentsByExperienceFieldAndAgeGroup from contents - END



// Build contentsByAgeGroupAndExperienceField from contents - BEGIN
const contentsByAgeGroupAndExperienceField = {};

for(const content of contents) {
  const {
    experienceField,
    ageGroup,
    code
  } = content;

  if(contentsByAgeGroupAndExperienceField.hasOwnProperty(ageGroup) === false) {
    contentsByAgeGroupAndExperienceField[ageGroup] = {};
  }

  const contentsByAgeGroup = contentsByAgeGroupAndExperienceField[ageGroup];

  if(contentsByAgeGroup.hasOwnProperty(experienceField) === false) {
    contentsByAgeGroup[experienceField] = [];
  }

  const contentsByAgeGroupAndExperienceFieldArray = contentsByAgeGroup[experienceField];

  contentsByAgeGroupAndExperienceFieldArray.push(code);
}

data.contentsByAgeGroupAndExperienceField = contentsByAgeGroupAndExperienceField;
// Build contentsByAgeGroupAndExperienceField from contents - END



// Clean up contents - BEGIN
delete data.contents;
// Clean up contents - END



// Write dumped data - BEGIN
const jsonData = JSON.stringify(data, null, 2);
const dataToWrite = `${jsonData}\n`;

fs.writeFileSync("data.json", dataToWrite);
// Write dumped data - END
