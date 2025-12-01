#!/usr/bin/env bash
set -euo pipefail

BRANCH_NAME="${REPO_NAME}-${GITHUB_SHA}"
TARGET_FILE="${DOMAIN}/environments/dev.yaml"

# Ensure repo is up to date and on master
git fetch origin --prune
git checkout master

git config user.name "github-actions"
git config user.email "github-actions@github.com"
git remote set-url origin "https://x-access-token:${GH_PAT}@github.com/MapColonies/site-values"

# Read current tag
CURRENT_TAG=$(yq eval ".chartsVersions[\"${REPO_NAME}\"]" "${TARGET_FILE}")

if [ "${CURRENT_TAG}" = "${TAG}" ]; then
  echo "Tag unchanged (${TAG}); skipping update."
  exit 0
fi

# Update the file in the working tree only; let the PR action commit/push
yq eval -i ".chartsVersions[\"${REPO_NAME}\"] = \"${TAG}\"" "${TARGET_FILE}"
git status --porcelain
echo "Prepared changes in ${TARGET_FILE}; PR action will commit and open a PR on branch ${BRANCH_NAME} targeting master."
