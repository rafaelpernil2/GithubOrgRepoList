/**
 * Author: Rafael Pernil Bronchalo
 */

// Performance tweaks
const pageSize = 100;

const https = require("https");
const fs = require("fs");
const util = require("util");
const writeFilePromise = util.promisify(fs.writeFile);

function createOrRegExp(array) {
  const lastTerm = array.pop();
  const partialRegex = array.reduce((acc, term) => acc = `${acc}${term}|`, "");
  const totalRegex = `.*(${partialRegex}${lastTerm}).*`;
  return new RegExp(totalRegex);
}

function parseLink(linkBlock) {

  const parsedLinkObject = {};
  const linksArray = linkBlock.split(",");

  for (link of linksArray) {
    const linkInfo = /<([^>]+)>;\s+rel="([^"]+)"/gi.exec(link);
    const linkData = {
      url: linkInfo[1],
      relation: linkInfo[2]
    }
    parsedLinkObject[linkData.relation] = getRelativeURL(linkData.url);
  }

  return parsedLinkObject;
}

function getRelativeURL(url) {
  const splittedURL = url.split("/");
  const host = splittedURL[0] + "//" + splittedURL[2];
  return url.replace(host, "");
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

function resultProcessing(array, filterList) {
  // Create Regex filter
  const orRegex = createOrRegExp(filterList);
  // Filter by regex
  const final = array.filter(element => orRegex.test(element));
  // Order the result
  orderResultsArray(final);

  return final;
}

async function writeToFile(result, outputPath, orgName) {
  // Write to file
  await writeFilePromise(outputPath, result.join("\n"), "utf8").then(
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

async function getPropertyFromGithubRepoList(token, orgName, githubPropertyName) {
  let page = 1;
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
    accData = accData.concat(filteredData);

    nextPage = response.links.next;
    page = page + 1;
  }
  return accData;

}

// Main
(async () => {
  const input = processConsoleInput();

  if (input) {
    const result = await getPropertyFromGithubRepoList(
      input.token,
      input.orgName,
      input.githubPropertyName
    ).catch(reason => {
      console.error(reason);
    });
    const final = resultProcessing(result, input.filterList);
    await writeToFile(final, input.outputPath, input.orgName);
  }
})();