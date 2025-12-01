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

# Create and push branch
git checkout -b "${BRANCH_NAME}"
git push --set-upstream origin "${BRANCH_NAME}"
echo "Created and pushed branch ${BRANCH_NAME}"

# Read current tag
CURRENT_TAG=$(yq eval ".chartsVersions[\"${REPO_NAME}\"]" "${TARGET_FILE}")

if [ "${CURRENT_TAG}" = "${TAG}" ]; then
  echo "Tag unchanged (${TAG}); skipping update."
  exit 0
fi

# Update tag
yq eval -i ".chartsVersions[\"${REPO_NAME}\"] = \"${TAG}\"" "${TARGET_FILE}"

git add "${TARGET_FILE}"
git commit -m "chore(${REPO_NAME}): update chart tag to ${TAG}"

# Push using authenticated remote with PAT
git remote set-url origin "https://x-access-token:${GH_PAT}@github.com/MapColonies/site-values"
git push origin "${BRANCH_NAME}"

echo "Updated ${TARGET_FILE} with chart tag ${TAG} on branch ${BRANCH_NAME}"

# gh pr create -B master -H ${BRANCH_NAME} --title 'Merge ${BRANCH_NAME} into master' --body 'Created by Github action'
