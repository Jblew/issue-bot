import { run, checkInputs } from './issue-bot';
const core = require('@actions/core');

// 'string,  string2, string3' => ['string1', 'string2', 'string3']
const listToArray = (list, delimiter = ',') => {
  return list.split(delimiter).map(a => a.trim());
};

try {
  const inputs = {
    token: core.getInput('token'),
    title: core.getInput('title'),
    body: core.getInput('body'),
    labels: core.getInput('labels'),
    assignees: core.getInput('assignees'),
    projectType: core.getInput('project-type'),
    project: core.getInput('project'),
    projectV2: core.getInput('project-v2-path'),
    column: core.getInput('column'),
    milestone: core.getInput('milestone'),
    pinned: core.getInput('pinned') === 'true',
    closePrevious: core.getInput('close-previous') === 'true',
    skipOnPrevious: core.getInput('skip-on-previous') === 'true',
    atDatetimeISO: core.getInput('at-datetime-iso') || undefined,
    rotateAssignees: core.getInput('rotate-assignees') === 'true',
    linkedComments: core.getInput('linked-comments') === 'true',
    linkedCommentsNewIssueText: core.getInput('linked-comments-new-issue-text'),
    linkedCommentsPreviousIssueText: core.getInput('linked-comments-previous-issue-text'),
    multiple: core.getInput('multiple')
  };
  if (inputs.multiple) {
    runMultiple(inputs, parseMultiple(inputs.multiple));
  } else {
    runSingle(inputs);
  }
} catch (error) {
  core.setFailed(error);
}

function runSingle (inputs) {
  const inputsValid = checkInputs(inputs);

  if (!inputsValid) {
    throw new Error('Invalid inputs');
  }

  if (inputs.labels) {
    inputs.labels = listToArray(inputs.labels);
  }

  if (inputs.assignees) {
    inputs.assignees = listToArray(inputs.assignees);
  }

  if (inputs.atDatetimeISO) {
    const timestamp = Date.parse(inputs.atDatetimeISO);
    if (isNaN(timestamp)) {
      throw new Error('Invalid ISO datetime in atDatetimeISO');
    }
    inputs.atDatetimeISO = new Date(timestamp);
  }

  // default type of project board is repository board
  // https://docs.github.com/en/github/managing-your-work-on-github/about-project-boards
  if (!inputs.projectType) {
    inputs.projectType = 'repository';
  }

  run(inputs);
}

function parseMultiple (multipleRaw) {
  try {
    const items = JSON.parse(multipleRaw);
    if (!Array.isArray(items)) {
      throw new Error('Not an array');
    }
    return items;
  } catch (error) {
    throw new Error(`Input 'multiple' has invalid JSON: ${error}`);
  }
}

function runMultiple (commonInputs, multipleItems) {
  for (const single of multipleItems) {
    runSingle({ ...commonInputs, ...single });
  }
}
