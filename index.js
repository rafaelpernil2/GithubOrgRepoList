/**
 * Author: Rafael Pernil Bronchalo
 */

const https = require("https");
const fs = require("fs");
const util = require("util");
const writeFilePromise = util.promisify(fs.writeFile);

function generateORRegexString(array) {
  let regexString = "";

  for (let index = 0; index < array.length; index++) {
    const type = array[index];

    regexString = regexString + type;
    if (index < array.length - 1) {
      regexString = regexString + "|";
    }
  }

  return regexString;
}

function parseLink(linkBlock) {
  let linksArray = linkBlock;
  linkBlock = linksArray.length == 2 ? linksArray[1] : linkBlock;
  let parsedLinkObject = {};

  linksArray = linkBlock.split(",");

  for (link of linksArray) {
    linkInfo = /<([^>]+)>;\s+rel="([^"]+)"/gi.exec(link);

    const splittedURL = linkInfo[1].split("/");
    const host = splittedURL[0] + "//" + splittedURL[2];
    const urlWithoutHost = linkInfo[1].replace(host, "");
    parsedLinkObject[linkInfo[2]] = urlWithoutHost;
  }

  return parsedLinkObject;
}

function httpsRequestPromise(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      const link = res.headers.link;

      res.on("end", () => {
        const response = JSON.parse(data);
        if (response.message === "Bad credentials") {
          reject("Bad credentials");
        } else {
          resolve({ data: response, links: parseLink(link) });
        }
      });
    });

    req.on("error", error => {
      reject(error);
    });

    req.end();
  }).catch(reason => {
    new Error(reason);
  });
}

function orderResultsArray(array) {
  array.sort((a, b) => {
    return a.localeCompare(b);
  });
}

function processConsoleInput() {
  let processedInput;
  const helpString = "PARAMETERS:\n" +
    "\t1st param: GitHub Access Token\n" +
    "\t2nd param: GitHub Organisation\n" +
    "\t3rd param: GitHub Property to filter by\n" +
    "\t4th param: Output file path\n" +
    "\t5th and up params: Filter values evaluated as an or condition separated by a space \n";
  switch (process.argv[2]) {
    case "-h":
      console.log(helpString);
      break;
    case undefined:
      console.log(
        "ERROR: No parameters were provided!\n" + helpString);
      break;
    default:
      processedInput = {
        token: process.argv[2],
        orgName: process.argv[3],
        githubPropertyName: process.argv[4],
        outputPath: process.argv[5],
        filterList: process.argv.splice(6)
      };
      break;
  }



  return processedInput;
}

async function getPropertyFromGithubRepoList(
  token,
  orgName,
  githubPropertyName,
  outputPath,
  filterList
) {
  let page = 1;
  const pageSize = 100;
  let accData = [];

  // Initial page
  let nextPage = `/orgs/${orgName}/repos?per_page=${pageSize}&page=${page}`;
  while (nextPage) {
    const options = {
      hostname: "api.github.com",
      path: nextPage,
      method: "GET",
      headers: {
        Authorization: "token " + token,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"
      }
    };

    const response = await httpsRequestPromise(options);
    if (!response) {
      throw new Error("Bad credentials");
    }
    // Get the list of repo names
    const filteredData = response["data"].map(element => element[githubPropertyName]);
    accData = [...accData, ...filteredData];

    nextPage = response.links.next;
    page = page + 1;
  }

  const orRegexString = generateORRegexString(filterList);
  const regexProjectCategory = `.*(${orRegexString}).*`;
  const regex = new RegExp(regexProjectCategory);

  let final = accData.filter(element => regex.test(element));

  orderResultsArray(final);

  await writeFilePromise(outputPath, final.join("\n"), "utf8").then(
    () => {
      console.log(
        `Your list of GitHub projects from ${orgName} is ready and saved at ${outputPath}!`
      );
    },
    reason => {
      throw new Error(
        `The file ${outputPath} could not be saved due to: ${reason}`
      );
    }
  );
}

// Main
const input = processConsoleInput();

if (input) {
  getPropertyFromGithubRepoList(
    input.token,
    input.orgName,
    input.githubPropertyName,
    input.outputPath,
    input.filterList
  ).catch(reason => {
    console.error(reason);
  });
}
